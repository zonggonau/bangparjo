# Docker Deployment Guide - CJ Dropshipping Catalog

This documentation explains how to run the **bangparjo.shop** application using Docker for production environments.

## Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed on your system.
- [Docker Compose](https://docs.docker.com/compose/install/) (optional, but recommended).

## Docker Configuration Files
The application includes:
1. `Dockerfile`: Uses a multi-stage build to generate a lightweight image (standalone mode).
2. `.dockerignore`: Ensures files like `node_modules` and `.next` are not copied into the image.
3. `docker-compose.yml`: The easiest way to run the application with its environment configuration.

---

## Running with Docker Compose (Recommended)

1. **Prepare Environment Variables**
   Ensure the `.env` file exists in the root directory and contains all necessary keys (DATABASE_URL, CJ_API_KEY, GEMINI_API_KEY, etc.).

2. **Build and Run**
   Open a terminal in the project root and run:
   ```bash
   docker compose up -d --build
   ```
   This command will build the image and run the container in the background.

3. **Verification**
   The application will be running at `http://localhost:3000`.

---

## Running with Docker CLI Manually

If you prefer not to use Docker Compose:

1. **Build the Image**
   ```bash
   docker build -t cjropshiper-app .
   ```

2. **Run the Container**
   ```bash
   docker run -p 3000:3000 --env-file .env cjropshiper-app
   ```

---

## Database Synchronization (Prisma)

The Dockerfile runs `npx prisma generate` during the build to set up the client. However, to apply the schema to your production database:

1. **If the database is new/empty:**
   Run this command once from your local machine (ensure DATABASE_URL in .env points to your production DB):
   ```bash
   npx prisma migrate deploy
   ```

2. **Database Access within Docker:**
   Ensure `DATABASE_URL` within the container can reach your database host. If the DB is running on the same host (localhost), use the host IP or Docker's network bridge.

---

## Optimization Tips
- **Standalone Mode**: We use the `output: 'standalone'` feature from Next.js, which drastically reduces Docker image size by only including necessary files.
- **Alpine Linux**: The base image uses Alpine Linux for enhanced security and minimal size.

## Troubleshooting
- **Permission Denied**: The Dockerfile uses a non-root user `nextjs` for security. Ensure any volume mounting has appropriate permissions.
- **Port Conflict**: If port 3000 is already in use, change the mapping in `docker-compose.yml` (e.g., `"3001:3000"`).
