import { handleApi } from './backend/api';
import { createStore } from './backend/supabase-store';
import { decorateHtml } from './backend/metadata';
import type { Environment } from './backend/contracts';

interface WorkerEnvironment extends Environment {
    ASSETS: {
        fetch(request: Request): Promise<Response>;
    };
}

async function serveHome(request: Request, env: WorkerEnvironment) {
    const response = await env.ASSETS.fetch(request);
    if (!response.headers.get('content-type')?.includes('text/html'))
        return response;
    try {
        const content = await createStore(env).readContent();
        const origin = new URL(env.PUBLIC_SITE_URL || request.url).origin;
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.delete('etag');
        headers.set('Cache-Control', 'no-store');
        return new Response(decorateHtml(await response.text(), content.data, origin), {
            status: response.status,
            headers,
        });
    }
    catch {
        return response;
    }
}

function sitemap(request: Request, env: WorkerEnvironment) {
    const origin = new URL(env.PUBLIC_SITE_URL || request.url).origin
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`,
        { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } },
    );
}

export default {
    async fetch(request: Request, env: WorkerEnvironment): Promise<Response> {
        const pathname = new URL(request.url).pathname;
        if (pathname === '/api' || pathname.startsWith('/api/'))
            return handleApi(request, env);
        if (pathname === '/sitemap.xml')
            return sitemap(request, env);
        if (pathname === '/')
            return serveHome(request, env);
        return env.ASSETS.fetch(request);
    },
};
