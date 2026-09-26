import defaults from '../shared/default-content.json';
import { validateContent } from '../shared/validation';
import type { Store, ContentRow, AuthSession } from '../backend/contracts';
import type { AppointmentRequest, ReviewRecord } from '../src/types';
// Synthetic test data only. This adapter is never imported by production.
export const testUser = '11111111-1111-4111-8111-111111111111';
export class MemoryStore implements Store {
    content: ContentRow = { data: validateContent(structuredClone(defaults)), version: 0 };
    sessions = new Map<string, AuthSession>();
    appointments = new Map<string, AppointmentRequest>();
    reviews = new Map<string, ReviewRecord>();
    limits = new Map<string, {
        count: number;
        until: number;
    }>();
    images = new Map<string, Uint8Array>();
    password = 'Test-password-123!';
    failSave = false;
    async readContent() { return structuredClone(this.content); }
    async saveContent(data: ContentRow['data'], version: number) {
        if (this.failSave)
            throw new Error('simulated');
        if (version !== this.content.version)
            return null;
        this.content = { data: structuredClone(data), version: version + 1 };
        return this.readContent();
    }
    async login(email: string, password: string) { return email === 'owner@example.test' && password === this.password ? testUser : null; }
    async createSession(hash: string, userId: string, expiresAt: string) { this.sessions.set(hash, { userId, expiresAt }); }
    async readSession(hash: string) { return this.sessions.get(hash) || null; }
    async deleteSession(hash: string) { this.sessions.delete(hash); }
    async changePassword(userId: string, email: string, current: string, next: string) {
        if (await this.login(email, current) !== userId)
            return false;
        this.password = next;
        this.sessions.clear();
        return true;
    }
    async rateLimit(key: string, max: number, seconds: number) {
        let value = this.limits.get(key);
        if (!value || value.until <= Date.now()) {
            value = { count: 0, until: Date.now() + seconds * 1000 };
            this.limits.set(key, value);
        }
        return ++value.count <= max;
    }
    async listAppointments() { return structuredClone([...this.appointments.values()].reverse()); }
    async addAppointment(value: AppointmentRequest) {
        if (!this.appointments.has(value.id))
            this.appointments.set(value.id, { ...value, version: 1 });
    }
    async changeAppointment(id: string, patch: Partial<AppointmentRequest>, version: number) {
        const current = this.appointments.get(id);
        if (!current || current.version !== version)
            return false;
        this.appointments.set(id, { ...current, ...patch, version: version + 1 });
        return true;
    }
    async deleteAppointment(id: string, version: number) {
        if (this.appointments.get(id)?.version !== version)
            return false;
        return this.appointments.delete(id);
    }
    async listReviews(pending: boolean) { return structuredClone([...this.reviews.values()].filter(r => pending || r.status === 'approved')); }
    async addReview(value: ReviewRecord) {
        if (!this.reviews.has(value.id))
            this.reviews.set(value.id, structuredClone(value));
    }
    async changeReview(value: ReviewRecord, version: number) {
        if (this.reviews.get(value.id)?.version !== version)
            return false;
        this.reviews.set(value.id, { ...structuredClone(value), version: version + 1 });
        return true;
    }
    async deleteReview(id: string, version: number) {
        if (this.reviews.get(id)?.version !== version)
            return false;
        return this.reviews.delete(id);
    }
    async upload(bytes: Uint8Array, type: string) { const url = `/test-images/${crypto.randomUUID()}.${type === 'image/png' ? 'png' : 'jpg'}`; this.images.set(url, bytes); return url; }
    async deleteUpload(url: string) { this.images.delete(url); }
}
