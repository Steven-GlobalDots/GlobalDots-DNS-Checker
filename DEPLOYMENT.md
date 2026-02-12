# GlobalDots DNS Checker - GitHub Worker Deployment

## Important: Build Command Configuration

In your Cloudflare Worker dashboard, update the **build command** to:

```bash
chmod +x build.sh && ./build.sh
```

This script will:
1. Install frontend dependencies
2. Build the frontend (`frontend/dist`)
3. Deploy the Worker with static assets

## Manual Deployment

If you want to deploy manually from your local machine:

```bash
cd /Users/ganesh/Documents/CloudFlare/AntiGravity/dns-checker
./build.sh
```

## How It Works

The Worker serves:
- **Static frontend** from `frontend/dist` (React app)
- **API endpoint** at `/api/query` for DNS lookups

## Local Development

```bash
# Build frontend
cd frontend && npm run build

# Run worker locally
cd .. && npx wrangler dev
```

Open `http://localhost:8787`

## Troubleshooting

**Q: Build fails with "frontend/dist does not exist"**  
A: The build command in the Worker dashboard must run `./build.sh` to build the frontend first.

**Q: Permission denied on build.sh**  
A: The build command should include `chmod +x build.sh &&` before running it.
