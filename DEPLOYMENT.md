# GlobalDots DNS Checker - Worker Deployment Guide

## ⚠️ CRITICAL: Build Command Configuration

In your Cloudflare Worker dashboard, set the **Build command** to:

```bash
cd frontend && npm install && npm run build && cd .. && npx wrangler deploy
```

This single command will:
1. Navigate to the frontend directory
2. Install dependencies
3. Build the React app to `frontend/dist`
4. Return to root
5. Deploy the Worker with static assets

## Alternative: Using build.sh

If the inline command doesn't work, try:

```bash
bash build.sh
```

## Manual Local Deployment

```bash
cd /Users/ganesh/Documents/CloudFlare/AntiGravity/dns-checker
./build.sh
```

## How It Works

The Worker configuration (`wrangler.jsonc`) specifies:
- **Entry point**: `backend/src/index.ts`
- **Static assets**: `frontend/dist`

The Worker serves:
- All static files (HTML, CSS, JS) from `frontend/dist`
- API endpoint at `/api/query` for DNS lookups

## Local Development

```bash
# Build frontend
cd frontend && npm run build

# Run worker locally
cd .. && npx wrangler dev
```

Open `http://localhost:8787`

## Troubleshooting

**Q: "build.sh: No such file or directory"**  
A: Use the inline build command instead (see above).

**Q: "frontend/dist does not exist"**  
A: The frontend must be built before deployment. Ensure the build command runs successfully.

**Q: Permission errors**  
A: Run `sudo chown -R $(whoami) ~/.npm`
