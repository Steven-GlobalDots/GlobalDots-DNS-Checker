# GlobalDots DNS Checker

A web-based tool to compare DNS configurations between a source zone file (source of truth) and a destination (either another zone file or live DNS queries).

## Overview

This tool helps you verify DNS migrations, validate zone file changes, and ensure DNS records are correctly propagated. It provides detailed comparison results showing matching records, missing records, and records with different values.

## Features

- **Dual Comparison Modes**:
  - Zone File vs Zone File
  - Zone File vs Live DNS Server
  
- **Comprehensive Results**:
  - Matching records count
  - Missing records (in source but not destination)
  - Different values (records that exist but have different data)
  
- **Multiple Export Formats**:
  - Plain Text
  - CSV
  - JSON
  - Download or view inline

- **Modern UI**:
  - Dark mode interface
  - Expandable result sections
  - Real-time comparison

## Architecture

### Frontend
- **React + TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zone Parser** - BIND zone file parser
- **Comparison Engine** - Record matching logic

### Backend
- **Cloudflare Worker** - DNS query proxy
- **DNS-over-HTTPS** - Queries via Cloudflare's DoH API

## Local Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup
```bash
cd backend
npm install
npx wrangler dev
```

The backend worker will be available at `http://localhost:8787`

## Deployment

### Backend (Cloudflare Worker)
```bash
cd backend
npx wrangler deploy
```

After deployment, update the `backendUrl` in `frontend/src/App.tsx` with your worker URL.

### Frontend (Cloudflare Pages)
The frontend is automatically deployed via Cloudflare Pages when you push to the `main` branch.

## Usage

1. **Upload Source Zone File**: Click "Upload a file" in the Source section and select your authoritative zone file.

2. **Choose Destination**:
   - **Zone File**: Upload another zone file to compare against
   - **DNS Server**: Enter a DNS server IP or hostname to query live records

3. **Run Comparison**: Click "Run Comparison" to analyze the differences.

4. **View Results**:
   - See summary cards showing counts of matching, missing, and different records
   - Expand each section to view detailed record information
   - Export results in your preferred format

## API Reference

### Backend Worker

#### `GET /query`
Queries DNS records via DNS-over-HTTPS.

**Parameters**:
- `name` (required): Domain name to query
- `type` (optional): Record type (A, AAAA, CNAME, MX, TXT, etc.). Default: A

**Response**:
```json
{
  "Answer": [
    {
      "name": "example.com.",
      "type": 1,
      "TTL": 300,
      "data": "93.184.216.34"
    }
  ]
}
```

## Configuration

### Backend (`backend/wrangler.jsonc`)
```json
{
  "name": "globaldots-dns-checker-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01"
}
```

## Examples

### Sample Zone File Format
```
$ORIGIN example.com.
$TTL 3600

@       IN  SOA   ns1.example.com. admin.example.com. (
                  2024021201 ; Serial
                  3600       ; Refresh
                  1800       ; Retry
                  604800     ; Expire
                  86400 )    ; Minimum TTL

@       IN  NS    ns1.example.com.
@       IN  NS    ns2.example.com.
@       IN  A     93.184.216.34
www     IN  A     93.184.216.34
mail    IN  A     93.184.216.35
@       IN  MX    10 mail.example.com.
```

### Querying a DNS Server
Enter any of the following:
- `1.1.1.1` (Cloudflare DNS)
- `8.8.8.8` (Google DNS)
- `ns1.example.com` (Your authoritative nameserver)

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend deployment fails
Ensure `wrangler.jsonc` has valid configuration:
- `name`: Must be unique across Cloudflare
- `main`: Points to `src/index.ts`
- `compatibility_date`: Valid date in YYYY-MM-DD format

### DNS queries fail
The backend uses Cloudflare's DNS-over-HTTPS API. For custom DNS servers, the current implementation queries via DoH. Direct UDP/TCP queries to arbitrary servers require additional infrastructure.

## License

MIT

## Contributing

Pull requests are welcome! Please ensure all tests pass and follow the existing code style.
