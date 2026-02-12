# GlobalDots DNS Checker - Single Worker Deployment

## Overview

This project is deployed as a **single Cloudflare Worker** that serves both the static frontend and the DNS query API.

## Architecture

- **Frontend**: React app built with Vite, served as static assets
- **Backend**: Cloudflare Worker handling `/api/query` endpoint
- **Deployment**: Single Worker with Static Assets binding

## Deployment Steps

### 1. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

This creates the production build in `frontend/dist`.

### 2. Deploy the Worker

From the `backend` directory:

```bash
cd backend
npm install
npx wrangler deploy
```

The Worker will:
- Serve the frontend from `frontend/dist`
- Handle API requests at `/api/query`
- Deploy to `https://globaldots-dns-checker.<your-subdomain>.workers.dev`

## Local Development

### Option 1: Full Stack (Recommended)

1. Build the frontend:
   ```bash
   cd frontend && npm run build
   ```

2. Run the worker:
   ```bash
   cd backend && npx wrangler dev
   ```

3. Open `http://localhost:8787`

### Option 2: Separate Dev Servers

1. Run frontend dev server:
   ```bash
   cd frontend && npm run dev
   ```

2. Run backend worker:
   ```bash
   cd backend && npx wrangler dev
   ```

3. Update `frontend/src/App.tsx` line 64 to use `http://localhost:8787/api/query`

## How It Works

The Worker configuration (`backend/wrangler.jsonc`) includes:

```json
{
  "name": "globaldots-dns-checker",
  "main": "src/index.ts",
  "assets": {
    "directory": "../frontend/dist",
    "binding": "ASSETS"
  }
}
```

The Worker code routes requests:
- `/api/query` → DNS query handler
- All other requests → Static assets (frontend)

## Troubleshooting

**Q: Build fails with "directory not found"**  
A: Build the frontend first: `cd frontend && npm run build`

**Q: API requests fail**  
A: Check that the frontend is making requests to `/api/query` (relative path), not an absolute URL

**Q: Static assets don't load**  
A: Ensure `frontend/dist` exists and contains the built files
