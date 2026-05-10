# PM2 Deployment Guide

This guide provides instructions for deploying the **BangParjo Shop** e-commerce platform using **PM2** on a production server.

## Prerequisites

1. **Node.js**: Ensure Node.js (v18 or newer) is installed.
2. **PM2**: Install PM2 globally:
   ```bash
   npm install pm2 -g
   ```
3. **Database**: Ensure your PostgreSQL/MySQL database is accessible and the URL is set in `.env`.

---

## Deployment Steps

### 1. Install Dependencies
Run this in your project root:
```bash
npm install
```

### 2. Generate Prisma Client & Sync Categories
Ensure the database schema is synced and the initial data is imported:
```bash
npx prisma generate
npx prisma migrate deploy

# Sync categories from global supplier to your database
npm run sync-categories
```

### 3. Build the Application
Create the optimized production build:
```bash
npm run build
```

### 4. Start with PM2
Use the provided `ecosystem.config.js` to start the application in cluster mode:
```bash
pm2 start ecosystem.config.js
```

### 5. Management Commands

- **Check Status**: `pm2 status`
- **View Logs**: `pm2 logs bangparjo-shop`
- **Restart**: `pm2 restart bangparjo-shop`
- **Stop**: `pm2 stop bangparjo-shop`
- **Monitor**: `pm2 monit`

---

## Automatic Restart on Reboot
To ensure the app starts automatically when the server reboots:
```bash
pm2 startup
# Follow the instructions provided by the command above
pm2 save
```

## Static Assets & Reverse Proxy
It is highly recommended to use **Nginx** as a reverse proxy in front of PM2 to handle SSL (HTTPS) and serve as a robust entry point.
