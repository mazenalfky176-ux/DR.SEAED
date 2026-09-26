import { z } from 'zod';
import type { ContentData, ClinicContact } from '../src/types';
const text = z.string().trim().max(12000);
const short = z.string().trim().max(200);
const required = short.min(1);
const fields = (names: string[]) => Object.fromEntries(names.map(name => [name, /^(id|nameAr|nameEn|titleAr|titleEn)$/.test(name) ? required : text]));
export const imageUrl = z.string().max(2048).refine(value => {
    if (/^\/(?!\/)[a-zA-Z0-9_./%-]+(?:\?[^\s]*)?$/.test(value)) return true;
    try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password; } catch { return false; }
}, 'Use an HTTPS image URL or a local asset path');
const webUrl = z.union([z.literal(''), z.string().url().startsWith('https://').max(2048)]);
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const scheduleSchema = z.object({ days: z.array(z.number().int().min(0).max(6)).max(7), open: time, close: time, slotMinutes: z.number().int().min(15).max(180) }).strict().refine(s => s.open < s.close, 'Closing time must follow opening time');
const service = z.object({ ...fields(['id', 'number', 'nameEn', 'nameAr', 'shortDescEn', 'shortDescAr', 'fullDescEn', 'fullDescAr', 'durationEn', 'durationAr', 'candidateEn', 'candidateAr', 'icon']), benefitsEn: z.array(text).max(30), benefitsAr: z.array(text).max(30), sessionsEn: text.optional(), sessionsAr: text.optional() }).strict();
const caseStudy = z.object({ ...fields(['id', 'caseNumber', 'titleEn', 'titleAr', 'treatmentEn', 'treatmentAr', 'overviewEn', 'overviewAr', 'doctorNotesEn', 'doctorNotesAr']), beforeImage: imageUrl, afterImage: imageUrl, durationEn: text.optional(), durationAr: text.optional(), materialsEn: text.optional(), materialsAr: text.optional(), isPlaceholder: z.boolean().optional() }).strict();
export const testimonialSchema = z.object({ id: required, ...fields(['patientNameEn', 'patientNameAr', 'treatmentEn', 'treatmentAr', 'reviewEn', 'reviewAr']), rating: z.number().int().min(1).max(5), isDemo: z.boolean().optional() }).strict();
export const sectionSchemas = {
    doctorProfile: z.object({ ...fields(['nameEn', 'nameAr', 'titleEn', 'titleAr', 'degreeEn', 'degreeAr', 'universityEn', 'universityAr', 'experienceEn', 'experienceAr', 'certificationsEn', 'certificationsAr', 'specializationEn', 'specializationAr', 'bioEn', 'bioAr']), photoUrl: imageUrl }).strict(),
    services: z.array(service).max(100), caseStudies: z.array(caseStudy).max(100),
    statistics: z.object(fields(['patientsCount', 'yearsExperience', 'casesCount', 'servicesCount'])).strict(),
    faqs: z.array(z.object(fields(['id', 'questionEn', 'questionAr', 'answerEn', 'answerAr'])).strict()).max(100),
    clinicContact: z.object({ ...fields(['addressEn', 'addressAr', 'workingHoursEn', 'workingHoursAr']), phone: z.string().regex(/^\+?[\d ()-]{8,25}$/), whatsapp: z.string().regex(/^\+?[\d ()-]{8,25}$/), email: z.union([z.literal(''), z.string().email().max(254)]), googleMapsUrl: webUrl.optional(), instagramUrl: webUrl, facebookUrl: webUrl, tiktokUrl: webUrl.optional(), operatingDaysEn: text.optional(), operatingDaysAr: text.optional(), openTime: text.optional(), closeTime: text.optional(), schedule: scheduleSchema }).strict(),
    websiteContent: z.object(fields(['heroTitleEn', 'heroTitleAr', 'heroSubtitleEn', 'heroSubtitleAr', 'philosophyTitleEn', 'philosophyTitleAr', 'philosophyDescEn', 'philosophyDescAr'])).strict(),
    technology: z.array(z.object(fields(['id', 'nameEn', 'nameAr', 'descEn', 'descAr', 'featureEn', 'featureAr', 'icon'])).strict()).max(30),
    journey: z.array(z.object(fields(['number', 'titleEn', 'titleAr', 'descEn', 'descAr', 'durationEn', 'durationAr'])).strict()).max(20),
    featuredTreatments: z.array(z.object({ ...fields(['id', 'titleEn', 'titleAr', 'taglineEn', 'taglineAr', 'serviceId']), image: imageUrl }).strict()).max(30),
    legal: z.object(fields(['privacyAr', 'privacyEn', 'termsAr', 'termsEn'])).strict(),
};
export const contentSchema = z.object(sectionSchemas).strict().superRefine((data, context) => {
    for (const key of ['services', 'caseStudies', 'faqs', 'technology', 'featuredTreatments'] as const) {
        const ids = data[key].map(item => (item as unknown as {
            id: string;
        }).id);
        if (new Set(ids).size !== ids.length)
            context.addIssue({ code: 'custom', path: [key], message: 'Identifiers must be unique' });
    }
});
export function validateContent(value: unknown): ContentData { return contentSchema.parse(value) as unknown as ContentData; }
export const appointmentInput = z.object({ id: z.string().uuid(), patientName: required, age: z.string().regex(/^\d{1,3}$/).refine(v => +v > 0 && +v <= 120), complaint: z.string().trim().min(1).max(2000), phone: z.string().regex(/^\+?[\d ()-]{8,25}$/), email: z.union([z.literal(''), z.string().email().max(254)]), treatment: required, preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), preferredTime: time, message: z.string().trim().max(2000), website: z.string().max(0) }).strict();
export const reviewInput = z.object({ id: z.string().uuid(), name: required, treatment: required, review: z.string().trim().min(3).max(2000), rating: z.number().int().min(1).max(5), website: z.string().max(0) }).strict();
export const statusSchema = z.enum(['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled']);
export { cairoDate, slots, validSlot } from './schedule';
