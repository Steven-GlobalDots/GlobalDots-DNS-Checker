# Cloudflare Workers Development Rules

## Project Initialization Workflow

When starting a new Cloudflare Worker project:

1. **Confirm the project scope and requirements**
   - What does this worker do?
   - What Cloudflare services does it need?
   - What external APIs or services will it integrate with?

2. **Create initial project structure**:
   ```bash
   npm init -y
   npm install -D wrangler typescript @cloudflare/workers-types
   npx tsc --init
   ```

3. **Create comprehensive README.md** using this template:

```markdown
# [Project Name]

## Overview
[2-3 sentences: what this does and why it exists]

## Architecture
[Brief description of how it works - what services it uses, data flow]

## Local Development
```bash
npm install
npx wrangler dev
```

## Deployment
```bash
npx wrangler deploy
```

## Live URL
https://[worker-name].[subdomain].workers.dev

## API Reference

### `GET /endpoint`
[Description, parameters, response format]

## Configuration
[Environment variables, KV namespaces, or other bindings required]

## Examples
```bash
curl "https://example.workers.dev/endpoint?param=value"
```


4. **Create .gitignore**:
   ```
   node_modules/
   .wrangler/
   .dev.vars
   *.log
   .DS_Store
   dist/
   ```

5. **Before writing code, confirm the README details with me**

## Cloudflare Developer Platform

This project runs on Cloudflare Workers. Suggest and use platform services when appropriate:

| Service | Use Case | How to Add |
|---------|----------|------------|
| **KV** | Key-value storage, caching, configuration | `wrangler kv namespace create <NAME>` |
| **R2** | Object/file storage, large data | `wrangler r2 bucket create <NAME>` |
| **D1** | SQLite database, relational data | `wrangler d1 create <NAME>` |
| **Durable Objects** | Stateful coordination, WebSockets, rate limiting | Define class in wrangler.toml |
| **Queues** | Async processing, background jobs | `wrangler queues create <NAME>` |
| **Workers AI** | ML inference, embeddings, text generation | Add `[ai]` binding |
| **Vectorize** | Vector search, semantic similarity | Create index via dashboard |
| **Browser Rendering** | Screenshots, PDF generation, scraping | Add browser binding |

When a problem would benefit from one of these services, suggest it. For example:
- "You need to cache API responses" -> suggest KV
- "You need to store user uploads" -> suggest R2
- "You need to query structured data" -> suggest D1
- "You need rate limiting per user" -> suggest Durable Objects

Always show the required wrangler.toml configuration when adding bindings.

## Cloudflare Workflows Context

You are building a Cloudflare Worker that uses "Cloudflare Workflows" (Beta).
This is a durable execution engine that differs from standard Workers.

### Key Syntax Rules

1. **Imports**: You must import from `cloudflare:workers`.
   ```typescript
   import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
   ```

2. **Class Structure**: Workflows must extend `WorkflowEntrypoint`.
   ```typescript
   export class MyWorkflow extends WorkflowEntrypoint<Env, Params>
   ```

3. **The `run` Method**: The entry point is `run()`, NOT `fetch()`.
   ```typescript
   async run(event: WorkflowEvent<Params>, step: WorkflowStep)
   ```

4. **Durability (`step.do`)**:
   - All side effects (API calls, DB writes) MUST be wrapped in `step.do`.
   - `step.do` ensures that if the code fails/retries, that specific step is not re-executed if it already succeeded.
   - Example:
     ```typescript
     const data = await step.do('fetch-user', async () => {
       return await fetch('https://api.example.com/user').then(r => r.json());
     });
     ```

5. **Sleep**: Use `step.sleep()` for delays, not `setTimeout`.
   ```typescript
   await step.sleep('wait-for-email', '1 day');
   ```

### Configuration (wrangler.toml)

To register a workflow, the `wrangler.toml` must look like this:
```toml
[[workflows]]
name = "user-onboarding"
binding = "MY_WORKFLOW"
class_name = "UserOnboardingWorkflow"
```

## Code Standards

### Architecture Principles

- Separate concerns: routing, business logic, and data access should be in different functions/files
- Use dependency injection for bindings (pass `env` to functions that need it)
- Handle errors at appropriate boundaries with meaningful messages
- Use TypeScript strictly - define interfaces for all data structures

### Documentation Requirements

- Every exported function needs a JSDoc comment explaining purpose, parameters, and return value
- Complex algorithms or non-obvious logic need inline comments explaining *why*, not just *what*
- Add a "How this works" block comment at the top of files with significant logic
- Constants should have comments explaining what the value represents

### Code Quality

- Use descriptive names: `getUserById` not `getUser`, `maxRetryAttempts` not `max`
- Prefer explicit over clever - readable code beats compact code
- Handle edge cases: null checks, empty arrays, missing properties
- Return early for error conditions to avoid deep nesting
- Use proper HTTP status codes and structured error responses

### Example of Well-Structured Code

```typescript
/**
 * DNS Lookup Service
 *
 * Queries DNS records for a given domain using Google's public DNS API.
 * Returns structured results with proper error handling.
 *
 * Why Google DNS?
 * - No authentication required
 * - Reliable and fast
 * - Supports all record types via simple REST API
 */

