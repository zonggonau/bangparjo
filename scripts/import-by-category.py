#!/usr/bin/env python3
"""
BangParjo Category Importer v3 — Import per top-level category using multiple keywords.
Phase 1: For each category, search listV2 with multiple keywords
Phase 2: Bulk import (0 extra CJ API calls)
State file tracks PIDs to avoid duplicates across keywords.

Usage:
    python3 scripts/import-by-category.py                     # Import all categories
    python3 scripts/import-by-category.py --categories Women  # Import one category
    python3 scripts/import-by-category.py --resume            # Resume
"""

import json, os, sys, time, urllib.request, urllib.error, urllib.parse

BASE_URL = os.environ.get('BASE_URL', 'https://bangparjo.shop')
CJ_PROXY = f'{BASE_URL}/api/cj-proxy'
BULK_URL = f'{BASE_URL}/api/admin/bulk-import'
STATE_FILE = '/tmp/bangparjo-cat-import-state.json'
LOG_FILE = '/tmp/bangparjo-cat-import-log.txt'

# Top-level categories with multiple search keywords
CATEGORIES = {
    "Women's Clothing": ["women clothing","women dress","women top","women fashion","womens","blouse","skirt","leggings"],
    "Men's Clothing": ["men clothing","men shirt","men fashion","mens","men jacket","men pants","men hoodie"],
    "Consumer Electronics": ["electronic","phone","charger","laptop","headphone","camera","speaker","smart watch","power bank","USB cable","earphone","tablet"],
    "Health Beauty Hair": ["beauty","skincare","makeup","cosmetic","hair","nail","cream","serum","massage"],
    "Home Improvement": ["home","kitchen","garden","tool","furniture","lamp","light","decor","storage"],
    "Computer Office": ["computer","office","keyboard","mouse","monitor","printer","stationery"],
    "Bags Shoes": ["bag","shoe","sneaker","backpack","handbag","wallet","sandal","boot"],
    "Toys Kids Babies": ["toy","kids","baby","games","educational","stroller","diaper"],
    "Automobiles Motorcycles": ["car","auto","motorcycle","motor","bike","automotive"],
    "Pet Supplies": ["pet","dog","cat","pet supplies","animal"],
    "Jewelry Watches": ["jewelry","watch","necklace","ring","bracelet","earring"],
    "Sports": ["sport","fitness","exercise","yoga","cycling","camping","outdoor"],
}

def log(msg):
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')

def api_get(url, retries=3):
    for a in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'BangParjo/3.0')
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            try:
                err = json.loads(body)
                m = err.get('message', err.get('error', ''))
                if 'daily' in m.lower() or 'too many' in m.lower():
                    log(f'  Rate limited, waiting 60s...')
                    time.sleep(60)
                    continue
                return err
            except:
                return {'error': body[:100]}
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
        except: return {'error': f'HTTP {e.code}'}

def search_page(page=1, size=100, keyword=''):
    params = f'page={page}&size={size}&orderBy=1&sort=desc&keyWord={urllib.parse.quote(keyword)}'
    params += '&features=enable_description'
    url = f'{CJ_PROXY}?endpoint={urllib.parse.quote(f"/v1/product/listV2?{params}", safe="")}'
    result = api_get(url)
    if result.get('success') and result.get('data'):
        data = result['data']
        products = []
        for c in data.get('content', []):
            for p in c.get('productList', []):
                pid = p.get('id', '')
                if pid and len(pid) > 5:
                    p['pid'] = pid
                    products.append(p)
        return {
            'products': products,
            'total_pages': data.get('totalPages', 0),
            'total_records': data.get('totalRecords', 0),
        }
    return {'products': [], 'total_pages': 0, 'total_records': 0}

def bulk_import(products):
    result = api_post(BULK_URL, {'products': products})
    if result.get('success') and result.get('data'):
        return result['data']
    return None

def save_state(s):
    with open(STATE_FILE, 'w') as f:
        json.dump(s, f, indent=2)
    log(f'  State saved: {s.get("total_imported",0)} imported')

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return None

def import_category(cat_name, keywords, all_pids, total_target):
    log(f'\n{"="*50}')
    log(f'📦 CATEGORY: {cat_name}')
    log(f'   Keywords: {", ".join(keywords[:3])}...')
    log(f'{"="*50}')
    
    page = 1
    imported = 0
    
    for kw in keywords:
        log(f'\n  🔑 Keyword: "{kw}"')
        page = 1
        while page <= 60 and imported < total_target:
            result = search_page(page, 100, kw)
            products = result.get('products', [])
            
            if not products:
                log(f'     Page {page}: empty')
                break
            
            # Filter out already imported PIDs
            new_products = [p for p in products if p['pid'] not in all_pids]
            
            if new_products:
                imp_result = bulk_import(new_products)
                if imp_result:
                    count = imp_result.get('imported', 0)
                    imported += count
                    for p in new_products:
                        all_pids.add(p['pid'])
                    log(f'     Page {page}: +{count} new (from {len(products)})')
                else:
                    log(f'     Page {page}: bulk import failed')
            else:
                log(f'     Page {page}: all {len(products)} skipped (already in DB)')
            
            if len(products) < 100:
                break
            page += 1
            time.sleep(0.3)
    
    log(f'  ✅ {cat_name}: {imported} new products imported')
    return imported

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--categories', type=str, default='', help='Comma-separated category names')
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--target', type=int, default=6000, help='Max per category')
    args = parser.parse_args()

    with open(LOG_FILE, 'w') as f:
        f.write(f'=== BangParjo Category Importer v3 ===\n')
        f.write(f'Started: {time.strftime("%Y-%m-%d %H:%M:%S")}\n\n')

    all_pids = set()
    categories_to_import = list(CATEGORIES.items())
    
    if args.resume:
        state = load_state()
        if state:
            all_pids = set(state.get('pids', []))
            cat_idx = state.get('category_index', 0)
            categories_to_import = categories_to_import[cat_idx:]
            log(f'📋 Resuming from category index {cat_idx}')
            log(f'   Already have {len(all_pids)} unique PIDs')
    
    total_new = 0
    for idx, (cat_name, keywords) in enumerate(categories_to_import):
        n = import_category(cat_name, keywords, all_pids, args.target)
        total_new += n
        save_state({
            'pids': list(all_pids),
            'category_index': idx + 1,
            'total_imported': total_new,
        })

    log(f'\n{"="*50}')
    log(f'✅ ALL CATEGORIES COMPLETE!')
    log(f'   Total new products: {total_new}')
    log(f'   Total unique PIDs: {len(all_pids)}')
    log(f'{"="*50}')
    
    if os.path.exists(STATE_FILE):
        os.remove(STATE_FILE)

if __name__ == '__main__':
    main()
