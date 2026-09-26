import type { Language } from '../types';
const messages: Record<string, [
    string,
    string
]> = {
    NOT_CONFIGURED: ['خدمة الحفظ لم تُجهّز بعد. تواصل مع مسؤول الموقع.', 'The publishing service is not configured yet.'],
    DATABASE_UNAVAILABLE: ['تعذر الاتصال بقاعدة البيانات. لم يتم تأكيد الحفظ.', 'Database unavailable. Saving has not been confirmed.'],
    UNAUTHORIZED: ['انتهت جلسة الإدارة. سجّل الدخول مجددًا؛ مسودتك لم تُحذف.', 'Your session expired. Sign in again; your draft is retained.'],
    INVALID_LOGIN: ['البريد أو كلمة المرور غير صحيحة، أو الحساب غير مخوّل.', 'Incorrect credentials or account is not authorized.'],
    CONFLICT: ['هناك تعديل أحدث. احتفظ بمسودتك، ثم أعد تحميل القسم وقارن التغييرات قبل الحفظ.', 'A newer change exists. Keep your draft, reload this section and compare before saving.'],
    INVALID_DATA: ['راجع الحقول المطلوبة وصيغ البيانات. لم يتم الحفظ.', 'Check required fields and data formats. Not saved.'],
    INVALID_SLOT: ['اختر يوم عمل وموعدًا قادمًا ضمن ساعات العيادة.', 'Choose a future slot during clinic working hours.'],
    INVALID_SERVICE: ['الخدمة لم تعد متاحة. حدّث الصفحة واختر خدمة أخرى.', 'This treatment is no longer available. Refresh and choose another.'],
    RATE_LIMITED: ['طلبات كثيرة في وقت قصير. حاول لاحقًا.', 'Too many requests. Please try again later.'],
    INVALID_IMAGE: ['اختر صورة JPEG أو PNG أو WebP سليمة.', 'Choose a valid JPEG, PNG or WebP image.'],
    TOO_LARGE: ['الملف أكبر من الحد المسموح (٨ ميجابايت للصورة).', 'File exceeds the allowed size (8 MB per image).'],
    NETWORK_ERROR: ['تعذر تأكيد الحفظ بسبب الاتصال. البيانات ما زالت في النموذج؛ أعد المحاولة.', 'Connection failed. Your form is retained; retry to confirm saving.'],
    SERVER_ERROR: ['تعذر إتمام العملية. حاول مجددًا.', 'The operation could not be completed. Please retry.'],
};
export class RequestError extends Error {
    constructor(public code: string, public status = 0) { super(code); }
}
export function errorMessage(error: unknown, language: Language) { const code = error instanceof RequestError ? error.code : 'SERVER_ERROR'; return (messages[code] || messages.SERVER_ERROR)[language === 'ar' ? 0 : 1]; }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
        const timeout = AbortSignal.timeout(20000);
        const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
        const response = await fetch(`/api${path}`, { ...options, credentials: 'same-origin', signal, headers: { ...(typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
        if (!response.headers.get('content-type')?.includes('application/json'))
            throw new RequestError('NOT_CONFIGURED', response.status);
        const result = await response.json();
        if (!response.ok)
            throw new RequestError(result.error || 'SERVER_ERROR', response.status);
        return result as T;
    }
    catch (error) {
        if (error instanceof RequestError)
            throw error;
        throw new RequestError('NETWORK_ERROR');
    }
}
