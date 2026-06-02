#!/usr/bin/env python3
"""
BangParjo Automated Importer
Import exactly 100 newest products per category.
Tracks progress in import_state.json to resume after interruptions or daily limits.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
import urllib.parse

# --- Configuration ---
# Set BASE_URL to your site URL (e.g., http://localhost:3000)
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:3000')
# Set API_KEY matching SCRIPTS_API_KEY in your .env
API_KEY = os.environ.get('SCRIPTS_API_KEY', 'default_secret_key')

CJ_PROXY = f'{BASE_URL}/api/cj-proxy'
BULK_IMPORT_URL = f'{BASE_URL}/api/admin/bulk-import'
STATE_FILE = 'scripts/import_state.json'
LOG_FILE = 'scripts/import_log.txt'

def log(msg):
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')

def api_request(url, method='GET', data=None):
    try:
        req = urllib.request.Request(url, method=method)
        req.add_header('User-Agent', 'BangParjo-Importer/1.0')
        req.add_header('x-scripts-api-key', API_KEY)
        
        if data:
            req.add_header('Content-Type', 'application/json')
            req.data = json.dumps(data).encode()
            
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 401:
            log("❌ Unauthorized: Check your SCRIPTS_API_KEY")
            sys.exit(1)
        try:
            return json.loads(body)
        except:
            return {'success': False, 'error': f'HTTP {e.code}: {body[:100]}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_categories():
    log("Fetching categories from CJ...")
    # Using the proxy to call CJ getCategory
    url = f'{CJ_PROXY}?endpoint={urllib.parse.quote("/v1/product/getCategory")}'
    res = api_request(url)
    if res.get('success') and res.get('data'):
        return res['data']
    return []

def get_products_for_category(category_id, count=100):
    log(f"Fetching {count} newest products for category {category_id}...")
    # listV2: orderBy=3 (Create Time), sort=desc (Newest)
    params = f'page=1&size={count}&categoryId={category_id}&orderBy=3&sort=desc'
    url = f'{CJ_PROXY}?endpoint={urllib.parse.quote(f"/api2.0/v1/product/listV2?{params}", safe="")}'
    
    res = api_request(url)
    if res.get('success') and res.get('data'):
        data = res['data']
        products = []
        # listV2 response structure is in content[0].productList
        if 'content' in data and len(data['content']) > 0:
            products = data['content'][0].get('productList', [])
        return products
    else:
        log(f"  ⚠️ Error fetching products: {res.get('message', 'Unknown error')}")
        if 'points' in res.get('message', '').lower() or res.get('code') == 1600100:
            return "LIMIT_REACHED"
    return []

def bulk_import(products):
    if not products:
        return True
    log(f"Importing {len(products)} products to local database...")
    res = api_request(BULK_IMPORT_URL, method='POST', data={'products': products})
    if res.get('success'):
        log(f"  ✅ Successfully imported {res.get('data', {}).get('imported', 0)} products")
        return True
    else:
        log(f"  ❌ Import failed: {res.get('error', 'Unknown error')}")
        return False

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_state(state):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def main():
    log("=== Starting Automated Product Import ===")
    state = load_state()
    categories = get_categories()
    
    if not categories:
        log("❌ No categories found. Exiting.")
        return

    # Flatten categories if needed (CJ sometimes has nested)
    # For now, let's process top-level categories
    
    for cat in categories:
        cat_id = cat.get('categoryId')
        cat_name = cat.get('categoryName', 'Unknown')
        
        if cat_id in state and state[cat_id] == 'COMPLETED':
            # log(f"Skipping {cat_name} (already completed)")
            continue
            
        log(f"\n📂 Processing Category: {cat_name} ({cat_id})")
        
        products = get_products_for_category(cat_id, 100)
        
        if products == "LIMIT_REACHED":
            log("🛑 API points or QPS limit reached. Stopping for today.")
            break
            
        if not products:
            log(f"  ⚠️ No products found in this category.")
            state[cat_id] = 'NO_PRODUCTS'
            save_state(state)
            continue
            
        success = bulk_import(products)
        if success:
            state[cat_id] = 'COMPLETED'
            save_state(state)
            log(f"  ✨ Category {cat_name} marked as COMPLETED.")
        else:
            log(f"  ❌ Could not complete {cat_name}. Will retry later.")
            break
        
        # Small delay to respect QPS between categories
        time.sleep(2)

    log("\n=== Import session finished ===")

if __name__ == '__main__':
    main()
