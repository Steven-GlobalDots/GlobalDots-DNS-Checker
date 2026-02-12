# GlobalDots DNS Checker - Deployment Guide

## ⚠️ IMPORTANT: This is NOT a Cloudflare Pages Project

This project deploys as a **single Cloudflare Worker** with static assets. Do NOT use Cloudflare Pages auto-deployment.

## Deployment Steps

### 1. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

This creates the production build in `frontend/dist`.

### 2. Deploy the Worker

```bash
cd backend
npx wrangler deploy
```

Select your account when prompted. The Worker will deploy to:
```
https://globaldots-dns-checker.<your-subdomain>.workers.dev
```

## How It Works

The Worker serves both:
- **Static frontend** from `frontend/dist`
- **API endpoint** at `/api/query` for DNS lookups

## Local Development

### Full Stack (Recommended)

```bash
# Build frontend
cd frontend && npm run build

# Run worker (serves both frontend and API)
cd ../backend && npx wrangler dev
```

Open `http://localhost:8787`

### Separate Dev Servers

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && npx wrangler dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:8787`

## Troubleshooting

**Q: Cloudflare Pages keeps trying to auto-deploy**  
A: This project should NOT be connected to Cloudflare Pages. Disconnect it from the Pages dashboard and deploy manually using `npx wrangler deploy`.

**Q: Build fails with "directory not found"**  
A: Build the frontend first: `cd frontend && npm run build`

**Q: Permission errors**  
A: Run `sudo chown -R $(whoami) ~/.npm` and `sudo chown -R $(whoami) ~/Documents/node_modules`
