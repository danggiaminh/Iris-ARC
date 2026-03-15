# IrisARC

Desktop chat app built with Tauri v2 (Rust + React/TypeScript).

Connects to the Cerebras OpenAI-compatible API for chat completions and supports the robust Qwen 3 model series.

## Prerequisites

- **Node.js** 18+
- **Rust** stable (install via [rustup.rs](https://rustup.rs))
- **Tauri v2 CLI**: `cargo install tauri-cli --version "^2"`
- **System dependencies** (Linux): `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`

## Setup

1. **Clone and install dependencies:**

```bash
cd iris-arc
npm install
```

2. **Create your `src-tauri/.env` file**:

```env
CEREBRAS_API_KEY=your_key_here
```

3. **Run in development:**

```bash
npm run tauri dev
```

4. **Build for production:**

```bash
npm run tauri build
```

Output binaries:
- **Linux:** `src-tauri/target/release/bundle/deb/*.deb`, `src-tauri/target/release/bundle/appimage/*.AppImage`
- **Windows:** `src-tauri/target/release/bundle/msi/*.msi`, `src-tauri/target/release/bundle/nsis/*.exe`

## Available Models

| Display Name | Model ID |
|---|---|
| Qwen-3-235B | `qwen-3-235b-a22b-instruct-2507` |

## Tech Stack

- **Desktop framework:** Tauri v2
- **Backend:** Rust
- **Frontend:** React 18 + TypeScript + Vite
- **Icons:** Lucide React
