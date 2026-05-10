# Docker Deployment Guide - CJ Dropshipping Catalog

Dokumentasi ini menjelaskan cara menjalankan aplikasi **bangparjo.shop** menggunakan Docker untuk lingkungan produksi.

## Prasyarat
- [Docker](https://docs.docker.com/get-docker/) terinstal di sistem Anda.
- [Docker Compose](https://docs.docker.com/compose/install/) (opsional, tapi direkomendasikan).

## File Konfigurasi Docker
Aplikasi ini sudah dilengkapi dengan:
1. `Dockerfile`: Menggunakan multi-stage build untuk menghasilkan image yang ringan (standalone mode).
2. `.dockerignore`: Memastikan file seperti `node_modules` dan `.next` tidak ikut ter-copy ke dalam image.
3. `docker-compose.yml`: Cara termudah untuk menjalankan aplikasi beserta konfigurasi environment-nya.

---

## Cara Menjalankan dengan Docker Compose (Direkomendasikan)

1. **Siapkan Environment Variables**
   Pastikan file `.env` sudah ada di root direktori dan berisi semua key yang diperlukan (DATABASE_URL, CJ_API_KEY, GEMINI_API_KEY, dll).

2. **Build dan Jalankan**
   Buka terminal di root direktori proyek dan jalankan:
   ```bash
   docker compose up -d --build
   ```
   Perintah ini akan mem-build image dan menjalankan kontainer di background.

3. **Verifikasi**
   Aplikasi akan berjalan di `http://localhost:3000`.

---

## Cara Menjalankan dengan Docker CLI Manual

Jika Anda tidak ingin menggunakan Docker Compose:

1. **Build Image**
   ```bash
   docker build -t cjropshiper-app .
   ```

2. **Jalankan Kontainer**
   ```bash
   docker run -p 3000:3000 --env-file .env cjropshiper-app
   ```

---

## Sinkronisasi Database (Prisma)

Dockerfile akan menjalankan `npx prisma generate` saat build untuk menyiapkan client. Namun, untuk menerapkan skema ke database produksi:

1. **Jika database baru/kosong:**
   Jalankan perintah ini sekali dari mesin lokal (pastikan DATABASE_URL di .env mengarah ke DB produksi):
   ```bash
   npx prisma migrate deploy
   ```

2. **Akses ke DB dalam Docker:**
   Pastikan `DATABASE_URL` di dalam kontainer dapat menjangkau host database Anda. Jika DB berjalan di host yang sama (localhost), gunakan IP host atau network bridge Docker.

---

## Tips Optimasi
- **Standalone Mode**: Kami menggunakan fitur `output: 'standalone'` dari Next.js yang secara drastis mengurangi ukuran image Docker (hanya menyertakan file yang diperlukan).
- **Alpine Linux**: Image dasar menggunakan Alpine Linux untuk keamanan dan ukuran minimal.

## Troubleshooting
- **Permission Denied**: Dockerfile menggunakan user non-root `nextjs` untuk keamanan. Pastikan volume mounting (jika ada) memiliki permission yang sesuai.
- **Port Conflict**: Jika port 3000 sudah digunakan, ubah mapping di `docker-compose.yml` (misal: `"3001:3000"`).
