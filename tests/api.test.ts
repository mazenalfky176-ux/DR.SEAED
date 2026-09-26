import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../backend/api';
import { MemoryStore, testUser } from './memory-store';
import { slots, validSlot, validateContent } from '../shared/validation';
import defaults from '../shared/default-content.json';
const origin = 'https://clinic.example.test';
function setup() {
    const store = new MemoryStore();
    const env = { ADMIN_USER_ID: testUser, PUBLIC_SITE_URL: origin };
    let cookie = '';
    const call = (path: string, method = 'GET', value?: unknown, headers: Record<string, string> = {}) => handleApi(new Request(origin + '/api' + path, { method, headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json', ...headers }, ...(value === undefined ? {} : { body: JSON.stringify(value) }) }), env, store);
    const login = async () => { const r = await call('/login', 'POST', { email: 'owner@example.test', password: store.password }); assert.equal(r.status, 200); cookie = r.headers.get('set-cookie')!.split(';')[0]; return r; };
    return { store, call, login };
}
test('defaults validate and every section round-trips to an independent visitor', async () => {
    const { store, call, login } = setup();
    validateContent(defaults);
    await login();
    let version = 0;
    for (const [section, value] of Object.entries(store.content.data)) {
        const r = await call('/content', 'PATCH', { section, value, version });
        assert.equal(r.status, 200, section);
        version++;
        assert.equal((await r.json()).version, version);
    }
    const visitor = await handleApi(new Request(origin + '/api/content'), { ADMIN_USER_ID: testUser }, store);
    const body = await visitor.json();
    assert.equal(body.version, version);
    assert.deepEqual(body.data.doctorProfile, defaults.doctorProfile);
    assert.equal(body.data.appointments, undefined);
    assert.equal(body.data.adminPassword, undefined);
    assert.equal(visitor.headers.get('cache-control'), 'no-store');
});
test('public visitors cannot administer, read bookings, or impersonate local auth', async () => {
    const { call } = setup();
    for (const [path, method, value] of [['/appointments', 'GET', undefined], ['/reviews', 'GET', undefined], ['/image', 'POST', {}], ['/content', 'PATCH', {}], ['/password', 'POST', {}]] as const) {
        assert.equal((await call(path, method, value, { 'Cookie': 'admin=true' })).status, 401);
    }
    assert.equal((await call('/login', 'POST', { email: 'owner@example.test', password: 'wrong' })).status, 401);
});
test('cookies are secure, CSRF rejected, logout revokes sessions', async () => { const { call, login } = setup(); const response = await login(); assert.match(response.headers.get('set-cookie')!, /HttpOnly; SameSite=Strict/); assert.match(response.headers.get('set-cookie')!, /Secure/); assert.equal((await call('/logout', 'POST', undefined, { Origin: 'https://evil.example' })).status, 403); assert.equal((await call('/session')).status, 200); await call('/logout', 'POST'); assert.equal((await call('/session')).status, 401); });
test('stale writes, failed saves, and empty lists never silently overwrite', async () => { const { store, call, login } = setup(); await login(); assert.equal((await call('/content', 'PATCH', { section: 'services', value: [], version: 0 })).status, 200); assert.deepEqual(store.content.data.services, []); assert.equal((await call('/content', 'PATCH', { section: 'services', value: defaults.services, version: 0 })).status, 409); store.failSave = true; assert.equal((await call('/content', 'PATCH', { section: 'services', value: defaults.services, version: 1 })).status, 500); assert.deepEqual(store.content.data.services, []); });
test('booking is private, idempotent, complete and versioned', async () => { const { store, call, login } = setup(); store.content.data.clinicContact.schedule = { days: [0, 1, 2, 3, 4, 5, 6], open: '09:00', close: '18:00', slotMinutes: 30 }; const date = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10); const item = { id: crypto.randomUUID(), patientName: 'Synthetic patient', age: '32', complaint: 'Test visit', phone: '01000000000', email: 'test@example.test', treatment: 'consultation', preferredDate: date, preferredTime: '10:00', message: 'Test notes', website: '' }; assert.equal((await call('/appointments', 'POST', item)).status, 201); assert.equal((await call('/appointments', 'POST', item)).status, 201); assert.equal(store.appointments.size, 1); assert.equal((await call('/appointments')).status, 401); await login(); const row = (await (await call('/appointments')).json()).data[0]; assert.equal(row.complaint, item.complaint); assert.equal(row.email, item.email); assert.equal((await call('/appointments/' + item.id, 'PATCH', { version: 1, patch: { status: 'Confirmed', notes: 'Call made' } })).status, 200); assert.equal((await call('/appointments/' + item.id, 'DELETE', { version: 1 })).status, 409); assert.equal((await call('/appointments/' + item.id, 'DELETE', { version: 2 })).status, 200); assert.equal(store.appointments.size, 0); });
test('reviews are moderated and invalid ratings and bots rejected', async () => { const { store, call, login } = setup(); const review = { id: crypto.randomUUID(), name: 'Test person', treatment: 'consultation', rating: 5, review: 'Synthetic review', website: '' }; assert.equal((await call('/reviews', 'POST', { ...review, rating: 99 })).status, 422); assert.equal((await call('/reviews', 'POST', { ...review, website: 'spam' })).status, 422); assert.equal((await call('/reviews', 'POST', review)).status, 201); assert.equal((await (await call('/content')).json()).data.testimonials.length, 0); await login(); const record = [...store.reviews.values()][0]; assert.equal((await call('/reviews/' + record.id, 'PATCH', { data: record.data, status: 'approved', version: 1 })).status, 200); assert.equal((await (await call('/content')).json()).data.testimonials.length, 1); });
test('rate limiting and password change revoke every session', async () => {
    const { call, login, store } = setup();
    await login();
    await login();
    assert.equal(store.sessions.size, 2);
    assert.equal((await call('/password', 'POST', { email: 'owner@example.test', currentPassword: store.password, password: 'Replacement-test-123!' })).status, 200);
    assert.equal(store.sessions.size, 0);
    for (let i = 0; i < 7; i++)
        await call('/login', 'POST', { email: 'owner@example.test', password: 'bad' });
    assert.equal((await call('/login', 'POST', { email: 'owner@example.test', password: 'bad' })).status, 429);
});
test('image uploads require auth, bounded bytes and correct magic type', async () => { const { store, login } = setup(); const r = await login(); const cookie = r.headers.get('set-cookie')!.split(';')[0]; const upload = (body: Uint8Array, extra: Record<string, string> = {}) => handleApi(new Request(origin + '/api/image', { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'image/png', ...extra }, body }), { ADMIN_USER_ID: testUser }, store); assert.equal((await upload(new TextEncoder().encode('<svg/>'))).status, 422); assert.equal((await upload(new Uint8Array(), { 'Content-Length': '9000000' })).status, 413); assert.equal((await upload(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]))).status, 201); });
test('Cairo schedule rejects closed days, invalid dates, past slots', () => { const s = { days: [0, 1, 2, 3, 4], open: '09:00', close: '10:00', slotMinutes: 30 }; assert.deepEqual(slots(s), ['09:00', '09:30']); assert.equal(validSlot('2026-02-30', '09:00', s), false); assert.equal(validSlot('2020-01-01', '09:00', s), false); assert.equal(validSlot('2026-09-25', '09:00', s, new Date('2026-09-24T00:00:00Z')), false); });
