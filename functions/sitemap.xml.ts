import type { Environment } from '../backend/contracts';
export function onRequestGet(context: {
    request: Request;
    env: Environment;
}) {
    const origin = new URL(context.env.PUBLIC_SITE_URL || context.request.url).origin.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
