# Dmazalyxers — Instagram Downloader

Web app modern untuk download media Instagram publik (post foto, video, reel, IGTV, stories, carousel). Tempel link, dapat hasilnya dalam hitungan detik.

## Fitur

- Download foto / video / reel / carousel / IGTV / stories Instagram publik via REST API
- UI modern: glassmorphism, gradient, animasi halus, responsive
- Dark/light theme dengan preferensi tersimpan
- Riwayat 8 download terakhir (di localStorage)
- API key tersimpan lokal, bisa diganti kapan saja
- Validasi URL Instagram sebelum request (`/p/`, `/reel/`, `/tv/`, `/stories/`)
- Copy link & download langsung satu klik

## Stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) untuk styling
- [lucide-react](https://lucide.dev/) untuk ikon
- API: [KomputerzAPI](https://api.komputerz.site/) — endpoint `GET /api/v1/download/instagram`

## Cara pakai

```bash
npm install
npm run dev        # development
npm run build      # production build → dist/
npm run lint       # eslint
```

Kunjungi `http://localhost:5173` setelah `npm run dev`.

## Konfigurasi

API key default sudah disertakan untuk akun demo. User bisa override lewat panel "API Key" di form — nilainya disimpan di localStorage browser (key: `dmaz_api_key`).

## Catatan

- Hanya bekerja untuk media Instagram yang bersifat **publik**
- API memiliki rate limit (plan FREE: 200 req/hari, delay 5s antar request)
- Semua proses jalan di browser; tidak ada backend
