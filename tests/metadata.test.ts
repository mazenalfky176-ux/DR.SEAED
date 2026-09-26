import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decorateHtml } from '../backend/metadata';
import { validateContent } from '../shared/validation';
import defaults from '../shared/default-content.json';
test('server metadata follows content and escapes editor input', () => { const data = validateContent(defaults); data.doctorProfile.nameAr = '<script>alert(1)</script>'; data.websiteContent.heroSubtitleAr = '" onload="alert(1)'; const html = decorateHtml(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), data, 'https://example.test'); assert.ok(html.includes('&lt;script&gt;')); assert.ok(html.includes('&quot; onload=&quot;')); assert.ok(html.includes('https://example.test/doctor-original.jpg')); assert.ok(!html.includes('<script>alert(1)</script>')); assert.ok(!html.includes('application/ld+json')); });
