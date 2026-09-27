import type { ContentData, AppointmentRequest, ReviewRecord } from '../src/types';
export interface Environment {
    SUPABASE_URL?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    ADMIN_USER_ID?: string;
    PUBLIC_SITE_URL?: string;
}
export interface ContentRow {
    data: ContentData;
    version: number;
}
export interface AuthSession {
    userId: string;
    expiresAt: string;
}
export interface Store {
    readContent(): Promise<ContentRow>;
    saveContent(data: ContentData, version: number): Promise<ContentRow | null>;
    login(email: string, password: string): Promise<string | null>;
    createSession(hash: string, userId: string, expiresAt: string): Promise<void>;
    readSession(hash: string): Promise<AuthSession | null>;
    deleteSession(hash: string): Promise<void>;
    changePassword?(userId: string, email: string, currentPassword: string, password: string): Promise<boolean>;
    rateLimit(key: string, limit: number, seconds: number): Promise<boolean>;
    listAppointments(): Promise<AppointmentRequest[]>;
    addAppointment(value: AppointmentRequest): Promise<void>;
    changeAppointment(id: string, patch: Partial<AppointmentRequest>, version: number): Promise<boolean>;
    deleteAppointment(id: string, version: number): Promise<boolean>;
    listReviews(includePending: boolean): Promise<ReviewRecord[]>;
    addReview(value: ReviewRecord): Promise<void>;
    changeReview(value: ReviewRecord, version: number): Promise<boolean>;
    deleteReview(id: string, version: number): Promise<boolean>;
    upload(bytes: Uint8Array, type: string): Promise<string>;
    deleteUpload(url: string): Promise<void>;
}
export class ApiError extends Error {
    constructor(public status: number, public code: string) { super(code); }
}
