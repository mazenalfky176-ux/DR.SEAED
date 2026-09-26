import { createClient } from '@supabase/supabase-js';
import defaults from '../shared/default-content.json';
import { validateContent } from '../shared/validation';
import type { Store, Environment, ContentRow } from './contracts';
import { ApiError } from './contracts';
import type { AppointmentRequest, ReviewRecord } from '../src/types';
export function createStore(env: Environment): Store {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.ADMIN_USER_ID || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD)
        throw new ApiError(503, 'NOT_CONFIGURED');
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(12000) }) } });
    const check = (error: unknown) => {
        if (error) {
            console.error('Database operation failed');
            throw new ApiError(503, 'DATABASE_UNAVAILABLE');
        }
    };
    const appointment = (row: {
        id: string;
        data: AppointmentRequest;
        status: AppointmentRequest['status'];
        version: number;
        created_at: string;
    }) => ({ ...row.data, id: row.id, status: row.status, version: row.version, createdAt: row.created_at });
    const review = (row: {
        id: string;
        data: ReviewRecord['data'];
        status: ReviewRecord['status'];
        version: number;
        created_at: string;
    }): ReviewRecord => ({ id: row.id, data: row.data, status: row.status, version: row.version, createdAt: row.created_at });
    return {
        async readContent() { const { data, error } = await client.from('clinic_content').select('data,version').eq('id', 'default').maybeSingle(); check(error); return data ? { data: validateContent(data.data), version: data.version } : { data: validateContent(defaults), version: 0 }; },
        async saveContent(data, version) {
            const row = { id: 'default', data, version: version + 1, updated_at: new Date().toISOString() };
            const result = version === 0 ? await client.from('clinic_content').insert(row).select('data,version').maybeSingle() : await client.from('clinic_content').update(row).eq('id', 'default').eq('version', version).select('data,version').maybeSingle();
            if (result.error?.code === '23505')
                return null;
            check(result.error);
            return result.data as ContentRow | null;
        },
        async login(email, password) {
            const normalize = (value: string) => value.trim().toLowerCase();
            if (normalize(email) !== normalize(env.ADMIN_EMAIL!) || password !== env.ADMIN_PASSWORD)
                return null;
            return env.ADMIN_USER_ID!;
        },
        async createSession(token_hash, user_id, expires_at) {
            const cleanup = await client.from('clinic_sessions').delete().lt('expires_at', new Date().toISOString());
            check(cleanup.error);
            const { error } = await client.from('clinic_sessions').insert({ token_hash, user_id, expires_at });
            check(error);
        },
        async readSession(hash) {
            const { data, error } = await client.from('clinic_sessions').select('user_id,expires_at').eq('token_hash', hash).gt('expires_at', new Date().toISOString()).maybeSingle();
            check(error);
            if (!data || data.user_id !== env.ADMIN_USER_ID)
                return null;
            const account = await client.auth.admin.getUserById(data.user_id);
            if (account.error || !account.data.user)
                return null;
            const banned = (account.data.user as {
                banned_until?: string;
            }).banned_until;
            if (banned && Date.parse(banned) > Date.now())
                return null;
            return { userId: data.user_id, expiresAt: data.expires_at };
        },
        async deleteSession(hash) { const { error } = await client.from('clinic_sessions').delete().eq('token_hash', hash); check(error); },
        async rateLimit(key, limit, seconds) { const { data, error } = await client.rpc('clinic_rate_limit', { request_key: key, max_count: limit, window_seconds: seconds }); check(error); return data === true; },
        async listAppointments() { const { data, error } = await client.from('clinic_appointments').select('*').order('created_at', { ascending: false }).limit(2000); check(error); return (data || []).map(appointment); },
        async addAppointment(value) {
            const { error } = await client.from('clinic_appointments').insert({ id: value.id, data: value, status: 'New' });
            if (error?.code !== '23505')
                check(error);
        },
        async changeAppointment(id, patch, version) {
            const current = await client.from('clinic_appointments').select('data').eq('id', id).eq('version', version).maybeSingle();
            check(current.error);
            if (!current.data)
                return false;
            const { data, error } = await client.from('clinic_appointments').update({ data: { ...current.data.data, ...patch }, ...(patch.status ? { status: patch.status } : {}), version: version + 1 }).eq('id', id).eq('version', version).select('id');
            check(error);
            return !!data?.length;
        },
        async deleteAppointment(id, version) { const { data, error } = await client.from('clinic_appointments').delete().eq('id', id).eq('version', version).select('id'); check(error); return !!data?.length; },
        async listReviews(includePending) {
            let query = client.from('clinic_reviews').select('*').order('created_at', { ascending: false }).limit(1000);
            if (!includePending)
                query = query.eq('status', 'approved');
            const { data, error } = await query;
            check(error);
            return (data || []).map(review);
        },
        async addReview(value) {
            const { error } = await client.from('clinic_reviews').insert({ id: value.id, data: value.data, status: value.status });
            if (error?.code !== '23505')
                check(error);
        },
        async changeReview(value, version) { const { data, error } = await client.from('clinic_reviews').update({ data: value.data, status: value.status, version: version + 1 }).eq('id', value.id).eq('version', version).select('id'); check(error); return !!data?.length; },
        async deleteReview(id, version) { const { data, error } = await client.from('clinic_reviews').delete().eq('id', id).eq('version', version).select('id'); check(error); return !!data?.length; },
        async upload(bytes, type) { const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'; const name = `managed/${crypto.randomUUID()}.${ext}`; const { error } = await client.storage.from('clinic-images').upload(name, bytes, { contentType: type, upsert: false, cacheControl: '31536000' }); check(error); return client.storage.from('clinic-images').getPublicUrl(name).data.publicUrl; },
        async deleteUpload(url) {
            const prefix = `${env.SUPABASE_URL}/storage/v1/object/public/clinic-images/`;
            if (!url.startsWith(prefix))
                return;
            const key = url.slice(prefix.length);
            if (!/^managed\/[a-f0-9-]+\.(jpg|png|webp)$/.test(key))
                return;
            const { error } = await client.storage.from('clinic-images').remove([key]);
            check(error);
        },
    };
}
