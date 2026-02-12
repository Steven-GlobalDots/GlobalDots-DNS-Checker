# GlobalDots DNS Checker - Deployment Guide

## Separate Deployments Required

This project has two separate components that need to be deployed independently:

### 1. Backend (Cloudflare Worker)

Deploy manually from your local machine:

```bash
cd backend
npm install
npx wrangler deploy
```

After deployment, you'll get a worker URL like:
```
https://globaldots-dns-checker-api.<your-subdomain>.workers.dev
```

**Important**: Copy this URL and update it in `frontend/src/App.tsx` on line 53:
```typescript
const backendUrl = 'https://globaldots-dns-checker-api.<your-subdomain>.workers.dev';
```

### 2. Frontend (Cloudflare Pages)

The frontend will auto-deploy via Cloudflare Pages when you push to GitHub.

**Cloudflare Pages Configuration**:
- **Build command**: `npm install && npm run build`
- **Build output directory**: `dist`
- **Root directory**: `frontend`

If auto-deployment isn't working, manually configure in Cloudflare Dashboard:
1. Go to Pages → Your project → Settings → Builds & deployments
2. Set the root directory to `frontend`
3. Set build command to `npm install && npm run build`
4. Set build output to `dist`

## Testing Locally

### Backend
```bash
cd backend
npm install
npx wrangler dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Update `frontend/src/App.tsx` line 53 to use `http://localhost:8787` for local testing.
