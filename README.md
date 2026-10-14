# ClariPNG — AI PNG Upscaler & Deblur Transparent

Aplikasi web modern untuk melakukan *upscale* gambar PNG berpresisi tinggi (hingga 8x), menghilangkan *blur* dan artefak kompresi menggunakan algoritma Unsharp Masking (USM) dan Laplacian edge boost, serta menghapus latar belakang menjadi transparan murni dengan proteksi area dalam (*flood from edges*) dan *defringe matting*.

---

## 🚀 Cara Menjalankan di Lokal (Setelah Clone dari GitHub)

### 1. Prasyarat
- Pastikan telah menginstal [Node.js](https://nodejs.org/) versi 18 atau 20+.

### 2. Instalasi Dependensi
```bash
git clone https://github.com/USERNAME/REPO-NAME.git
cd REPO-NAME
npm install
```

### 3. Konfigurasi Environment (Opsional)
Salin `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi `GEMINI_API_KEY` jika ingin menggunakan analisis AI mendalam. Jika dikosongkan, aplikasi akan otomatis menggunakan **Analisis Heuristik Lokal** secara *offline*.

### 4. Menjalankan Server Pengembangan
Terdapat 2 opsi:
- **Full-stack (Express + Vite + API AI)**:
  ```bash
  npm run dev
  ```
- **Hanya Frontend Client (Vite)**:
  ```bash
  npm run dev:client
  ```

Buka browser di `http://localhost:3000`.

---

## 🌐 Cara Deploy ke GitHub Pages (Gratis & Otomatis)

Proyek ini telah dikonfigurasi dengan:
1. `base: './'` pada `vite.config.ts` agar file CSS & JavaScript tidak mengalami galat 404 di URL subdirektori GitHub Pages.
2. Workflow GitHub Actions otomatis di `.github/workflows/deploy.yml`.

### Langkah Pengaktifan:
1. **Push** repositori Anda ke GitHub:
   ```bash
   git add .
   git commit -m "feat: setup ClariPNG"
   git push origin main
   ```
2. Buka tab repositori di GitHub:
   - Klik **Settings** (Pengaturan).
   - Pada bilah sisi kiri, klik **Pages**.
   - Pada bagian **Build and deployment** > **Source**, pilih **GitHub Actions**.
3. Workflow akan otomatis berjalan dan situs Anda akan aktif di `https://<username>.github.io/<repo-name>/`.

---

## 🛠️ Build untuk Produksi
Untuk menghasilkan berkas web statis siap saji di direktori `dist/`:
```bash
npm run build
```
Hasil di folder `dist/` dapat langsung di-upload ke Vercel, Netlify, Cloudflare Pages, atau server web statis lainnya.

---

## ✨ Fitur Unggulan
- **Super-sampling Upscale 1x, 2x, 4x, 8x**: Memperbesar kanvas secara bertahap menjaga kehalusan garis.
- **Deblur & Unsharp Masking**: Menghilangkan kekaburan kamera dan kompresi piksel.
- **Latar Belakang Transparan & Defringe**: Menghapus latar putih/hitam/kustom tanpa meninggalkan halo putih di pinggir gambar.
- **Split-Screen Comparison**: Slider interaktif Sebelum vs Sesudah.
- **Batch Processing**: Memproses dan mengunduh banyak file PNG sekaligus.
