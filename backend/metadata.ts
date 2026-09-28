import type { ContentData } from '../src/types';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function phoneForSchema(value: string) {
    const digits = value.replace(/\D/g, '');
    return digits.startsWith('0') ? `+20${digits.slice(1)}` : value;
}

export function decorateHtml(html: string, data: ContentData, origin: string) {
    const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const home = `${origin}/`;
    const image = new URL(data.doctorProfile.photoUrl, origin).href;
    const title = `${data.doctorProfile.nameAr} | ${data.doctorProfile.nameEn} - طبيب أسنان بالإسكندرية`;
    const description = `عيادة ${data.doctorProfile.nameAr} لطب وتجميل الأسنان في ${data.clinicContact.addressAr}. ${data.websiteContent.heroSubtitleAr}`;
    const englishDescription = `${data.doctorProfile.nameEn} dental clinic in ${data.clinicContact.addressEn}. ${data.websiteContent.heroSubtitleEn}`;

    const setMeta = (attribute: 'name' | 'property', key: string, value: string) => {
        const tag = `<meta ${attribute}="${key}" content="${escape(value)}">`;
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matcher = new RegExp(`<meta\\s+(?:[^>]*?\\s)?${attribute}=["']${escapedKey}["'][^>]*>`, 'i');
        html = matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `${tag}</head>`);
    };

    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escape(title)}</title>`);
    setMeta('name', 'description', description);
    setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:image:alt', `${data.doctorProfile.nameAr} - ${data.doctorProfile.nameEn}`);
    setMeta('property', 'og:url', home);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', `${data.doctorProfile.nameAr} Dental Care`);
    setMeta('property', 'og:locale', 'ar_EG');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', englishDescription);
    setMeta('name', 'twitter:image', image);

    const sameAs = [data.clinicContact.instagramUrl, data.clinicContact.facebookUrl, data.clinicContact.tiktokUrl]
        .filter((value): value is string => typeof value === 'string' && /^https:\/\//i.test(value));
    const openingHours = data.clinicContact.schedule.days.map(day => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${dayNames[day]!}`,
        opens: data.clinicContact.schedule.open,
        closes: data.clinicContact.schedule.close,
    }));
    const schema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': ['Dentist', 'LocalBusiness'],
                '@id': `${home}#clinic`,
                name: `${data.doctorProfile.nameAr} لطب وتجميل الأسنان`,
                alternateName: [
                    `${data.doctorProfile.nameEn} Dental Care`,
                    'Dr Saeed Elmaghlany',
                    'Dr. Saeed El Maghlany',
                    'دكتور سعيد المغلاني',
                ],
                url: home,
                image,
                logo: image,
                description: `${description} ${englishDescription}`,
                telephone: phoneForSchema(data.clinicContact.phone),
                email: data.clinicContact.email,
                priceRange: '$$',
                medicalSpecialty: 'Dentistry',
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: data.clinicContact.addressAr,
                    addressLocality: 'Alexandria',
                    addressCountry: 'EG',
                },
                areaServed: { '@type': 'City', name: 'Alexandria' },
                sameAs,
                openingHoursSpecification: openingHours,
                knowsAbout: data.services.flatMap(service => [service.nameAr, service.nameEn]),
                employee: { '@id': `${home}#doctor` },
            },
            {
                '@type': 'Person',
                '@id': `${home}#doctor`,
                name: data.doctorProfile.nameEn,
                alternateName: [data.doctorProfile.nameAr, 'دكتور سعيد المغلاني', 'Dr. Saeed El Maghlany'],
                image,
                jobTitle: [data.doctorProfile.titleAr, data.doctorProfile.titleEn],
                description: `${data.doctorProfile.bioAr} ${data.doctorProfile.bioEn}`,
                worksFor: { '@id': `${home}#clinic` },
                sameAs,
            },
        ],
    };
    const jsonLd = JSON.stringify(schema).replace(/</g, '\\u003c');
    html = html.replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
    return html.replace('</head>', `<link rel="canonical" href="${escape(home)}"><script type="application/ld+json">${jsonLd}</script></head>`);
}
