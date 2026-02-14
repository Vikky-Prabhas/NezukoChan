<p align="center">
  <h1 align="center">🌸 NezukoChan</h1>
  <p align="center">
    <strong>A premium anime & cartoon streaming app for Desktop, Mobile, and Web</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#project-structure">Structure</a>
  </p>
</p>

---

## ✨ Features

- 🎬 **Multi-Provider Streaming** — AllAnime, HiAnime, Anitaku with automatic fallback
- 🇮🇳 **Regional Dubs** — Hindi, Telugu, Tamil, Malayalam, Kannada (unique!)
- 🎨 **Premium UI** — Deep black glassmorphism design with smooth animations
- 📊 **AniList Integration** — Track what you watch, sync progress
- 📚 **Collections** — Create custom anime collections
- 🔍 **Smart Search** — Debounced search with genre, year, season, format filters
- 📱 **Responsive** — Desktop and mobile-optimized layouts
- 🎧 **Sub/Dub Toggle** — Switch between subtitled and dubbed versions
- ⚡ **Smart Fallback** — Auto-tries next server if one fails

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Tauri v2](https://v2.tauri.app/) (Rust backend) |
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | TailwindCSS v4 |
| **Player** | VidStack |
| **Data Source** | AniList GraphQL API |
| **State** | React Context + Zustand (planned) |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (for Tauri backend)
- [pnpm](https://pnpm.io/) (recommended) or npm

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build

```bash
# Build for production
npm run tauri build
```

## 📁 Project Structure

```
NezukoChan/
├── src/                  # React frontend
│   ├── pages/            # Page modules (7 screens)
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services (AniList)
│   ├── store/            # State management
│   ├── lib/              # Utilities
│   └── types/            # TypeScript definitions
├── src-tauri/            # Rust/Tauri backend
│   └── src/
│       ├── extractors/   # Stream providers
│       └── lib.rs        # IPC commands
├── public/               # Static assets
├── index.html            # Entry point
├── vite.config.ts        # Vite configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

## 🎯 Platforms

| Platform | Method |
|----------|--------|
| 🪟 Windows | Tauri Desktop |
| 🐧 Linux | Tauri Desktop |
| 📱 Android | Tauri Mobile (planned) |
| 🍎 iOS | Web PWA via Vercel/Netlify |

## 📝 License

This project is open source. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with 💖 by the NezukoChan Team
</p>
