#!/usr/bin/env python3
"""
Import by sub-category — reads categories from the local API, searches listV2.
No Postgres dependency — uses HTTP only.

Usage:
    python3 scripts/import-by-subcat.py                    # Run
    python3 scripts/import-by-subcat.py --resume           # Resume
"""

import json, os, sys, time, urllib.request, urllib.error, urllib.parse

STATE_FILE = '/tmp/bangparjo-subcat-state.json'
LOG_FILE = '/tmp/bangparjo-subcat-import-log.txt'
BASE_URL = 'https://bangparjo.shop'
CJ_PROXY = f'{BASE_URL}/api/cj-proxy'
BULK_URL = f'{BASE_URL}/api/admin/bulk-import'
CAT_API = f'{BASE_URL}/api/categories/menu'

def log(msg):
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')

def api_get(url, retries=3):
    for a in range(retries):
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read())
        except Exception as e:
            if a < retries-1:
                time.sleep(3)
                continue
            return {'error': str(e)}
    return {'error': 'Max retries'}

def api_post(url, data):
    try:
        req = urllib.request.Request(url)
        req.add_header('Content-Type', 'application/json')
        req.data = json.dumps(data).encode()
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try: return json.loads(body) if body else {'error': f'HTTP {e.code}'}
        except: return {'error': f'HTTP {e.code}: {body[:100]}'}

def search_listv2(keyword, page=1, size=100):
    params = f'page={page}&size={size}&orderBy=1&sort=desc&keyWord={urllib.parse.quote(keyword)}'
    params += '&features=enable_description'
    url = f'{CJ_PROXY}?endpoint={urllib.parse.quote(f"/v1/product/listV2?{params}", safe="")}'
    result = api_get(url)
    if result.get('success') and result.get('data'):
        products = []
        for c in result['data'].get('content', []):
            for p in c.get('productList', []):
                pid = p.get('id', '')
                if pid and len(pid) > 5:
                    p['pid'] = pid
                    products.append(p)
        return products
    return []

def bulk_import(products):
    result = api_post(BULK_URL, {'products': products})
    if result.get('success') and result.get('data'):
        return result['data']
    return None

def flatten_categories(cats, depth=0):
    """Get all category names (level 2 and 3)."""
    names = []
    for c in cats:
        name = c.get('name', '')
        children = c.get('children', [])
        if depth > 0 or not children:
            # Level 2 and level 3 categories
            if name and len(name) > 2:
                names.append(name)
        if children:
            names.extend(flatten_categories(children, depth + 1))
    return names

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--keywords-per-run', type=int, default=10, help='Keywords per cron run (default: 10)')
    parser.add_argument('--max-pages', type=int, default=5, help='Pages per keyword (default: 5)')
    args = parser.parse_args()

    with open(LOG_FILE, 'w') as f:
        f.write(f'=== Sub-Category Importer ===\n{time.strftime("%Y-%m-%d %H:%M:%S")}\n\n')

    # Get categories from local API
    log('Fetching category tree from local DB...')
    result = api_get(CAT_API)
    if result.get('error'):
        log(f'Failed to get categories: {result["error"]}')
        return
    
    cats = result.get('data', [])
    if not cats:
        log('No categories found')
        return
    
    # Get all level 2 and 3 category names
    cat_names = flatten_categories(cats)
    cat_names = list(set(cat_names))  # Deduplicate
    cat_names.sort()
    log(f'Found {len(cat_names)} level-2/3 categories')
    
    # Load state
    start_idx = 0
    all_pids = set()
    total_new = 0
    
    if args.resume and os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            state = json.load(f)
            start_idx = state.get('idx', 0)
            all_pids = set(state.get('pids', []))
            total_new = state.get('imported', 0)
            log(f'Resuming from #{start_idx}/{len(cat_names)} ({total_new} imported so far)')
    
    end_idx = min(start_idx + args.keywords_per_run, len(cat_names))
    batch = cat_names[start_idx:end_idx]
    
    log(f'Processing {len(batch)} categories (#{start_idx+1}-#{end_idx})')
    log('')
    
    for idx, name in enumerate(batch, start_idx):
        log(f'[{idx+1}/{len(cat_names)}] {name}')
        page = 1
        kw_new = 0
        while page <= args.max_pages:
            products = search_listv2(name, page, 100)
            if not products:
                break
            
            new_prods = [p for p in products if p['pid'] not in all_pids]
            
            if new_prods:
                imp = bulk_import(new_prods)
                if imp:
                    c = imp.get('imported', 0)
                    kw_new += c
                    total_new += c
                    for p in new_prods:
                        all_pids.add(p['pid'])
                    log(f'  Page {page}: +{c} new')
                else:
                    log(f'  Page {page}: bulk import failed')
            else:
                if page == 1:
                    pass  # Quiet for "all skipped"
                else:
                    log(f'  Page {page}: all skipped')
                break
            
            if len(products) < 100:
                break
            page += 1
            time.sleep(0.3)
        
        if kw_new > 0:
            log(f'  💎 +{kw_new} products from "{name}"')
        
        log('')
        
        # Save state after each keyword
        with open(STATE_FILE, 'w') as f:
            json.dump({'idx': idx + 1, 'pids': list(all_pids), 'imported': total_new}, f)
        
        time.sleep(0.5)
    
    # Summary
    remaining = len(cat_names) - end_idx
    log(f'📊 THIS RUN: +{total_new - (total_new - (total_new if start_idx == 0 else 0))} wait...')
    log(f'📊 THIS RUN: Imported, total so far: {total_new}')
    if remaining > 0:
        log(f'📅 Remaining categories for next run: {remaining}')
        log(f'   Resume with: python3 scripts/import-by-subcat.py --resume')
    else:
        log(f'✅ ALL {len(cat_names)} CATEGORIES COMPLETE!')
        if os.path.exists(STATE_FILE):
            os.remove(STATE_FILE)

if __name__ == '__main__':
    main()
