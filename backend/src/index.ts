import { WorkerEntrypoint } from 'cloudflare:workers';

export interface Env {
	// Add bindings here (e.g. KV, D1)
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (url.pathname === '/query') {
			const name = url.searchParams.get('name');
			const type = url.searchParams.get('type') || 'A';
			const server = url.searchParams.get('server') || '1.1.1.1'; // Default to Cloudflare

			if (!name) {
				return new Response(JSON.stringify({ error: 'Missing name parameter' }), {
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			try {
				// For now, we will use Google DNS-over-HTTPS as a proxy if the user requests it,
				// or default to 1.1.1.1 if they don't specify (or if we can't easily reach an arbitrary IP via DoH).
				// 
				// NOTE: True arbitrary DNS query to a random authoritative server (IP) is difficult 
				// without a raw socket DNS client. For this MVP, we will assume standard resolvers 
				// or use a DoH gateway.
				//
				// If the user inputs a specific IP, we might need a different approach.
				// For now, let's implement a simple DoH lookup to 1.1.1.1 or 8.8.8.8.

				const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;

				const response = await fetch(dohUrl, {
					headers: {
						'Accept': 'application/dns-json'
					}
				});

				const data = await response.json();

				return new Response(JSON.stringify(data), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				});
			} catch (err: any) {
				return new Response(JSON.stringify({ error: err.message }), {
					status: 500,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				});
			}
		}

		return new Response('GlobalDots DNS Checker API', { headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
