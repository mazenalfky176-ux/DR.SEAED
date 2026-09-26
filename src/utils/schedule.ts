import type { ClinicContact, Language } from '../types';
export function formatSchedule(schedule: ClinicContact['schedule'], language: Language) {
    const names = language === 'ar' ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (!schedule.days.length)
        return language === 'ar' ? 'الحجز مغلق مؤقتًا' : 'Appointments temporarily closed';
    return `${schedule.days.map(day => names[day]).join(language === 'ar' ? '، ' : ', ')} · ${schedule.open}–${schedule.close} ${language === 'ar' ? '(بتوقيت القاهرة)' : '(Cairo time)'}`;
}
