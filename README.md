# Dmazalyxers — All-in-One Downloader

Web app modern untuk download media dari 7 platform (Instagram, TikTok, YouTube MP4, YouTube MP3, Spotify, TeraBox, CapCut) lewat KomputerzAPI.

## Fitur

- 7 platform: Instagram, TikTok, YouTube MP4/MP3, Spotify, TeraBox, CapCut
- Platform picker (tab) dengan validasi URL per-platform
- YouTube MP4: pilihan quality (360p/480p/720p/1080p)
- UI modern: glassmorphism, gradient, animasi halus, responsive
- Dark/light theme dengan preferensi tersimpan
- Riwayat 12 download terakhir (di localStorage, lintas platform)
- API key tersimpan lokal, bisa diganti kapan saja
- Copy link & download langsung satu klik

## Stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) untuk styling
- [lucide-react](https://lucide.dev/) untuk ikon
- API: [KomputerzAPI](https://api.komputerz.site/) — 7 endpoint download

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

- Hanya bekerja untuk konten yang bersifat **publik**
- API memiliki rate limit (plan FREE: 200 req/hari, delay 5s antar request)
- Semua proses jalan di browser; tidak ada backend
