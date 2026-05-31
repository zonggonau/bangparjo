#!/usr/bin/env python3
"""
Level-3 Category Importer — import products by exact CJ categoryId.
Uses listV2 with categoryId filter (not keyword) for precise results.
State file tracks progress across runs. 0 extra CJ calls for import.

Usage:
    python3 scripts/import-by-l3.py                         # Run
    python3 scripts/import-by-l3.py --resume                # Resume
    python3 scripts/import-by-l3.py --cats-per-run 100      # 100 cats per run
"""

import json, os, sys, time, urllib.request, urllib.error, urllib.parse

STATE_FILE = '/tmp/bangparjo-l3-import-state.json'
LOG_FILE = '/tmp/bangparjo-l3-import-log.txt'
L3_CATS_FILE = '/tmp/bangparjo-l3-categories.json'
BASE_URL = 'https://bangparjo.shop'
CJ_PROXY = f'{BASE_URL}/api/cj-proxy'
BULK_URL = f'{BASE_URL}/api/admin/bulk-import'
CAT_ALL_URL = f'{BASE_URL}/api/categories/all'

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
            req.add_header('User-Agent', 'BangParjo/3.2')
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            try:
                err = json.loads(body)
                m = err.get('message', err.get('error', ''))
                if 'daily' in m.lower() or 'too many' in m.lower() or 'qps' in m.lower():
                    log(f'  Daily limit hit!')
                    return {'error': 'daily_limit'}
                return err
            except:
                return {'error': f'HTTP {e.code}'}
        except Exception as e:
            if a < retries-1:
                time.sleep(5)
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
    except Exception as e:
        return {'error': str(e)}

def search_by_category(l3_cj_id, page=1, size=100):
    """Search listV2 by exact level-3 category ID."""
    params = f'page={page}&size={size}&categoryId={l3_cj_id}&orderBy=1&sort=desc'
    params += '&features=enable_description'
    url = f'{CJ_PROXY}?endpoint={urllib.parse.quote(f"/v1/product/listV2?{params}", safe="")}'
    result = api_get(url)
    if result.get('error') == 'daily_limit':
        return {'error': 'daily_limit'}
    if result.get('success') and result.get('data'):
        products = []
        for c in result['data'].get('content', []):
            for p in c.get('productList', []):
                pid = p.get('id', '')
                if pid and len(pid) > 5:
                    p['pid'] = pid
                    products.append(p)
        return {'products': products, 'total': result['data'].get('totalRecords', 0)}
    return {'products': [], 'total': 0}

def bulk_import(products):
    result = api_post(BULK_URL, {'products': products})
    if result.get('success') and result.get('data'):
        return result['data']
    return None

def get_l3_categories():
    """Get all level-3 categories, cache locally."""
    if os.path.exists(L3_CATS_FILE):
        with open(L3_CATS_FILE) as f:
            return json.load(f)
    result = api_get(CAT_ALL_URL)
    if result.get('success') and result.get('data'):
        cats = result['data']
        with open(L3_CATS_FILE, 'w') as f:
            json.dump(cats, f)
        log(f'Fetched {len(cats)} level-3 categories')
        return cats
    log(f'Failed to get categories: {result.get("error","?")}')
    return []

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--cats-per-run', type=int, default=50, help='Categories per run (default: 50)')
    parser.add_argument('--max-pages', type=int, default=3, help='Max pages per category (default: 3)')
    args = parser.parse_args()

    with open(LOG_FILE, 'w') as f:
        f.write(f'=== Level-3 Category Importer ===\n{time.strftime("%Y-%m-%d %H:%M:%S")}\n\n')

    # Get all level-3 categories
    cats = get_l3_categories()
    if not cats:
        return
    total_cats = len(cats)

    # Load state
    start_idx = 0
    total_new = 0
    
    if args.resume and os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            state = json.load(f)
            start_idx = state.get('idx', 0)
            total_new = state.get('imported', 0)
            log(f'Resuming from #{start_idx}/{total_cats} ({total_new} imported so far)')

    end_idx = min(start_idx + args.cats_per_run, total_cats)
    batch = cats[start_idx:end_idx]
    
    log(f'Processing {len(batch)} L3 categories (#{start_idx+1}-#{end_idx}/{total_cats})')
    log('')

    for idx, cat in enumerate(batch, start_idx):
        name = cat.get('name', '?')
        cj_id = cat.get('cjId', '')
        l1 = cat.get('categoryL1', '')
        l2 = cat.get('categoryL2', '')
        
        if not cj_id or len(cj_id) < 5:
            continue

        log(f'[{idx+1}/{total_cats}] {name}')
        log(f'       {l1} > {l2}')
        
        page = 1
        cat_new = 0
        hit_limit = False
        
        while page <= args.max_pages:
            result = search_by_category(cj_id, page)
            
            if result.get('error') == 'daily_limit':
                hit_limit = True
                log(f'  ⛔ Daily limit reached!')
                break
            
            products = result.get('products', [])
            if not products:
                break
            
            # Only keep products with a categoryId matching (sometimes API returns broad results)
            cat_products = [p for p in products if p.get('categoryId', '') == cj_id]
            if not cat_products:
                cat_products = products  # fallback
            
            imp = bulk_import(cat_products)
            if imp:
                c = imp.get('imported', 0)
                cat_new += c
                total_new += c
                if c > 0 or page == 1:
                    log(f'  Page {page}: +{c} new (from {len(cat_products)})')
            
            if len(products) < 100:
                break
            page += 1
            time.sleep(0.3)
        
        if hit_limit:
            # Save state and stop
            with open(STATE_FILE, 'w') as f:
                json.dump({'idx': idx, 'imported': total_new}, f)
            log(f'\n⛔ Daily limit. Saved state at #{idx}. Resume with --resume')
            break
        
        if cat_new > 0:
            log(f'  💎 +{cat_new} from "{name}"')
        log('')
        
        # Save state periodically
        with open(STATE_FILE, 'w') as f:
            json.dump({'idx': idx + 1, 'imported': total_new}, f)
        
        time.sleep(0.5)
    
    remaining = total_cats - end_idx
    log(f'📊 THIS RUN: {total_new} new products imported')
    if remaining > 0 and not any('⛔' in l for l in open(LOG_FILE).readlines()):
        log(f'📅 Remaining L3 categories: {remaining}')
        log(f'   Next run: python3 scripts/import-by-l3.py --resume')
    else:
        log(f'✅ ALL {total_cats} LEVEL-3 CATEGORIES COMPLETE!')
        if os.path.exists(STATE_FILE):
            os.remove(STATE_FILE)

if __name__ == '__main__':
    main()
