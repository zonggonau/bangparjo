// Script untuk memastikan Environment Variables kunci tidak kosong atau memakai nilai default
const requiredEnvs = [
  'DATABASE_URL',
  'CJ_API_KEY',
  'AUTH_SECRET',
  'REDIS_URL'
];

let hasError = false;

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    console.warn(`[WARNING] Environment variable ${env} is missing!`);
    hasError = true;
  }
}

if (process.env.CJ_API_KEY === 'your_cj_api_key_here') {
  console.error('[ERROR] CJ_API_KEY is still using the default placeholder!');
  hasError = true;
}

if (process.env.AUTH_SECRET === 'your_nextauth_secret_here') {
  console.error('[ERROR] AUTH_SECRET is still using the default placeholder!');
  hasError = true;
}

if (hasError) {
  console.warn('[SECURITY] Harap pastikan semua .env terisi dengan benar jika ini di server produksi.');
  // Jika ingin build gagal jika env kosong, uncomment baris di bawah:
  // process.exit(1); 
} else {
  console.log('[SECURITY] All critical environment variables are set.');
}