import { DnsResponse, DnsRecord, LookupResult } from './types';

/** Google's public DNS-over-HTTPS endpoint */
const DNS_API_BASE = 'https://dns.google/resolve';

/** Supported DNS record types */
const VALID_RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'] as const;
type RecordType = typeof VALID_RECORD_TYPES[number];

/**
 * Performs a DNS lookup for the specified domain and record type.
 *
 * @param domain - The domain name to query (e.g., "example.com")
 * @param recordType - The DNS record type (defaults to "A")
 * @returns Structured result with records or error information
 */
export async function lookupDns(
  domain: string,
  recordType: RecordType = 'A'
): Promise<LookupResult> {
  // Validate inputs before making external request
  if (!isValidDomain(domain)) {
    return {
      success: false,
      error: 'Invalid domain format',
      code: 'INVALID_DOMAIN'
    };
  }

  const url = buildDnsQueryUrl(domain, recordType);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `DNS API returned ${response.status}`,
        code: 'API_ERROR'
      };
    }

    const data: DnsResponse = await response.json();
    const records = parseRecords(data);

    return {
      success: true,
      domain,
      recordType,
      records
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to reach DNS API',
      code: 'NETWORK_ERROR'
    };
  }
}

/**
 * Validates domain format using basic rules.
 * Not a full RFC-compliant check, but catches obvious issues.
 */
function isValidDomain(domain: string): boolean {
  return (
    domain.length > 0 &&
    domain.length < 255 &&
    domain.includes('.') &&
    !domain.includes(' ') &&
    !/^[.-]|[.-]$/.test(domain)
  );
}

function buildDnsQueryUrl(domain: string, recordType: RecordType): string {
  const params = new URLSearchParams({
    name: domain,
    type: recordType
  });
  return `${DNS_API_BASE}?${params}`;
}

function parseRecords(data: DnsResponse): DnsRecord[] {
  if (!data.Answer || data.Answer.length === 0) {
    return [];
  }

  return data.Answer.map(answer => ({
    name: answer.name,
    type: answer.type,
    ttl: answer.TTL,
    value: answer.data
  }));
}
```

### Error Response Format

Always return consistent error structures:
```typescript
interface ErrorResponse {
  success: false;
  error: string;      // Human-readable message
  code: string;       // Machine-readable error code
  details?: unknown;  // Optional additional context
}
```

## When I Ask You to Write Code

1. Confirm understanding of the requirements
2. If the input format seems overly complex, ask: "Could we simplify the input? For example, could this be a CSV/JSON instead of Excel?"
3. Suggest relevant Cloudflare services if they would help
4. Explain your approach briefly before writing
5. Write fully documented, production-quality code
6. Show the wrangler.toml changes if you're adding bindings

## When I Ask You to Explain Code

Walk through the code and explain:
- The overall architecture and data flow
- What each major function/section does
- Why certain approaches were chosen
- What could go wrong and how errors are handled

## Technology Constraints

- Runtime: Cloudflare Workers (V8 isolate, not Node.js)
- No filesystem access - use KV, R2, or D1 for persistence
- Request timeout: 30 seconds (paid) / 10ms CPU time (free)
- Use fetch() for HTTP (built-in)
- ES modules only (not CommonJS)
- Reference: https://developers.cloudflare.com/workers/
