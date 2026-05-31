#!/usr/bin/env python3
"""
BangParjo Direct Importer v2.1 — Imports CJ products (shell only, no variants)
Direct CJ API calls + local bulk import (no CJ proxy needed).

Usage:
    python3 scripts/import-direct.py                     # Default: 100 products
    python3 scripts/import-direct.py --count 200         # Import 200 products
    python3 scripts/import-direct.py --category <catId>  # Specific category
    python3 scripts/import-direct.py --keyword "phone"   # Search keyword
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
import argparse
import hashlib
import hmac

BASE_URL = os.environ.get('BASE_URL', 'https://bangparjo.shop')
BULK_IMPORT_URL = f'{BASE_URL}/api/admin/bulk-import'
LOCAL_BULK_IMPORT_URL = 'http://localhost:3000/api/admin/bulk-import'
STATE_FILE = '/tmp/bangparjo-import-direct-state.json'
LOG_FILE = '/tmp/bangparjo-import-direct-log.txt'

# CJ API Config
CJ_API_KEY = "CJ162155@api@87abcf5b70ba4323a29a3124fa4872d9"
CJ_API = "https://developers.cjdropshipping.com/api2.0"


def log(msg):
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{timestamp}] {msg}'
    print(line)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')


# ── CJ Authentication ─────────────────────────────────────────────────

def cj_get_token():
    """Get access token from CJ API using API key."""
    url = f"{CJ_API}/v1/authentication/getAccessToken"
    body = json.dumps({"apiKey": CJ_API_KEY}).encode()
    
    req = urllib.request.Request(url, data=body, headers={
        'Content-Type': 'application/json',
        'User-Agent': 'BangParjo-Importer/2.1'
    })
    
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    
    if not data.get('success') and not data.get('result'):
        raise Exception(f"Auth failed: {data.get('message', 'Unknown')}")
    
    token = data['data']['accessToken']
    log(f'  🔑 Got CJ access token')
    return token


# ── CJ API Search ────────────────────────────────────────────────────────

token_cache = None
token_expiry = 0

def cj_get_token_cached():
    global token_cache, token_expiry
    if token_cache and time.time() * 1000 < token_expiry:
        return token_cache
    
    # Extended caching - CJ caches the same token for 24h
    # but we can safely cache for a few minutes
    if token_cache and time.time() * 1000 < token_expiry:
        return token_cache
    
    token_cache = cj_get_token()
    token_expiry = time.time() * 1000 + 15 * 60 * 1000  # 15 min cache
    return token_cache


def cj_api_get(endpoint, retries=3):
    """Direct GET to CJ API."""
    token = cj_get_token_cached()
    
    for attempt in range(retries):
        try:
            url = f"{CJ_API.rstrip('/')}/{endpoint.lstrip('/')}"
            req = urllib.request.Request(url, headers={
                'CJ-Access-Token': token,
                'User-Agent': 'BangParjo-Importer/2.1'
            })
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            try:
                err = json.loads(body)
                msg = (err.get('message') or '').lower()
                code = err.get('code')
                
                # Token expired - refresh
                if code in (1600101, 1600102) or 'access token' in msg:
                    global token_cache
                    token_cache = None
                    token = cj_get_token()
                    token_cache = token
                    continue
                
                # QPS limit
                if code == 1600100 or 'qps' in msg:
                    wait = min(20 * (attempt + 1), 60)
                    log(f'  ⏳ QPS limit, waiting {wait}s...')
                    time.sleep(wait)
                    continue
                    
                log(f'  ⚠️  API error HTTP {e.code}: {msg[:100]}')
                return err
            except:
                log(f'  ⚠️  HTTP {e.code}: {body[:100]}')
                return {'error': f'HTTP {e.code}', 'code': e.code}
        except Exception as e:
            if attempt < retries - 1:
                wait = 5 * (attempt + 1)
                log(f'  ⚠️  Error: {str(e)[:60]}, retry in {wait}s...')
                time.sleep(wait)
                continue
            return {'error': str(e)}
    return {'error': 'Max retries'}


def search_list_v1(page=1, size=100, keyword=''):
    """Search CJ products via list API (v1)."""
    params = f'pageNum={page}&pageSize={size}'
    if keyword:
        params += f'&keyWord={urllib.parse.quote(keyword)}'
    
    result = cj_api_get(f'/v1/product/list?{params}')
    
    if result.get('success') and result.get('data'):
        data = result['data']
        products = data.get('list', [])
        total = data.get('total', 0)
        log(f'  📦 Found {len(products)} products (total: {total})')
        return {
            'products': products,
            'total': total,
            'page': page
        }
    
    msg = result.get('message', result.get('error', 'Unknown'))
    log(f'  ❌ Search fail: {str(msg)[:100]}')
    return {'products': [], 'total': 0, 'error': msg}


def search_list_v2(page=1, size=100, keyword='', category_id=''):
    """Search CJ products via listV2 (Elasticsearch)."""
    params = f'page={page}&size={size}&orderBy=1&sort=desc&features=enable_description'
    if keyword:
        params += f'&keyWord={urllib.parse.quote(keyword)}'
    if category_id:
        params += f'&categoryId={category_id}'
    
    result = cj_api_get(f'/v1/product/listV2?{params}')
    
    if result.get('success') and result.get('data'):
        data = result['data']
        products = []
        for content in data.get('content', []):
            for p in content.get('productList', []):
                pid = p.get('id', '')
                if pid and len(pid) > 5:
                    products.append(p)
        
        total = data.get('totalRecords', 0)
        log(f'  📦 Found {len(products)} products on page {page} (total: {total})')
        return {
            'products': products,
            'total': total,
            'page': page,
            'total_pages': data.get('totalPages', 0)
        }
    
    msg = result.get('message', result.get('error', 'Unknown'))
    log(f'  ❌ SearchV2 fail: {str(msg)[:100]}')
    return {'products': [], 'total': 0, 'error': msg}


def bulk_import_local(products, page_num):
    """Import products directly to local DB via localhost endpoint (fastest)."""
    log(f'  📦 Bulk importing {len(products)} products from page {page_num}...')
    
    # Format products for bulk import
    formatted = []
    for p in products:
        pid = p.get('id') or p.get('pid')
        if not pid:
            continue
        formatted.append({
            'id': pid,
            'pid': pid,
            'nameEn': p.get('nameEn') or p.get('productNameEn', ''),
            'productImage': p.get('bigImage') or p.get('productImage', ''),
            'bigImage': p.get('bigImage') or p.get('productImage', ''),
            'description': p.get('description', ''),
            'categoryId': p.get('categoryId', ''),
            'sellPrice': p.get('sellPrice', ''),
            'productWeight': p.get('productWeight', ''),
            'productSku': p.get('productSku', ''),
        })
    
    payload = json.dumps({'products': formatted, 'pageInfo': {'page': page_num}}).encode()
    
    for attempt in range(3):
        try:
            req = urllib.request.Request(LOCAL_BULK_IMPORT_URL, data=payload, headers={
                'Content-Type': 'application/json'
            })
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read())
            
            if result.get('success') and result.get('data'):
                d = result['data']
                log(f'     ✅ {d["imported"]} imported, {d["skipped"]} skipped, {d["errors"]} errors')
                return d
            else:
                err = result.get('error', result.get('message', 'Unknown'))
                log(f'     ⚠️  Import response: {str(err)[:100]}')
                return result.get('data')
        except Exception as e:
            if attempt < 2:
                log(f'  ⚠️  Import error, retry {attempt+1}: {str(e)[:60]}')
                time.sleep(3)
                continue
            log(f'  ❌ Import failed: {str(e)[:100]}')
            return None


def save_state(state):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)
    log(f'  💾 State saved (page {state.get("current_page")}, {state.get("total_imported")} imported)')


def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return None


def main():
    parser = argparse.ArgumentParser(description='Direct CJ import — no proxy, one DB call per page')
    parser.add_argument('--count', type=int, default=100, help='Target products (default: 100)')
    parser.add_argument('--keyword', type=str, default='', help='Search keyword')
    parser.add_argument('--category', type=str, default='', help='Category ID')
    parser.add_argument('--page', type=int, default=1, help='Start page')
    parser.add_argument('--max-pages', type=int, default=10, help='Max pages')
    parser.add_argument('--resume', action='store_true', help='Resume from saved state')
    parser.add_argument('--v2', action='store_true', help='Use listV2 API (default: v1)')
    args = parser.parse_args()
    
    # Init log
    with open(LOG_FILE, 'w') as f:
        f.write(f'=== BangParjo Direct Importer v2.1 ===\n')
        f.write(f'Started: {time.strftime("%Y-%m-%d %H:%M:%S")}\n')
        f.write(f'Target: {args.count} products\n\n')
    
    current_page = args.page
    total_imported = 0
    
    if args.resume:
        state = load_state()
        if state:
            current_page = state.get('current_page', args.page)
            total_imported = state.get('total_imported', 0)
            log(f'📋 Resuming page {current_page} ({total_imported} already imported)')
    
    log(f'🚀 BangParjo Direct Importer v2.1')
    log(f'   Target: {args.count} products')
    log(f'   Search: {"listV2" if args.v2 else "listV1"} page {current_page}+')
    if args.keyword:
        log(f'   Keyword: {args.keyword}')
    if args.category:
        log(f'   Category: {args.category}')
    log(f'   Import: direct to DB via localhost')
    log('')
    
    while total_imported < args.count and current_page <= args.max_pages:
        # Search
        if args.v2:
            result = search_list_v2(
                page=current_page, size=100,
                keyword=args.keyword, category_id=args.category
            )
        else:
            result = search_list_v1(
                page=current_page, size=100,
                keyword=args.keyword
            )
        
        if result.get('error'):
            log(f'   Page {current_page} failed, retrying in 30s...')
            time.sleep(30)
            continue
        
        products = result.get('products', [])
        if not products:
            log(f'   Page {current_page}: No products found. Done.')
            break
        
        remaining = args.count - total_imported
        if len(products) > remaining:
            products = products[:remaining]
        
        # Bulk import (0 CJ API calls for import!)
        import_result = bulk_import_local(products, current_page)
        
        if import_result:
            total_imported += import_result.get('imported', 0)
            log(f'   📊 Progress: {total_imported}/{args.count} imported')
        
        save_state({'current_page': current_page + 1, 'total_imported': total_imported})
        
        if total_imported >= args.count:
            log(f'\n✅ Target reached: {total_imported} products imported!')
            if os.path.exists(STATE_FILE):
                os.remove(STATE_FILE)
            break
        
        if len(products) < 100:
            log(f'   Last page reached.')
            break
        
        current_page += 1
        time.sleep(1)  # Respect CJ API rate limits
    
    log('')
    log('=' * 50)
    log('📊 IMPORT SUMMARY')
    log(f'   Total imported: {total_imported}')
    log(f'   Pages scanned: {current_page - args.page + 1}')
    log(f'   CJ API calls: {current_page - args.page + 1}')
    log(f'   Mode: products without variants (shell only)')
    log('=' * 50)
    log(f'\nLog: {LOG_FILE}')


if __name__ == '__main__':
    main()
