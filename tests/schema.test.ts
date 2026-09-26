import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { normalizeLegacy } from '../shared/legacy-content';
import defaults from '../shared/default-content.json';
test('legacy public import strips secrets and preserves edits and empty lists', () => { const value = normalizeLegacy({ ...defaults, doctorProfile: { ...defaults.doctorProfile, bioAr: 'نص محفوظ' }, services: [], appointments: [{ patientName: 'private' }], adminPassword: 'secret', ownerCode: 'secret' }); assert.equal(value.doctorProfile.bioAr, 'نص محفوظ'); assert.deepEqual(value.services, []); assert.equal('adminPassword' in value, false); assert.equal('ownerCode' in value, false); assert.equal('appointments' in value, false); });
test('SQL migration runs twice, preserves full private records, locks browser roles and enforces rate limits', async () => {
    const db = new PGlite();
    try {
        await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text);create table public.site_settings(id text primary key,settings_json jsonb);create table public.appointments(id text,patient_name text,phone text,status text);grant all on public.appointments,public.site_settings to anon,authenticated;alter table public.appointments enable row level security;create policy "insecure old" on public.appointments for all using(true) with check(true);`);
        await db.query(`insert into public.site_settings values('default',$1)`, [JSON.stringify({ appointments: [{ id: 'legacy-1', patientName: 'Synthetic', phone: '01000000000', email: 'synthetic@example.test', complaint: 'Preserve this', age: '40', status: 'confirmed' }], adminPassword: 'obsolete', ownerCode: 'obsolete', testimonials: [] })]);
        await db.exec(`insert into public.appointments values('legacy-1','Partial copy','01000000000','pending');`);
        const sql = readFileSync(new URL('../supabase-schema.sql', import.meta.url), 'utf8');
        await db.exec(sql);
        await db.exec(sql);
        const rows = await db.query<{
            data: {
                complaint: string;
            };
            status: string;
        }>('select data,status from public.clinic_appointments');
        assert.equal(rows.rows.length, 1);
        assert.equal(rows.rows[0].data.complaint, 'Preserve this');
        assert.equal(rows.rows[0].status, 'Confirmed');
        const legacy = await db.query<{
            settings_json: Record<string, unknown>;
        }>('select settings_json from public.site_settings');
        assert.equal(legacy.rows[0].settings_json.adminPassword, undefined);
        assert.equal(legacy.rows[0].settings_json.appointments, undefined);
        for (const role of ['anon', 'authenticated']) {
            const perms = await db.query<{
                can_read: boolean;
                can_write: boolean;
            }>(`select has_table_privilege('${role}','public.clinic_appointments','select') as can_read,has_table_privilege('${role}','public.clinic_content','update') as can_write`);
            assert.equal(perms.rows[0].can_read, false);
            assert.equal(perms.rows[0].can_write, false);
        }
        assert.equal((await db.query(`select * from pg_policies where schemaname='public'`)).rows.length, 0);
        for (const expected of [true, true, false]) {
            const r = await db.query<{
                allowed: boolean;
            }>(`select public.clinic_rate_limit('test',2,60) as allowed`);
            assert.equal(r.rows[0].allowed, expected);
        }
        await db.exec('set role anon');
        await assert.rejects(db.query('select * from public.clinic_appointments'));
        await db.exec('reset role');
    }
    finally {
        await db.close();
    }
});
