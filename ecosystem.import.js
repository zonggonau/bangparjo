module.exports = {
  apps: [
    {
      name: 'cj-import-products',
      script: 'scripts/import-pm2.js',
      cwd: '/root/.openclaw/workspace/bangparjo',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:Z0ngg0n4U@localhost:5432/bangparjo_shop',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/root/.openclaw/workspace/bangparjo/logs/cj-import-error.log',
      out_file: '/root/.openclaw/workspace/bangparjo/logs/cj-import-out.log',
      merge_logs: true,
      max_restarts: 3,
      restart_delay: 10000,
    }
  ]
};
