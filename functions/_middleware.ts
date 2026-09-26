import { createStore } from '../backend/supabase-store';
import { decorateHtml } from '../backend/metadata';
import type { Environment } from '../backend/contracts';
export async function onRequest(context: {
    request: Request;
    env: Environment;
    next: () => Promise<Response>;
}) {
    const response = await context.next();
    if (new URL(context.request.url).pathname !== '/' || !response.headers.get('content-type')?.includes('text/html'))
        return response;
    try {
        const content = await createStore(context.env).readContent();
        const origin = new URL(context.env.PUBLIC_SITE_URL || context.request.url).origin;
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.delete('etag');
        headers.set('Cache-Control', 'no-store');
        return new Response(decorateHtml(await response.text(), content.data, origin), { status: response.status, headers });
    }
    catch {
        return response;
    }
}
