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
def load_env():
    # Try current dir and parent dir
    for path in ['.env', '../.env']:
        if os.path.exists(path):
            with open(path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    if '=' in line:
                        k, v = line.split('=', 1)
                        v = v.strip('"\'')
                        os.environ[k] = v

load_env()

# Set BASE_URL to your site URL
BASE_URL = os.environ.get('BASE_URL') or os.environ.get('NEXT_PUBLIC_BASE_URL') or 'https://bangparjo.shop'
# Set API_KEY matching SCRIPTS_API_KEY in your .env
API_KEY = os.environ.get('SCRIPTS_API_KEY', 'default_secret_key')
print(f"DEBUG: BASE_URL: {BASE_URL}")
print(f"DEBUG: API_KEY loaded: {API_KEY[:5]}...")

CJ_PROXY = f'{BASE_URL}/api/cj-proxy'
BULK_IMPORT_URL = f'{BASE_URL}/api/admin/bulk-import'
CAT_ALL_URL = f'{BASE_URL}/api/categories/all'

# Use paths relative to the script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(SCRIPT_DIR, 'import_state.json')
LOG_FILE = os.path.join(SCRIPT_DIR, 'import_log.txt')
L3_CATS_FILE = '/tmp/bangparjo-l3-categories.json'

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
    # Try local cache first (created by other scripts or previously)
    if os.path.exists(L3_CATS_FILE):
        log(f"Loading categories from local cache: {L3_CATS_FILE}")
        try:
            with open(L3_CATS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            log(f"  ⚠️ Error reading cache: {e}")

    log(f"Fetching categories from database API: {CAT_ALL_URL}")
    res = api_request(CAT_ALL_URL)
    if res.get('success') and res.get('data'):
        # Try to save to cache for next time
        try:
            with open(L3_CATS_FILE, 'w') as f:
                json.dump(res['data'], f)
        except: pass
        return res['data']
    
    if not res.get('success'):
        log(f"  ⚠️ API Error: {res.get('error', 'Unknown error')}")
        
    return []

def get_products_for_category(category_id, count=10, page=1, retries=3):
    for attempt in range(retries):
        log(f"Fetching {count} newest products for category {category_id} (Page {page})... [Attempt {attempt+1}/{retries}]")
        # listV2: orderBy=3 (Create Time), sort=desc (Newest)
        params = f'page={page}&size={count}&categoryId={category_id}&orderBy=3&sort=desc'
        url = f'{CJ_PROXY}?endpoint={urllib.parse.quote(f"/api2.0/v1/product/listV2?{params}", safe="")}'
        
        res = api_request(url)
        if res.get('success'):
            data = res.get('data', {})
            products = []
            # listV2 response structure is in content[0].productList
            if 'content' in data and len(data['content']) > 0:
                products = data['content'][0].get('productList', [])
            return products
        else:
            msg = res.get('message', res.get('error', 'Unknown error'))
            log(f"  ⚠️ Error fetching products: {msg}")
            
            msg_lower = str(msg).lower()
            code = res.get('code')
            
            # Daily limit or points limit or QPS (as per user request to stop for the day)
            if 'points' in msg_lower or 'qps' in msg_lower or code == 1600100:
                return "LIMIT_REACHED"
            
            # Other network errors - retry with backoff
            if 'network errors' in msg_lower or 'timeout' in msg_lower or attempt < retries - 1:
                wait = 10 * (attempt + 1)
                log(f"  ⏳ Temporary error, waiting {wait}s before retry...")
                time.sleep(wait)
                continue
            
            return "ERROR"
    return "ERROR"

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
    log("=== Starting Automated Product Import (Round-Robin 10 products) ===")
    state = load_state()
    categories = get_categories()
    
    if not categories:
        log("❌ No categories found. Exiting.")
        return

    log(f"Found {len(categories)} categories.")
    
    try:
        while True:
            processed_in_round = 0
            completed_in_round = 0
            errors_in_round = 0
            total_categories = len(categories)
            skipped_categories = 0
            
            for cat in categories:
                # DB API uses 'cjId' and 'name', CJ API used 'categoryId' and 'categoryName'
                cat_id = cat.get('cjId') or cat.get('categoryId')
                cat_name = cat.get('name') or cat.get('categoryName', 'Unknown')
                
                if not cat_id:
                    continue

                # Load or initialize state for this category
                cat_state = state.get(str(cat_id))
                if isinstance(cat_state, str): # Backward compatibility
                    if cat_state == 'COMPLETED':
                        cat_state = {"status": "COMPLETED", "last_page": 10} # Assume we did 100 before (10 pages of 10)
                    else:
                        cat_state = {"status": "ACTIVE", "last_page": 0}
                elif not cat_state:
                    cat_state = {"status": "ACTIVE", "last_page": 0}
                
                if cat_state.get('status') == 'COMPLETED' or cat_state.get('status') == 'NO_PRODUCTS':
                    skipped_categories += 1
                    continue
                
                if cat_state.get('last_page', 0) >= 1:
                    log(f"  ✅ Already reached 10 products for {cat_name}. Marking as COMPLETED.")
                    cat_state['status'] = 'COMPLETED'
                    state[str(cat_id)] = cat_state
                    save_state(state)
                    skipped_categories += 1
                    continue
                    
                log(f"\n📂 Processing Round: {cat_name} ({cat_id})")
                next_page = cat_state.get('last_page', 0) + 1
                
                products = get_products_for_category(cat_id, 10, next_page)
                
                if products == "LIMIT_REACHED":
                    log("🛑 API points or QPS limit reached. Stopping for today. Will continue tomorrow.")
                    save_state(state)
                    return
                
                if products == "RETRY_LATER" or products == "ERROR":
                    log(f"  ⚠️ Skipping {cat_name} for this round due to persistent error.")
                    errors_in_round += 1
                    time.sleep(2)
                    continue
                    
                if not isinstance(products, list):
                    log(f"  ⚠️ Unexpected response: {products}. Skipping.")
                    errors_in_round += 1
                    continue

                if len(products) == 0:
                    log(f"  ✨ No more products found. Marking category as COMPLETED.")
                    cat_state['status'] = 'COMPLETED'
                    state[str(cat_id)] = cat_state
                    save_state(state)
                    completed_in_round += 1
                    continue
                    
                success = bulk_import(products)
                if success:
                    cat_state['last_page'] = next_page
                    state[str(cat_id)] = cat_state
                    save_state(state)
                    processed_in_round += 1
                else:
                    log(f"  ❌ Import failed for {cat_name}. Stopping to investigate.")
                    return
                
                # Small delay to respect QPS between categories
                time.sleep(2.0)

            if skipped_categories == total_categories:
                log("✅ All categories are already COMPLETED.")
                break
                
            if processed_in_round == 0 and completed_in_round == 0 and errors_in_round == 0:
                log("No products were found or processed in this round. Finishing.")
                break
            
            if processed_in_round == 0 and errors_in_round > 0:
                log(f"⚠️ Only errors encountered this round ({errors_in_round} errors). Waiting 60s before next round.")
                time.sleep(60)
                
            log(f"\n--- Round finished. Processed {processed_in_round} categories, {completed_in_round} completed, {errors_in_round} errored. ---")
            log("Starting next round to get more products...")
            time.sleep(5)

    except KeyboardInterrupt:
        log("\n🛑 Script interrupted by user. Saving state...")
        save_state(state)
    except Exception as e:
        log(f"\n❌ Unexpected error: {e}")
        save_state(state)

    log("\n=== Import session finished ===")

if __name__ == '__main__':
    main()
