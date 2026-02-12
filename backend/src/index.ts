import { WorkerEntrypoint } from 'cloudflare:workers';

export interface Env {
	ASSETS: Fetcher;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// CORS headers for API endpoints
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// API endpoint for DNS queries
		if (url.pathname === '/api/query') {
			const name = url.searchParams.get('name');
			const type = url.searchParams.get('type') || 'A';

			if (!name) {
				return new Response(JSON.stringify({ error: 'Missing name parameter' }), {
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			try {
				const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;

				const response = await fetch(dohUrl, {
					headers: {
						'Accept': 'application/dns-json'
					}
				});

				const data: any = await response.json();

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

		// Serve static assets for all other requests
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
