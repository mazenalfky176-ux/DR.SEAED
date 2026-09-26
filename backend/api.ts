import { z } from 'zod';
import { appointmentInput, reviewInput, contentSchema, statusSchema, testimonialSchema, validSlot } from '../shared/validation';
import type { Store, Environment } from './contracts';
import { ApiError } from './contracts';
import type { ContentData, ReviewRecord } from '../src/types';
import { createStore } from './supabase-store';
const encoder = new TextEncoder();
export async function hash(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))).map(n => n.toString(16).padStart(2, '0')).join(''); }
const cookieName = 'clinic_session';
function token(req: Request) { return req.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || ''; }
function sessionCookie(req: Request, value: string, age = 28800) { const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : ''; return `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${age}${secure}`; }
const json = (value: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
async function body(req: Request) {
    if (!req.headers.get('content-type')?.includes('application/json'))
        throw new ApiError(415, 'INVALID_CONTENT_TYPE');
    return JSON.parse(await limitedText(req, 600000)) as unknown;
}
async function limitedText(req: Request, max: number) { const bytes = await limitedBytes(req, max); return new TextDecoder().decode(bytes); }
async function limitedBytes(req: Request, max: number) {
    if (Number(req.headers.get('content-length')) > max)
        throw new ApiError(413, 'TOO_LARGE');
    const reader = req.body?.getReader();
    if (!reader)
        return new Uint8Array();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done)
            break;
        size += value.length;
        if (size > max) {
            await reader.cancel();
            throw new ApiError(413, 'TOO_LARGE');
        }
        chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let at = 0;
    for (const c of chunks) {
        bytes.set(c, at);
        at += c.length;
    }
    return bytes;
}
const version = z.number().int().min(0);
export async function handleApi(req: Request, env: Environment, injected?: Store): Promise<Response> {
    try {
        const pathname = new URL(req.url).pathname.replace(/\/$/, '');
        const method = req.method;
        if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method))
            throw new ApiError(405, 'METHOD_NOT_ALLOWED');
        if (method !== 'GET') {
            const origin = req.headers.get('origin');
            const allowed = env.PUBLIC_SITE_URL ? new URL(env.PUBLIC_SITE_URL).origin : new URL(req.url).origin;
            if (origin !== allowed)
                throw new ApiError(403, 'INVALID_ORIGIN');
        }
        const store = injected || createStore(env);
        const requireAdmin = async () => {
            const raw = token(req);
            if (!/^[a-f0-9]{64}$/.test(raw))
                throw new ApiError(401, 'UNAUTHORIZED');
            const session = await store.readSession(await hash(raw));
            if (!session || session.userId !== env.ADMIN_USER_ID || Date.parse(session.expiresAt) <= Date.now())
                throw new ApiError(401, 'UNAUTHORIZED');
            return session;
        };
        const limit = async (action: string, max: number, seconds: number) => {
            const ip = req.headers.get('cf-connecting-ip') || 'local';
            const key = await hash(`${env.ADMIN_USER_ID}:${action}:${ip}`);
            if (!await store.rateLimit(key, max, seconds))
                throw new ApiError(429, 'RATE_LIMITED');
        };
        if (pathname === '/api/content' && method === 'GET') {
            const [content, reviews] = await Promise.all([store.readContent(), store.listReviews(false)]);
            return json({ data: { ...content.data, testimonials: reviews.map(r => r.data) }, version: content.version });
        }
        if (pathname === '/api/login' && method === 'POST') {
            await limit('login', 8, 600);
            const value = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) }).strict().parse(await body(req));
            const userId = await store.login(value.email, value.password);
            if (!userId)
                throw new ApiError(401, 'INVALID_LOGIN');
            const raw = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(n => n.toString(16).padStart(2, '0')).join('');
            await store.createSession(await hash(raw), userId, new Date(Date.now() + 28800000).toISOString());
            return json({ success: true }, 200, { 'Set-Cookie': sessionCookie(req, raw) });
        }
        if (pathname === '/api/logout' && method === 'POST') {
            const raw = token(req);
            if (raw)
                await store.deleteSession(await hash(raw));
            return json({ success: true }, 200, { 'Set-Cookie': sessionCookie(req, '', 0) });
        }
        if (pathname === '/api/appointments' && method === 'POST') {
            await limit('appointment', 5, 600);
            const value = appointmentInput.parse(await body(req));
            const content = await store.readContent();
            if (!validSlot(value.preferredDate, value.preferredTime, content.data.clinicContact.schedule))
                throw new ApiError(422, 'INVALID_SLOT');
            const service = content.data.services.find(s => s.id === value.treatment);
            if (!service && value.treatment !== 'consultation')
                throw new ApiError(422, 'INVALID_SERVICE');
            const { website, ...data } = value;
            await store.addAppointment({ ...data, status: 'New', createdAt: new Date().toISOString() });
            return json({ success: true, id: value.id }, 201);
        }
        if (pathname === '/api/reviews' && method === 'POST') {
            await limit('review', 3, 3600);
            const v = reviewInput.parse(await body(req));
            const content = await store.readContent();
            const treatment = content.data.services.find(s => s.id === v.treatment);
            if (!treatment && v.treatment !== 'consultation')
                throw new ApiError(422, 'INVALID_SERVICE');
            await store.addReview({ id: v.id, status: 'pending', version: 1, createdAt: new Date().toISOString(), data: { id: v.id, patientNameEn: v.name, patientNameAr: v.name, treatmentEn: treatment?.nameEn || 'Consultation', treatmentAr: treatment?.nameAr || 'استشارة', reviewEn: v.review, reviewAr: v.review, rating: v.rating, isDemo: false } });
            return json({ success: true }, 201);
        }
        if (!['/api/session', '/api/content', '/api/image', '/api/appointments', '/api/reviews'].some(p => pathname === p || pathname.startsWith(p + '/')))
            throw new ApiError(404, 'NOT_FOUND');
        const session = await requireAdmin();
        if (pathname === '/api/session' && method === 'GET')
            return json({ authenticated: true, expiresAt: session.expiresAt });
        if (pathname === '/api/content' && method === 'PATCH') {
            const value = z.object({ section: z.enum(Object.keys(contentSchema.shape) as [
                    keyof ContentData,
                    ...(keyof ContentData)[]
                ]), value: z.unknown(), version }).strict().parse(await body(req));
            const current = await store.readContent();
            if (current.version !== value.version)
                throw new ApiError(409, 'CONFLICT');
            const next = contentSchema.parse({ ...current.data, [value.section]: value.value }) as unknown as ContentData;
            const saved = await store.saveContent(next, value.version);
            if (!saved)
                throw new ApiError(409, 'CONFLICT');
            // Only remove an old managed portrait after the replacement is committed.
            if (value.section === 'doctorProfile' && current.data.doctorProfile.photoUrl !== next.doctorProfile.photoUrl) {
                const old = current.data.doctorProfile.photoUrl;
                if (!JSON.stringify(next).includes(old))
                    await store.deleteUpload(old).catch(() => console.warn('Unused image cleanup deferred'));
            }
            return json(saved);
        }
        if (pathname === '/api/image' && method === 'POST') {
            await limit('upload', 15, 600);
            const bytes = await limitedBytes(req, 8 * 1024 * 1024);
            const type = req.headers.get('content-type') || '';
            const valid = (type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) || (type === 'image/png' && [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n)) || (type === 'image/webp' && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP');
            if (!valid)
                throw new ApiError(422, 'INVALID_IMAGE');
            return json({ url: await store.upload(bytes, type) }, 201);
        }
        if (pathname === '/api/image' && method === 'DELETE') {
            const { url } = z.object({ url: z.string().url() }).strict().parse(await body(req));
            if (JSON.stringify((await store.readContent()).data).includes(url))
                throw new ApiError(409, 'IMAGE_IN_USE');
            await store.deleteUpload(url);
            return json({ success: true });
        }
        if (pathname === '/api/appointments' && method === 'GET')
            return json({ data: await store.listAppointments() });
        if (pathname === '/api/reviews' && method === 'GET')
            return json({ data: await store.listReviews(true) });
        const appointmentMatch = pathname.match(/^\/api\/appointments\/([a-f0-9-]{36})$/);
        if (appointmentMatch && method === 'PATCH') {
            const v = z.object({ version, patch: z.object({ status: statusSchema.optional(), notes: z.string().max(4000).optional() }).strict() }).strict().parse(await body(req));
            if (!await store.changeAppointment(appointmentMatch[1], v.patch, v.version))
                throw new ApiError(409, 'CONFLICT');
            return json({ success: true });
        }
        const reviewMatch = pathname.match(/^\/api\/reviews\/([a-f0-9-]{36})$/);
        if (reviewMatch && method === 'PATCH') {
            const v = z.object({ version, data: testimonialSchema, status: z.enum(['pending', 'approved']) }).strict().parse(await body(req));
            if (v.data.id !== reviewMatch[1])
                throw new ApiError(422, 'INVALID_DATA');
            if (!await store.changeReview({ id: reviewMatch[1], data: v.data as ReviewRecord['data'], status: v.status, version: v.version, createdAt: '' }, v.version))
                throw new ApiError(409, 'CONFLICT');
            return json({ success: true });
        }
        if ((appointmentMatch || reviewMatch) && method === 'DELETE') {
            const v = z.object({ version }).strict().parse(await body(req));
            const match = appointmentMatch || reviewMatch!;
            const deleted = appointmentMatch ? await store.deleteAppointment(match[1], v.version) : await store.deleteReview(match[1], v.version);
            if (!deleted)
                throw new ApiError(409, 'CONFLICT');
            return json({ success: true });
        }
        throw new ApiError(404, 'NOT_FOUND');
    }
    catch (error) {
        if (error instanceof ApiError)
            return json({ error: error.code }, error.status);
        if (error instanceof z.ZodError || error instanceof SyntaxError)
            return json({ error: 'INVALID_DATA' }, 422);
        console.error('API request failed');
        return json({ error: 'SERVER_ERROR' }, 500);
    }
}
