#!/usr/bin/env python3
"""
BangParjo Bulk Importer v2 — Import products from CJ listV2 directly.
Phase 1: Search listV2 (1 API call per page)
Phase 2: Bulk import to DB via local endpoint (0 CJ API calls!)

Usage:
    python3 scripts/bulk-import-cj.py                     # Default: 100 products, page 1+
    python3 scripts/bulk-import-cj.py --count 100         # Import 100 products
    python3 scripts/bulk-import-cj.py --resume            # Resume from saved state
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
import argparse

BASE_URL = os.environ.get('BASE_URL', 'https://bangparjo.shop')
CJ_PROXY_URL = f'{BASE_URL}/api/cj-proxy'
BULK_IMPORT_URL = f'{BASE_URL}/api/admin/bulk-import'
STATE_FILE = '/tmp/bangparjo-import-state.json'
LOG_FILE = '/tmp/bangparjo-import-log.txt'


def log(msg):
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{timestamp}] {msg}'
    print(line)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')


def api_get(url, retries=3):
    """GET request with retry."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'BangParjo-Importer/2.0')
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            try:
                err = json.loads(body)
                msg = err.get('message', err.get('error', ''))
                if 'daily' in msg.lower() or 'too many' in msg.lower() or 'qps' in msg.lower():
                    wait = min(60 * (attempt + 1), 180)
                    log(f'  Rate limited, waiting {wait}s (attempt {attempt+1})')
                    time.sleep(wait)
                    continue
                return err
            except:
                return {'error': f'HTTP {e.code}: {body[:100]}'}
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(5 * (attempt + 1))
                continue
            return {'error': str(e)}
    return {'error': 'Max retries'}


def api_post(url, data, retries=3):
    """POST request with retry."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header('Content-Type', 'application/json')
            req.add_header('User-Agent', 'BangParjo-Importer/2.0')
            req.data = json.dumps(data).encode()
            with urllib.request.urlopen(req, timeout=120) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            try:
                return json.loads(body) if body else {'error': f'HTTP {e.code}'}
            except:
                return {'error': f'HTTP {e.code}: {body[:100]}'}
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(3)
                continue
            return {'error': str(e)}
    return {'error': 'Max retries'}


def search_page(page=1, size=100, order_by=1, sort='desc'):
    """Get one page of products from listV2."""
    params = f'page={page}&size={size}&orderBy={order_by}&sort={sort}'
    params += '&features=enable_description'
    endpoint = f'/v1/product/listV2?{params}'
    url = f'{CJ_PROXY_URL}?endpoint={urllib.parse.quote(endpoint, safe="")}'

    log(f'  📡 Fetching page {page} (size={size})...')
    result = api_get(url)

    if result.get('error') == 'daily_limit':
        return result

    if result.get('success') and result.get('data'):
        data = result['data']
        products = []
        for content in data.get('content', []):
            for p in content.get('productList', []):
                pid = p.get('id', '')
                if pid and len(pid) > 5:
                    # Normalize to what bulk-import expects
                    p['pid'] = pid
                    products.append(p)

        return {
            'products': products,
            'page': data.get('pageNumber', page),
            'total_pages': data.get('totalPages', 0),
            'total_records': data.get('totalRecords', 0),
        }

    msg = result.get('message', result.get('error', 'Unknown'))
    log(f'  Search failed: {msg[:100]}')
    return {'products': [], 'page': page, 'total_pages': 0}


def bulk_import(products, page_num):
    """Import a batch of products with 0 CJ API calls."""
    log(f'  📦 Bulk importing {len(products)} products from page {page_num}...')
    result = api_post(BULK_IMPORT_URL, {'products': products, 'pageInfo': {'page': page_num}})

    if result.get('success') and result.get('data'):
        d = result['data']
        log(f'     ✅ {d["imported"]} imported, {d["skipped"]} skipped, {d["errors"]} errors')
        return d
    else:
        err = result.get('error', result.get('message', 'Unknown'))
        log(f'     ❌ Bulk import failed: {err[:100]}')
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
    parser = argparse.ArgumentParser(description='Bulk import from CJ listV2 — zero extra API calls')
    parser.add_argument('--count', type=int, default=100, help='Target products to import (default: 100)')
    parser.add_argument('--page', type=int, default=1, help='Start page (default: 1)')
    parser.add_argument('--max-pages', type=int, default=10, help='Max pages to scan (default: 10)')
    parser.add_argument('--order-by', type=int, default=1, help='0=best match, 1=listing count, 2=price, 3=create time')
    parser.add_argument('--sort', type=str, default='desc')
    parser.add_argument('--resume', action='store_true', help='Resume from saved state')
    parser.add_argument('--keyword', type=str, default='', help='Search keyword')
    args = parser.parse_args()

    # Init log
    with open(LOG_FILE, 'w') as f:
        f.write(f'=== BangParjo Bulk Importer v2 ===\n')
        f.write(f'Started: {time.strftime("%Y-%m-%d %H:%M:%S")}\n')
        f.write(f'Target: {args.count} products\n\n')

    # Load state or start fresh
    current_page = args.page
    total_imported = 0

    if args.resume:
        state = load_state()
        if state:
            current_page = state.get('current_page', args.page)
            total_imported = state.get('total_imported', 0)
            log(f'📋 Resuming from page {current_page} ({total_imported} already imported)')
        else:
            log('📋 No saved state, starting fresh')

    log(f'🚀 BangParjo Bulk Importer v2')
    log(f'   Target: {args.count} products')
    log(f'   Search: listV2 page {current_page}+')
    log(f'   Import: 0 CJ API calls (direct to DB)')
    log('')

    while total_imported < args.count and current_page <= args.max_pages:
        # Search
        result = search_page(
            page=current_page,
            size=100,
            order_by=args.order_by,
            sort=args.sort,
        )

        if result.get('error') == 'daily_limit':
            log('⚠️  Daily API limit reached.')
            save_state({'current_page': current_page, 'total_imported': total_imported})
            break

        products = result.get('products', [])
        if not products:
            log(f'   Page {current_page}: No products found. Done.')
            break

        # Need to limit to remaining count
        remaining = args.count - total_imported
        if len(products) > remaining:
            products = products[:remaining]

        # Bulk import (0 CJ API calls!)
        import_result = bulk_import(products, current_page)

        if import_result:
            total_imported += import_result.get('imported', 0)
            log(f'   📊 Progress: {total_imported}/{args.count} imported')

        # Save state after each page
        save_state({'current_page': current_page + 1, 'total_imported': total_imported})

        # Check if done
        if total_imported >= args.count:
            log(f'\n✅ Target reached: {total_imported} products imported!')
            if os.path.exists(STATE_FILE):
                os.remove(STATE_FILE)
            break

        # If page has fewer products than requested size, we're at the end
        if len(products) < 100:
            log(f'   Last page reached.')
            if os.path.exists(STATE_FILE):
                os.remove(STATE_FILE)
            break

        current_page += 1
        # Small delay between pages
        time.sleep(0.5)

    # Final summary
    log('')
    log('=' * 50)
    log('📊 IMPORT SUMMARY')
    log(f'   Total imported: {total_imported}')
    log(f'   Pages scanned: {current_page - args.page + 1}')
    log(f'   CJ API calls used: {current_page - args.page + 1} (search only)')
    log(f'   CJ API calls for import: 0!')
    log('=' * 50)
    log(f'\nLog: {LOG_FILE}')


if __name__ == '__main__':
    main()
