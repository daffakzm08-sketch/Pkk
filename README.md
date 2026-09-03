# Pkk — Petunjuk Setup dan Jalankan (Indonesia)

Ini repositori aplikasi frontend berbasis React + Vite (TypeScript).
Berikut langkah cepat untuk menjalankan aplikasi secara lokal.

Prerequisites
- Node.js 18+ direkomendasikan (atau Bun jika Anda ingin menggunakan bun install). 
- Git

1) Clone repositori

```bash
git clone https://github.com/daffakzm08-sketch/Pkk.git
cd Pkk
```

2) Salin file environment

```bash
cp .env.example .env
# Lalu edit .env untuk mengisi GEMINI_API_KEY dan APP_URL
```

Catatan: GEMINI_API_KEY diperlukan untuk panggilan ke Gemini AI (lihat .env.example). APP_URL biasanya URL tempat aplikasi akan di-deploy (digunakan untuk callback atau self-referential links).

3) Install dependensi

- Menggunakan npm/yarn/pnpm:
```
npm install
# atau
# pnpm install
# atau
# yarn install
```

- Atau menggunakan Bun (repo berisi bun.lock):
```
bun install
```

4) Jalankan development server

```bash
npm run dev
# Aplikasi akan berjalan di http://localhost:3000 (Vite dikonfigurasi untuk port 3000)
```

5) Build dan preview

```bash
npm run build
npm run preview
# atau lihat folder dist setelah build
```

Catatan tambahan
- Ada dependensi `firebase` dan beberapa berkas konfigurasi (`firebase-blueprint.json`, `firebase-applet-config.json`, `firestore.rules`) — jika aplikasi mengandalkan Firebase, Anda perlu membuat atau menghubungkan proyek Firebase dan mengupdate konfigurasi / environment sesuai.
- Ada dependensi `express` tapi tidak ditemukan file server eksplisit di root; jika perlu server Node/Express, beri tahu saya dan saya bisa mencari / menambahkan contoh server atau instruksi deploy.
- File .env.example memiliki GEMINI_API_KEY — jika Anda tidak memiliki kunci ini, beberapa fitur AI mungkin tidak bekerja.

Butuh saya jalankan langkah berikutnya (contoh: tambah README ke repo, buat GitHub Actions untuk CI/CD, atau setup skrip start produksi)?
