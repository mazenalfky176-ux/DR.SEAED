import type { ClinicContact } from '../src/types';
export function cairoDate(now = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    return ['year', 'month', 'day'].map(key => parts.find(p => p.type === key)!.value).join('-');
}
export function slots(schedule: ClinicContact['schedule']): string[] {
    const minutes = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3);
    const result: string[] = [];
    for (let n = minutes(schedule.open); n < minutes(schedule.close); n += schedule.slotMinutes)
        result.push(`${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`);
    return result;
}
export function validSlot(date: string, time: string, schedule: ClinicContact['schedule'], now = new Date()): boolean {
    const parsed = new Date(`${date}T12:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
        return false;
    if (date < cairoDate(now) || !schedule.days.includes(parsed.getUTCDay()) || !slots(schedule).includes(time))
        return false;
    if (date === cairoDate(now)) {
        const local = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
        if (time <= local)
            return false;
    }
    return true;
}
