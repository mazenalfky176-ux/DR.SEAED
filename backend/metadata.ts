import type { ContentData } from '../src/types';
export function decorateHtml(html: string, data: ContentData, origin: string) {
    const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const title = `${data.doctorProfile.nameAr} | ${data.doctorProfile.nameEn}`;
    const description = data.websiteContent.heroSubtitleAr;
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`);
    const values: Record<string, string> = { description, 'og:title': title, 'og:description': description, 'og:image': new URL(data.doctorProfile.photoUrl, origin).href };
    for (const [key, value] of Object.entries(values))
        html = html.replace(new RegExp(`<meta (?:name|property)="${key}"[^>]*>`), `<meta ${key === 'description' ? 'name' : 'property'}="${key}" content="${escape(value)}">`);
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
    return html.replace('</head>', `<link rel="canonical" href="${escape(origin + '/')}"></head>`);
}
