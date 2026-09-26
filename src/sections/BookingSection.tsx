import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, errorMessage } from '../lib/api';
import { formatWhatsAppUrl } from '../utils/phone';
import { cairoDate, slots, validSlot } from '../../shared/schedule';
import { Dialog } from '../components/Dialog';
export function BookingSection() {
    const app = useApp(), ar = app.language === 'ar';
    const empty = { patientName: '', age: '', complaint: '', phone: '', email: '', treatment: '', preferredDate: '', preferredTime: '', message: '', website: '' };
    const [form, setForm] = useState(empty), [busy, setBusy] = useState(false), [error, setError] = useState(''), [sent, setSent] = useState(false), [legalOpen, setLegalOpen] = useState(false);
    const requestId = useRef(crypto.randomUUID());
    useEffect(() => {
        if (app.prefilledTreatment)
            setForm(v => ({ ...v, treatment: app.prefilledTreatment }));
    }, [app.prefilledTreatment]);
    const timeSlots = slots(app.clinicContact.schedule).filter(time => !form.preferredDate || validSlot(form.preferredDate, time, app.clinicContact.schedule));
    useEffect(() => {
        if (form.preferredTime && !timeSlots.includes(form.preferredTime))
            setForm(v => ({ ...v, preferredTime: '' }));
    }, [timeSlots.join(','), form.preferredTime]);
    const title = app.services.find(s => s.id === form.treatment)?.[ar ? 'nameAr' : 'nameEn'] || (ar ? 'استشارة عامة' : 'General consultation');
    const message = ar ? `طلب موعد لدى ${app.doctorProfile.nameAr}\nالاسم: ${form.patientName}\nالهاتف: ${form.phone}\nالخدمة: ${title}\nالموعد المطلوب: ${form.preferredDate} ${form.preferredTime}\nرقم الطلب: ${requestId.current}` : `Appointment request with ${app.doctorProfile.nameEn}\nName: ${form.patientName}\nPhone: ${form.phone}\nTreatment: ${title}\nRequested slot: ${form.preferredDate} ${form.preferredTime}\nReference: ${requestId.current}`;
    const field = (key: keyof typeof form, label: string, type = 'text', required = true) => <label className="block space-y-2" htmlFor={`booking-${key}`}><span>{label}{required ? ' *' : ''}</span><input id={`booking-${key}`} type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={required} min={key === 'age' ? 1 : undefined} max={key === 'age' ? 120 : undefined} maxLength={key === 'phone' ? 25 : 254} autoComplete={key === 'patientName' ? 'name' : key === 'phone' ? 'tel' : key === 'email' ? 'email' : 'off'} className="field"/></label>;
    return <section id="booking" className="bg-[#F5F4F0] text-[#171717] py-20 px-6"><div className="max-w-4xl mx-auto"><h2 className="text-3xl sm:text-5xl font-bold mb-5">{ar ? 'اطلب موعدك' : 'Request an appointment'}</h2><p className="mb-8">{ar ? 'اختر الموعد المناسب بتوقيت القاهرة. سنتواصل معك لتأكيد التوفر.' : 'Choose your preferred slot in Cairo time. We will contact you to confirm availability.'}</p>
  {sent ? <div className="bg-white border rounded-2xl p-7 space-y-5" role="status"><h3 className="text-2xl font-bold">{ar ? 'تم تسجيل طلبك بنجاح' : 'Your request has been saved'}</h3><p>{ar ? 'الحجز في انتظار تأكيد العيادة. لم تُرسل رسالة واتساب تلقائيًا.' : 'Your appointment is awaiting clinic confirmation. No WhatsApp message was sent automatically.'}</p><p dir="ltr" className="break-all">{requestId.current}</p><a href={formatWhatsAppUrl(app.clinicContact.whatsapp, message)} target="_blank" rel="noopener noreferrer" className="inline-block bg-emerald-700 text-white rounded-xl px-6 py-3">{ar ? 'متابعة عبر واتساب' : 'Follow up on WhatsApp'}</a><button onClick={() => { setSent(false); setForm(empty); requestId.current = crypto.randomUUID(); }} className="block underline">{ar ? 'طلب جديد' : 'New request'}</button></div> :
            <form className="bg-white border rounded-2xl p-6 sm:p-8 space-y-5" onSubmit={async (e) => {
                    e.preventDefault();
                    if (busy)
                        return;
                    setBusy(true);
                    setError('');
                    try {
                        await api('/appointments', { method: 'POST', body: JSON.stringify({ ...form, id: requestId.current }) });
                        setSent(true);
                    }
                    catch (err) {
                        setError(errorMessage(err, app.language));
                    }
                    finally {
                        setBusy(false);
                    }
                }}>
   <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-5">
    {field('patientName', ar ? 'الاسم' : 'Name')}{field('age', ar ? 'العمر' : 'Age', 'number')}{field('phone', ar ? 'الهاتف' : 'Phone', 'tel')}{field('email', ar ? 'البريد الإلكتروني' : 'Email', 'email', false)}
    <label className="sm:col-span-2 space-y-2" htmlFor="booking-complaint"><span>{ar ? 'سبب الزيارة *' : 'Reason for visit *'}</span><textarea id="booking-complaint" className="field" value={form.complaint} onChange={e => setForm({ ...form, complaint: e.target.value })} maxLength={2000} required rows={3}/></label>
    <label htmlFor="booking-treatment">{ar ? 'الخدمة *' : 'Treatment *'}<select id="booking-treatment" className="field" required value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })}><option value="">{ar ? 'اختر الخدمة' : 'Choose treatment'}</option><option value="consultation">{ar ? 'استشارة عامة' : 'General consultation'}</option>{app.services.map(s => <option key={s.id} value={s.id}>{ar ? s.nameAr : s.nameEn}</option>)}</select></label>
    <label htmlFor="booking-date">{ar ? 'اليوم المفضل *' : 'Preferred day *'}<input id="booking-date" className="field" type="date" min={cairoDate()} required value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value, preferredTime: '' })}/></label>
    <label htmlFor="booking-time">{ar ? 'الوقت المفضل *' : 'Preferred time *'}<select id="booking-time" className="field" required value={form.preferredTime} onChange={e => setForm({ ...form, preferredTime: e.target.value })}><option value="">{ar ? 'اختر الموعد' : 'Choose a slot'}</option>{timeSlots.map(time => <option key={time} value={time}>{time}</option>)}</select>{form.preferredDate && !timeSlots.length && <span className="text-red-700">{ar ? 'لا توجد مواعيد في هذا اليوم. اختر يوم عمل آخر.' : 'No slots on this day. Choose another working day.'}</span>}</label>
    <label htmlFor="booking-message">{ar ? 'ملاحظات إضافية' : 'Additional notes'}<textarea id="booking-message" className="field" rows={2} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} maxLength={2000}/></label>
    <label className="hidden" aria-hidden="true">Website<input value={form.website} tabIndex={-1} autoComplete="off" onChange={e => setForm({ ...form, website: e.target.value })}/></label>
   </fieldset>
   <p className="text-sm">{ar ? 'تُرسل هذه البيانات إلى العيادة لإدارة طلبك والتواصل معك.' : 'These details are sent to the clinic to manage your request and contact you.'} {(app.legal.privacyAr || app.legal.privacyEn || app.legal.termsAr || app.legal.termsEn) && <button type="button" className="underline" onClick={() => setLegalOpen(true)}>{ar ? 'الخصوصية والشروط' : 'Privacy & terms'}</button>}</p>
   {error && <p role="alert" className="p-4 bg-red-50 text-red-800 rounded-lg">{error}</p>}
   <button disabled={busy || !!app.syncError} className="bg-[#D71920] text-white rounded-full px-7 py-4 disabled:opacity-50">{busy ? (ar ? 'جارٍ تسجيل الطلب…' : 'Submitting…') : (ar ? 'إرسال طلب الموعد' : 'Submit appointment request')}</button>
   {app.syncError && <p role="alert" className="text-red-800">{app.syncError} <a href={formatWhatsAppUrl(app.clinicContact.whatsapp)} target="_blank" rel="noreferrer" className="underline">{ar ? 'تواصل مع العيادة مباشرة' : 'Contact the clinic directly'}</a></p>}
  </form>}
  {legalOpen && <Dialog title={ar ? 'الخصوصية والشروط' : 'Privacy & terms'} onClose={() => setLegalOpen(false)}><p className="whitespace-pre-wrap">{ar ? app.legal.privacyAr : app.legal.privacyEn}</p><hr className="my-5"/><p className="whitespace-pre-wrap">{ar ? app.legal.termsAr : app.legal.termsEn}</p></Dialog>}
 </div></section>;
}
