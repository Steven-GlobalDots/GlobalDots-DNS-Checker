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

		return new Response('GlobalDots DNS Checker API', { headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
