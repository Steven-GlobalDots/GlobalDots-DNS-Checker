# GlobalDots DNS Checker - CRITICAL DEPLOYMENT INSTRUCTIONS

## ⚠️ IMPORTANT: Manual Configuration Required

Cloudflare Pages is auto-detecting this as a Worker project because of the `backend/wrangler.jsonc` file. You **MUST** manually configure the build settings.

## Step-by-Step Instructions

### 1. Configure Cloudflare Pages Build Settings

Go to your Cloudflare Dashboard and follow these steps:

1. Navigate to: **Pages** → **Your Project** → **Settings** → **Builds & deployments**
2. Click **"Edit configuration"** or **"Configure Production deployments"**
3. Set the following values:

   | Setting | Value |
   |---------|-------|
   | **Framework preset** | None |
   | **Build command** | `cd frontend && npm install && npm run build` |
   | **Build output directory** | `frontend/dist` |
   | **Root directory** | (leave empty) |

4. Click **"Save"**
5. Go to **Deployments** and click **"Retry deployment"**

### 2. Deploy the Backend Worker (Separate Step)

The backend API must be deployed separately from your local machine:

```bash
cd backend
npm install
npx wrangler deploy
```

After deployment, you'll receive a worker URL like:
```
https://globaldots-dns-checker-api.<your-subdomain>.workers.dev
```

### 3. Update Frontend with Backend URL

Edit `frontend/src/App.tsx` and update line 53:

```typescript
const backendUrl = 'https://globaldots-dns-checker-api.<your-subdomain>.workers.dev';
```

Then commit and push:
```bash
git add frontend/src/App.tsx
git commit -m "feat: Update backend URL"
git push origin main
```

## Why This Happens

Cloudflare Pages automatically detects projects with `wrangler.jsonc` or `wrangler.toml` files and tries to deploy them as Workers. Since this is a monorepo with both a frontend (Pages) and backend (Worker), they must be deployed separately.

## Testing Locally

### Backend
```bash
cd backend
npm install
npx wrangler dev
# Runs on http://localhost:8787
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

For local testing, set `backendUrl` to `http://localhost:8787` in `frontend/src/App.tsx`.

## Troubleshooting

**Q: Build still fails with "Missing entry-point to Worker script"**  
A: You haven't manually configured the build settings yet. Follow Step 1 above.

**Q: Frontend builds but shows errors when comparing**  
A: The backend worker hasn't been deployed yet, or the `backendUrl` in the frontend is incorrect.

**Q: How do I know if the backend is deployed?**  
A: Run `cd backend && npx wrangler deployments list` to see your deployed workers.
