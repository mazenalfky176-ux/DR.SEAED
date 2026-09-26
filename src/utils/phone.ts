/**
 * Formats an Egyptian or international phone number into a proper wa.me link
 * @param phone Raw phone number string (e.g. "01060253877" or "+20 106 025 3877")
 * @param message Optional pre-filled message
 */
export function formatWhatsAppUrl(phone: string, message?: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    if (!clean)
        return '';
    // If local Egyptian number starting with 01... (e.g. 01060253877), prefix with 2
    if (clean.startsWith('01')) {
        clean = '2' + clean; // becomes 201060253877
    }
    else if (clean.startsWith('1') && clean.length === 10) {
        clean = '20' + clean;
    }
    else if (!clean.startsWith('20') && clean.length === 11 && clean.startsWith('0')) {
        clean = '2' + clean;
    }
    const base = `https://wa.me/${clean}`;
    if (message) {
        return `${base}?text=${encodeURIComponent(message)}`;
    }
    return base;
}
/**
 * Clean phone for tel: link
 */
export function formatTelUrl(phone: string): string {
    const clean = phone.replace(/[^0-9+]/g, '');
    return `tel:${clean}`;
}
/**
 * Play an audible notification chime using Web Audio API (real-time alert)
 */
export function playChimeTone() {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass)
            return;
        const ctx = new AudioContextClass();
        // Two-tone pleasant notification chime
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12); // A5
        gain2.gain.setValueAtTime(0.25, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.55);
        osc2.onended = () => void ctx.close();
    }
    catch (e) {
        console.log('Audio chime not available or user interaction required', e);
    }
}
