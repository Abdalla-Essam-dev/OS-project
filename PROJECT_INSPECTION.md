# PROJECT_INSPECTION.md

## Overview

Classical Process Synchronization Simulator — a React + Vite frontend communicating with an Express backend. Visualizes Bounded Buffer (Monitors), Readers-Writers (Semaphores), and Dining Philosophers (Binary Semaphores) problems.

```
OS-project/
├── package.json              # Root monorepo orchestrator
├── .gitignore                # Root-level ignores
├── client/                   # React + Vite SPA
│   ├── package.json
│   ├── vite.config.js        # Dev proxy + build config
│   ├── vercel.json           # SPA rewrite rules
│   ├── .gitignore
│   ├── .env.example
│   └── src/
│       ├── App.jsx           # Main app, API calls
│       ├── main.jsx
│       ├── index.css
│       ├── utils/validation.js
│       └── components/       # 8 visualization components
└── server/                   # Express API
    ├── package.json
    ├── server.js             # Entry point, CORS, routes
    ├── .gitignore
    ├── .env.example
    └── engines/              # Simulation engines
        ├── boundedBuffer.js
        ├── readersWriters.js
        └── diningPhilosophers.js
```

---

## Root Causes of Issues Found

### 1. Missing Root Scripts
The root `package.json` had no `install:all`, `build`, or `start` scripts. `npm run dev` worked via `concurrently` but there was no way to install all deps or build from the root.

### 2. No `.gitignore` in `/client` or `/server`
Only the root had a `.gitignore`. The subdirectories had none, meaning `node_modules` inside them could be accidentally committed if the root ignore was removed or bypassed.

### 3. Vercel Exit Code 126 — `node_modules` Tracked in Git
The `node_modules` directories in both `/client` and `/server` were previously committed to the repository. This caused Vercel's Linux build environment to choke on Windows-specific binaries (`.cmd`, `.ps1` files, `@rollup/rollup-win32-x64-msvc`). Running `git rm -r --cached .` removed them from tracking; the new `.gitignore` files prevent re-addition.

### 4. CORS Fully Open
The server used `app.use(cors())` with no origin restriction. In production this works but is insecure. Fixed to whitelist `localhost:5173`, `localhost:3000`, and any origin set via `CORS_ORIGIN` env var.

### 5. Client API URL Hardcoded
`App.jsx` had `const API_BASE = '/api'` — this works in dev (via Vite proxy) but fails in production where the backend is on a different domain (Railway). Fixed to read `import.meta.env.VITE_API_URL` with `/api` as fallback.

### 6. Missing `build` Output Configuration
The Vite config had no explicit `build.outDir`. Added `outDir: 'dist'` for clarity.

---

## Files Created or Modified

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modified | Added `install:all`, `build`, `start` scripts |
| `.gitignore` | Modified | Added `build/`, `.DS_Store`, `Thumbs.db`, `.env.local` |
| `client/.gitignore` | Created | Ignores `node_modules`, `dist`, `.env*`, `*.log` |
| `client/.env.example` | Created | Documents `VITE_API_URL` variable |
| `client/vite.config.js` | Modified | Added explicit `build.outDir` config |
| `client/src/App.jsx` | Modified | `API_BASE` now reads `VITE_API_URL` env var |
| `client/vercel.json` | Rewritten | Clean SPA rewrite config |
| `server/.gitignore` | Created | Ignores `node_modules`, `.env*`, `*.log` |
| `server/.env.example` | Created | Documents `PORT` and `CORS_ORIGIN` variables |
| `server/server.js` | Modified | CORS whitelisted to specific origins + env var |

---

## How to Run Locally

### Prerequisites
- Node.js >= 18.11 (for `node --watch` support in server dev mode)
- npm >= 9

### Step-by-step

```bash
# 1. Install all dependencies (root + client + server)
npm run install:all

# 2. Start both dev servers concurrently
npm run dev
```

This launches:
- **Client** (Vite) on `http://localhost:5173`
- **Server** (Express) on `http://localhost:5000`

The Vite dev server proxies `/api/*` requests to `localhost:5000` automatically.

### Individual commands

```bash
# Client only
npm run dev --prefix client

# Server only
npm run dev --prefix server

# Build client for production
npm run build
```

---

## Vercel Deployment (Frontend)

### Dashboard Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Environment Variables (Vercel Dashboard)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://your-railway-app.up.railway.app/api` | Backend URL from Railway |

### How It Works
1. Vercel builds the React app using Vite
2. `vercel.json` rewrites all routes to `index.html` (SPA support)
3. In production, `App.jsx` reads `VITE_API_URL` env var to point API calls at the Railway backend
4. In dev, `VITE_API_URL` is unset, so it falls back to `/api` which the Vite proxy forwards to `localhost:5000`

---

## Railway Deployment (Backend)

### Dashboard Settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `server` |
| **Start Command** | `node server.js` |
| **Node Version** | 18+ (or set `engines` in package.json) |

### Environment Variables (Railway Dashboard)

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | (auto-set by Railway) | Railway injects this automatically |
| `CORS_ORIGIN` | `https://your-vercel-app.vercel.app` | Frontend origin for CORS |

### How It Works
1. Railway runs `node server.js`
2. `process.env.PORT` is auto-injected by Railway (do not hardcode)
3. CORS accepts requests from `localhost:5173`, `localhost:3000`, and whatever `CORS_ORIGIN` is set to
4. The `/api/health` endpoint can be used as a health check in Railway settings

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check, returns `{ status: 'ok', timestamp }` |
| `POST` | `/api/simulate` | Run simulation. Body: `{ problem, config }` |
| `*` | `/api/*` | 404 JSON response for unknown endpoints |

### POST /api/simulate Body Schema

```json
{
  "problem": "bounded-buffer | readers-writers | dining-philosophers",
  "config": {
    // bounded-buffer
    "bufferSize": 5,
    "numProducers": 2,
    "numConsumers": 2,

    // readers-writers
    "numReaders": 3,
    "numWriters": 2,
    "readTime": 2,
    "writeTime": 3,
    "priorityMode": "reader-preference | writer-preference",

    // dining-philosophers
    "numPhilosophers": 5,
    "eatDuration": 3,
    "thinkDuration": 2,
    "strategy": "asymmetric | limit_seats | both_at_once"
  }
}
```

---

## Environment Variables Reference

### Client (`/client`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Full backend API URL. Leave empty for dev proxy. |

### Server (`/server`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server listen port. Auto-set by Railway. |
| `CORS_ORIGIN` | (none) | Additional allowed CORS origin (e.g., production frontend URL) |

---

## Git Cleanup Summary

The following commands were executed to untrack previously committed `node_modules`:

```bash
git rm -r --cached .
git add .
```

**Result:** `node_modules/` directories in `/client` and `/server` are no longer tracked. The `.gitignore` files at all three levels (root, client, server) prevent re-addition. This resolves the Vercel Exit Code 126 error caused by Windows-specific binaries in the tracked `node_modules`.

---

## Architecture Notes

- **Dev mode:** Vite proxy handles `/api/*` forwarding — no CORS issues in development
- **Production mode:** Client makes direct cross-origin requests to Railway backend — CORS and `VITE_API_URL` env var are critical
- **Simulation engines** are pure synchronous functions (no async I/O) — they generate all frames in one tick and return them
- **All three problems** use different synchronization primitives: Monitors (bounded-buffer), Counting Semaphores (readers-writers), Binary Semaphores (dining-philosophers)
