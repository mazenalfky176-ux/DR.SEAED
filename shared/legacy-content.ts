import defaults from './default-content.json';
import { validateContent } from './validation';
// Whitelist against the new schema: passwords, patient records and unknown keys are never imported.
export function normalizeLegacy(input: unknown) {
    const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    function merge(template: unknown, value: unknown): unknown {
        if (value === undefined || value === null)
            return structuredClone(template);
        if (Array.isArray(template))
            return Array.isArray(value) ? value.map(v => template.length ? merge(template[0], v) : v) : structuredClone(template);
        if (template && typeof template === 'object') {
            const old = typeof value === 'object' ? value as Record<string, unknown> : {};
            return Object.fromEntries(Object.entries(template).map(([key, def]) => [key, merge(def, old[key])]));
        }
        return value;
    }
    const merged = merge(defaults, source) as typeof defaults;
    // Old sessions and duration represented the same display field.
    const oldServices = source.services as Record<string, unknown>[] | undefined;
    if (Array.isArray(oldServices))
        merged.services = merged.services.map((s, i) => ({ ...s, durationAr: String(oldServices[i].durationAr ?? oldServices[i].sessionsAr ?? s.durationAr), durationEn: String(oldServices[i].durationEn ?? oldServices[i].sessionsEn ?? s.durationEn) }));
    return validateContent(merged);
}
