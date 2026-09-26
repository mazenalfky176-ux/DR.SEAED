import { useApp } from '../context/AppContext';
export function LiveAppointmentToast() {
    const { isAdminAuthenticated, liveAppointment, language, setActiveView, dismissLiveNotification } = useApp();
    if (!isAdminAuthenticated || !liveAppointment)
        return null;
    const ar = language === 'ar';
    return <aside role="status" className="fixed bottom-4 inset-x-4 sm:left-auto sm:w-96 bg-slate-900 text-white border border-red-700 rounded-xl p-5 z-[70] space-y-3"><p>{ar ? 'وصل طلب حجز جديد' : 'New booking request'}</p><p>{liveAppointment.patientName} · {liveAppointment.preferredDate}</p><button className="underline p-2" onClick={() => { setActiveView('admin'); dismissLiveNotification(); }}>{ar ? 'عرض الإدارة' : 'View admin'}</button><button className="underline p-2" onClick={dismissLiveNotification}>{ar ? 'إغلاق' : 'Dismiss'}</button></aside>;
}
