import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api, errorMessage, RequestError } from '../lib/api';
import { defaultSiteData } from '../data/initialData';
import type { ContentSection, ContentData, ReviewRecord, AppointmentRequest, AppointmentStatus } from '../types';
const sections: Record<ContentSection, [
    string,
    string
]> = { doctorProfile: ['بيانات وصورة الطبيب', 'Doctor profile'], clinicContact: ['العيادة والتواصل والمواعيد', 'Clinic & opening hours'], websiteContent: ['نصوص الصفحة الرئيسية', 'Page copy'], services: ['الخدمات', 'Services'], caseStudies: ['الحالات', 'Case studies'], statistics: ['الإحصائيات', 'Statistics'], faqs: ['الأسئلة الشائعة', 'FAQs'], technology: ['التكنولوجيا', 'Technology'], journey: ['رحلة المريض', 'Patient journey'], featuredTreatments: ['العلاجات المميزة', 'Featured treatments'], legal: ['الخصوصية والشروط', 'Privacy & terms'] };
const labels: Record<string, string> = { name: 'الاسم', title: 'العنوان', degree: 'الدرجة العلمية', university: 'الجامعة', experience: 'الخبرة', certifications: 'الشهادات (كل شهادة في سطر)', specialization: 'التخصص', bio: 'نبذة الطبيب', photoUrl: 'رابط صورة الطبيب', number: 'الترتيب', shortDesc: 'الوصف المختصر', fullDesc: 'الوصف التفصيلي', duration: 'المدة', sessions: 'عدد الجلسات', candidate: 'الحالات المناسبة', benefits: 'المميزات', icon: 'رمز الأيقونة', id: 'المعرف', caseNumber: 'رقم الحالة', treatment: 'العلاج', beforeImage: 'الصورة قبل العلاج', afterImage: 'الصورة بعد العلاج', overview: 'وصف الحالة', doctorNotes: 'ملاحظات الطبيب', materials: 'الخامات', isPlaceholder: 'حالة توضيحية تجريبية', patientsCount: 'عدد المرضى', yearsExperience: 'سنوات الخبرة', casesCount: 'عدد الحالات', servicesCount: 'عدد الخدمات', question: 'السؤال', answer: 'الإجابة', address: 'العنوان', googleMapsUrl: 'رابط خرائط جوجل', phone: 'الهاتف', whatsapp: 'واتساب', email: 'البريد الإلكتروني', instagramUrl: 'إنستجرام', facebookUrl: 'فيسبوك', tiktokUrl: 'تيك توك', heroTitle: 'العنوان الرئيسي', heroSubtitle: 'وصف الصفحة الرئيسي', philosophyTitle: 'عنوان منهجنا', philosophyDesc: 'شرح منهجنا', desc: 'الوصف', feature: 'الميزة', tagline: 'الوصف المختصر', image: 'الصورة', serviceId: 'الخدمة المرتبطة', privacy: 'سياسة الخصوصية', terms: 'شروط الحجز', patientName: 'اسم المريض', review: 'التقييم', rating: 'عدد النجوم', isDemo: 'تقييم تجريبي' };
type Value = string | number | boolean | Value[] | {
    [key: string]: Value;
};
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white text-slate-900 p-3 text-sm';
function label(key: string, ar: boolean) {
    if (!ar)
        return key.replace(/([A-Z])/g, ' $1').trim();
    const lang = key.endsWith('En') ? ' — English' : key.endsWith('Ar') ? ' — العربية' : '';
    return (labels[key.replace(/(En|Ar)$/, '')] || labels[key] || key) + lang;
}
function blank(value: Value): Value {
    if (Array.isArray(value))
        return [];
    if (typeof value === 'object')
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === 'id' ? crypto.randomUUID() : k === 'isPlaceholder' ? true : k.toLowerCase().includes('image') || k === 'photoUrl' ? '/images/smile_natural_teeth_1788979614634.jpg' : blank(v)]));
    if (typeof value === 'number')
        return 1;
    if (typeof value === 'boolean')
        return false;
    return '';
}
function Fields({ value, onChange, name = '', path = 'field', upload }: {
    value: Value;
    onChange: (v: Value) => void;
    name?: string;
    path?: string;
    upload: (file: File) => Promise<string>;
}) {
    const { language, services } = useApp();
    const ar = language === 'ar';
    const [uploading, setUploading] = useState(false), [error, setError] = useState('');
    if (name === 'schedule' && typeof value === 'object' && !Array.isArray(value)) {
        const s = value as unknown as ContentData['clinicContact']['schedule'];
        return <fieldset className="p-4 border rounded-xl space-y-4"><legend>{ar ? 'مواعيد العمل بتوقيت القاهرة' : 'Opening hours — Cairo time'}</legend>
   <div className="flex flex-wrap gap-4">{(ar ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map((day, i) => <label key={day}><input type="checkbox" checked={s.days.includes(i)} onChange={e => onChange({ ...s, days: e.target.checked ? [...s.days, i].sort() : s.days.filter(n => n !== i) } as unknown as Value)}/> {day}</label>)}</div>
   <div className="grid sm:grid-cols-3 gap-3">{(['open', 'close'] as const).map(k => <label key={k}>{ar ? (k === 'open' ? 'من' : 'إلى') : k}<input className={inputClass} type="time" value={s[k]} onChange={e => onChange({ ...s, [k]: e.target.value } as unknown as Value)} required/></label>)}<label>{ar ? 'مدة الموعد بالدقائق' : 'Slot length (minutes)'}<input className={inputClass} type="number" min={15} max={180} value={s.slotMinutes} onChange={e => onChange({ ...s, slotMinutes: +e.target.value } as unknown as Value)} required/></label></div>
  </fieldset>;
    }
    if (Array.isArray(value))
        return <fieldset className="space-y-4"><legend className="font-bold">{name ? label(name, ar) : ''}</legend>{value.map((entry, i) => <div key={typeof entry === 'object' && !Array.isArray(entry) && entry.id ? String(entry.id) : i} className="border border-slate-300 rounded-xl p-4 space-y-3"><Fields value={entry} onChange={v => onChange(value.map((old, j) => j === i ? v : old))} name="" path={`${path}-${i}`} upload={upload}/><button type="button" className="text-red-700 underline p-2" onClick={() => onChange(value.filter((_, j) => j !== i))}>{ar ? 'إزالة من المسودة' : 'Remove from draft'}</button></div>)}<button type="button" className="border rounded-lg px-4 py-2" onClick={() => { const template = value[0] || (defaultSiteData[name as ContentSection] as unknown as Value[])?.[0] || ''; onChange([...value, blank(template)]); }}>{ar ? 'إضافة عنصر' : 'Add item'}</button></fieldset>;
    if (typeof value === 'object')
        return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{Object.entries(value).filter(([k]) => !['workingHoursEn', 'workingHoursAr', 'operatingDaysEn', 'operatingDaysAr', 'openTime', 'closeTime'].includes(k)).map(([key, entry]) => <div key={key} className={typeof entry === 'object' || /bio|Desc|certifications|legal|review|overview|Notes|privacy|terms/i.test(key) ? 'sm:col-span-2' : ''}><Fields name={key} path={`${path}-${key}`} value={entry} onChange={v => onChange({ ...value, [key]: v })} upload={upload}/></div>)}</div>;
    if (typeof value === 'boolean')
        return <label className="flex gap-3 items-center"><input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}/>{label(name, ar)}</label>;
    if (name === 'serviceId')
        return <label className="block">{label(name, ar)}<select className={inputClass} value={String(value)} onChange={e => onChange(e.target.value)}><option value="consultation">{ar ? 'استشارة عامة' : 'Consultation'}</option>{services.map(s => <option key={s.id} value={s.id}>{ar ? s.nameAr : s.nameEn}</option>)}</select></label>;
    const isImage = ['photoUrl', 'beforeImage', 'afterImage', 'image'].includes(name);
    return <div className="space-y-2"><label htmlFor={path} className="block font-medium text-sm">{label(name, ar)}</label>
  {typeof value === 'number' ? <input id={path} type="number" min={1} max={name === 'rating' ? 5 : 9999} className={inputClass} value={value} onChange={e => onChange(+e.target.value)}/> :
            <textarea id={path} dir={name.endsWith('En') || isImage || /Url|email|phone|whatsapp|id/.test(name) ? 'ltr' : undefined} className={inputClass} rows={/bio|Desc|certifications|review|overview|Notes|privacy|terms/i.test(name) ? 5 : 2} readOnly={name === 'id'} value={value} onChange={e => onChange(e.target.value)} maxLength={12000} required={/^(name|title)(Ar|En)$/.test(name)}/>}
  {isImage && <><label className="block text-sm">{ar ? 'رفع صورة (JPEG / PNG / WebP، حتى ٨ ميجابايت)' : 'Upload image (JPEG / PNG / WebP, up to 8 MB)'}<input className="block my-2" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file)
                    return;
                setUploading(true);
                setError('');
                try {
                    onChange(await upload(file));
                }
                catch (err) {
                    setError(errorMessage(err, language));
                }
                finally {
                    setUploading(false);
                    e.target.value = '';
                }
            }}/></label>{uploading && <p role="status">{ar ? 'جارٍ رفع الصورة…' : 'Uploading…'}</p>}{error && <p role="alert" className="text-red-700">{error}</p>}<img src={String(value)} alt={label(name, ar)} className="max-h-48 rounded-lg" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} onLoad={e => { e.currentTarget.style.visibility = 'visible'; }}/>{name === 'photoUrl' && <button type="button" className="underline" onClick={() => onChange('/doctor-original.jpg')}>{ar ? 'استخدام الصورة الأصلية المرفقة' : 'Use original supplied portrait'}</button>}</>}
 </div>;
}
function ContentEditor({ section }: {
    section: ContentSection;
}) {
    const app = useApp(), ar = app.language === 'ar';
    const [draft, setDraft] = useState<Value>(() => structuredClone(app.site[section]) as unknown as Value);
    const [baseVersion, setBaseVersion] = useState(app.version), [dirty, setDirty] = useState(false), [message, setMessage] = useState(''), [failed, setFailed] = useState(false);
    const uploads = useRef<string[]>([]);
    const [pendingUploads, setPendingUploads] = useState(0);
    const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        if (!dirty) {
            setDraft(structuredClone(app.site[section]) as unknown as Value);
            setBaseVersion(app.version);
        }
    }, [app.site, app.version, section, dirty]);
    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (dirty || pendingUploads) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty, pendingUploads]);
    useEffect(() => () => {
        for (const url of uploads.current)
            void api('/image', { method: 'DELETE', body: JSON.stringify({ url }) }).catch(() => { });
    }, []);
    const upload = async (file: File) => {
        if (file.size > 8 * 1024 * 1024)
            throw new RequestError('TOO_LARGE');
        setPendingUploads(n => n + 1);
        try {
            try { const bitmap = await createImageBitmap(file); if (!bitmap.width || !bitmap.height) throw new Error('Empty image'); bitmap.close(); }
            catch { throw new RequestError('INVALID_IMAGE'); }
            const result = await api<{
                url: string;
            }>('/image', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
            if (!mounted.current) {
                void api('/image', { method: 'DELETE', body: JSON.stringify({ url: result.url }) }).catch(() => { });
                throw new Error('Editor closed');
            }
            uploads.current.push(result.url);
            return result.url;
        }
        finally {
            setPendingUploads(n => n - 1);
        }
    };
    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pendingUploads)
            return;
        setMessage('');
        const result = await app.saveSection(section, draft as unknown as ContentData[typeof section], baseVersion);
        setFailed(!result.success);
        setMessage(result.success ? (ar ? 'تم الحفظ على الخادم.' : 'Saved to the server.') : result.error || '');
        if (result.success) {
            setDirty(false);
            const used = JSON.stringify(draft);
            uploads.current = uploads.current.filter(url => {
                if (!used.includes(url))
                    void api('/image', { method: 'DELETE', body: JSON.stringify({ url }) }).catch(() => { });
                return false;
            });
        }
    };
    return <form onSubmit={save} className="space-y-6" data-dirty={dirty || pendingUploads > 0}>
  <div className="flex flex-wrap justify-between items-center gap-3"><h2 className="text-xl font-bold">{sections[section][ar ? 0 : 1]}</h2><span>{dirty ? (ar ? 'مسودة غير منشورة' : 'Unpublished draft') : (ar ? 'مطابق للخادم' : 'Up to date')}</span></div>
  {dirty && app.version !== baseVersion && <p role="alert" className="p-3 bg-amber-100">{ar ? 'وصل تعديل أحدث. احتفظ بنسخة من مسودتك قبل إعادة التحميل.' : 'A newer version exists. Keep a copy of your draft before reloading.'}</p>}
  <fieldset disabled={app.isServerSyncing}><Fields name={section} value={draft} onChange={v => { setDraft(v); setDirty(true); setMessage(''); }} upload={upload}/></fieldset>
  <div className="sticky bottom-0 bg-white border-t p-4 flex flex-wrap gap-3 items-center">
   <button className="bg-[#D71920] text-white rounded-lg px-6 py-3 disabled:opacity-50" disabled={!dirty || app.isServerSyncing || pendingUploads > 0}>{app.isServerSyncing ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : (ar ? 'حفظ ونشر هذا القسم' : 'Save & publish section')}</button>
   <button type="button" disabled={app.isServerSyncing || pendingUploads > 0} className="border rounded-lg px-4 py-3" onClick={async () => {
            if (dirty && !confirm(ar ? 'استبدال المسودة بآخر نسخة محفوظة؟' : 'Replace this draft with the saved version?'))
                return;
            await app.refreshFromDatabase();
            setDirty(false);
            setMessage('');
        }}>{ar ? 'إعادة تحميل القسم' : 'Reload section'}</button>
   <button type="button" className="underline p-2" onClick={() => { const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${section}-draft.json`; a.click(); URL.revokeObjectURL(url); }}>{ar ? 'تنزيل نسخة المسودة' : 'Download draft'}</button>
  </div>{message && <p role={failed ? 'alert' : 'status'} className={failed ? 'text-red-700' : 'text-green-800'}>{message}</p>}
 </form>;
}
const statusLabels: Record<AppointmentStatus, [
    string,
    string
]> = { New: ['جديد', 'New'], Contacted: ['تم التواصل', 'Contacted'], Confirmed: ['مؤكد', 'Confirmed'], Completed: ['مكتمل', 'Completed'], Cancelled: ['ملغى', 'Cancelled'] };
function Appointments() {
    const app = useApp(), ar = app.language === 'ar';
    const [filter, setFilter] = useState('all'), [error, setError] = useState(''), [busy, setBusy] = useState('');
    async function change(a: AppointmentRequest, remove = false, status?: AppointmentStatus, notes?: string) {
        if (remove && !confirm(ar ? 'حذف طلب الحجز نهائيًا؟' : 'Permanently delete this booking request?'))
            return;
        setBusy(a.id);
        setError('');
        try {
            await api(`/appointments/${a.id}`, { method: remove ? 'DELETE' : 'PATCH', body: JSON.stringify({ version: a.version, ...(!remove ? { patch: { ...(status ? { status } : {}), ...(notes !== undefined ? { notes } : {}) } } : {}) }) });
            await app.refreshAppointments();
        }
        catch (e) {
            setError(errorMessage(e, app.language));
        }
        finally {
            setBusy('');
        }
    }
    return <div className="space-y-5"><h2 className="font-bold text-xl">{ar ? 'طلبات الحجز الخاصة' : 'Private booking requests'}</h2><p>{ar ? 'طلبات الموعد لا تصبح مؤكدة إلا بعد التواصل مع المريض.' : 'Requests are confirmed only after contacting the patient.'}</p><label>{ar ? 'تصفية الحالة' : 'Filter status'}<select className={inputClass} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">{ar ? 'الكل' : 'All'}</option>{Object.entries(statusLabels).map(([key, v]) => <option key={key} value={key}>{v[ar ? 0 : 1]}</option>)}</select></label>{error && <p role="alert">{error}</p>}
  {!app.appointments.filter(a => filter === 'all' || a.status === filter).length && <p>{ar ? 'لا توجد طلبات مطابقة.' : 'No matching requests.'}</p>}
  {app.appointments.filter(a => filter === 'all' || a.status === filter).map(a => <article key={a.id} className="border p-4 rounded-xl space-y-3"><h3 className="font-bold">{a.patientName}</h3><p dir="ltr">{a.phone} · {a.email}</p><p>{a.age} · {a.complaint}</p><p>{app.services.find(s => s.id === a.treatment)?.[ar ? 'nameAr' : 'nameEn'] || a.treatment} · {a.preferredDate} · {a.preferredTime}</p><p>{a.message}</p><label>{ar ? 'الحالة' : 'Status'}<select className={inputClass} disabled={busy === a.id} value={a.status} onChange={e => void change(a, false, e.target.value as AppointmentStatus)}>{Object.entries(statusLabels).map(([key, v]) => <option key={key} value={key}>{v[ar ? 0 : 1]}</option>)}</select></label><form key={`${a.id}-${a.version}`} onSubmit={e => { e.preventDefault(); void change(a, false, undefined, String(new FormData(e.currentTarget).get('notes') || '')); }}><label>{ar ? 'ملاحظات خاصة' : 'Private notes'}<textarea name="notes" className={inputClass} defaultValue={a.notes || ''} maxLength={4000}/></label><button disabled={busy === a.id} className="underline p-2">{ar ? 'حفظ الملاحظات' : 'Save notes'}</button></form><button disabled={busy === a.id} onClick={() => void change(a, true)} className="text-red-700 underline p-2">{ar ? 'حذف الطلب' : 'Delete request'}</button></article>)}
 </div>;
}
function Reviews() {
    const { language, refreshFromDatabase } = useApp(), ar = language === 'ar';
    const [rows, setRows] = useState<ReviewRecord[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState('');
    const load = async () => {
        try {
            setRows((await api<{
                data: ReviewRecord[];
            }>('/reviews')).data);
        }
        catch (e) {
            setError(errorMessage(e, language));
        }
    };
    useEffect(() => { void load(); }, []);
    async function save(row: ReviewRecord, remove = false) {
        if (remove && !confirm(ar ? 'حذف التقييم نهائيًا؟' : 'Permanently delete this review?'))
            return;
        setBusy(row.id);
        setError('');
        try {
            await api(`/reviews/${row.id}`, { method: remove ? 'DELETE' : 'PATCH', body: JSON.stringify(remove ? { version: row.version } : { data: row.data, status: row.status, version: row.version }) });
            setRows(old => remove ? old.filter(item => item.id !== row.id) : old.map(item => item.id === row.id ? { ...row, version: row.version + 1 } : item));
            await refreshFromDatabase();
        }
        catch (e) {
            setError(errorMessage(e, language));
        }
        finally {
            setBusy('');
        }
    }
    return <div className="space-y-5"><h2 className="text-xl font-bold">{ar ? 'مراجعة ونشر آراء المرضى' : 'Moderate patient reviews'}</h2><p>{ar ? 'التقييمات الجديدة لا تظهر للزوار قبل اعتمادها.' : 'New reviews are hidden until approved.'}</p>{error && <p role="alert">{error}</p>}{!rows.length && <p>{ar ? 'لا توجد تقييمات.' : 'No reviews yet.'}</p>}{rows.map((r, i) => <form key={r.id} className="border p-4 rounded-xl space-y-4" onSubmit={e => { e.preventDefault(); void save(r); }}><fieldset disabled={busy === r.id} className="space-y-4"><Fields value={r.data as unknown as Value} onChange={data => setRows(old => old.map((x, j) => j === i ? { ...x, data: data as unknown as ReviewRecord['data'] } : x))} upload={async () => { throw new Error('Unsupported'); }}/><label>{ar ? 'حالة النشر' : 'Publication status'}<select className={inputClass} value={r.status} onChange={e => setRows(old => old.map((x, j) => j === i ? { ...x, status: e.target.value as ReviewRecord['status'] } : x))}><option value="pending">{ar ? 'قيد المراجعة' : 'Pending'}</option><option value="approved">{ar ? 'منشور' : 'Approved'}</option></select></label><button disabled={busy === r.id} className="bg-[#D71920] text-white rounded-lg px-5 py-3">{ar ? 'حفظ التقييم' : 'Save review'}</button><button type="button" disabled={busy === r.id} className="underline text-red-700 p-3" onClick={() => void save(r, true)}>{ar ? 'حذف' : 'Delete'}</button></fieldset></form>)}</div>;
}
function Password() {
    const app = useApp(), ar = app.language === 'ar';
    const [error, setError] = useState(''), [busy, setBusy] = useState(false);
    return <form className="space-y-4 max-w-xl" onSubmit={async (e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget);
            if (v.get('password') !== v.get('confirm')) {
                setError(ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
                return;
            }
            setBusy(true);
            setError('');
            try {
                await api('/password', { method: 'POST', body: JSON.stringify({ email: v.get('email'), currentPassword: v.get('currentPassword'), password: v.get('password') }) });
                await app.adminLogout();
            }
            catch (err) {
                setError(errorMessage(err, app.language));
            }
            finally {
                setBusy(false);
            }
        }}><h2 className="text-xl font-bold">{ar ? 'تغيير كلمة المرور' : 'Change password'}</h2><p>{ar ? 'بعد التغيير تنتهي جلسات الإدارة، وتحتاج لتسجيل الدخول مجددًا.' : 'Changing your password ends all admin sessions. Sign in again afterwards.'}</p>{[['email', ar ? 'البريد الإلكتروني' : 'Email'], ['currentPassword', ar ? 'كلمة المرور الحالية' : 'Current password'], ['password', ar ? 'كلمة المرور الجديدة (١٢ حرفًا على الأقل)' : 'New password (at least 12 characters)'], ['confirm', ar ? 'تأكيد كلمة المرور' : 'Confirm password']].map(([key, text]) => <label className="block" key={key}>{text}<input className={inputClass} name={key} type={key === 'email' ? 'email' : 'password'} required minLength={key === 'password' ? 12 : undefined} autoComplete={key === 'currentPassword' ? 'current-password' : key === 'email' ? 'username' : 'new-password'}/></label>)}<button disabled={busy} className="bg-[#D71920] text-white px-6 py-3 rounded-lg">{ar ? 'تحديث كلمة المرور' : 'Update password'}</button>{error && <p role="alert">{error}</p>}</form>;
}
export function AdminDashboard() {
    const app = useApp(), ar = app.language === 'ar';
    const [tab, setTab] = useState<ContentSection | 'appointments' | 'reviews' | 'password'>('doctorProfile');
    const [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const switchTab = (next: typeof tab) => {
        if (document.querySelector('[data-dirty="true"]') && !confirm(ar ? 'لديك مسودة غير محفوظة. مغادرة القسم؟' : 'Leave this section and discard the unsaved draft?'))
            return;
        setTab(next);
    };
    if (!app.isAdminAuthenticated)
        return <main id="main-content" className="min-h-screen pt-32 px-5 bg-slate-50 text-slate-900"><form className="max-w-md mx-auto bg-white border rounded-2xl p-7 space-y-5" onSubmit={async (e) => {
                e.preventDefault();
                const v = new FormData(e.currentTarget);
                setBusy(true);
                setError('');
                try {
                    await app.adminLogin(String(v.get('email')), String(v.get('password')));
                }
                catch (err) {
                    setError(errorMessage(err, app.language));
                }
                finally {
                    setBusy(false);
                }
            }}><h1 className="text-2xl font-bold">{ar ? 'دخول إدارة العيادة' : 'Clinic administration'}</h1><label className="block">{ar ? 'البريد الإلكتروني' : 'Email'}<input className={inputClass} name="email" type="email" autoComplete="username" required/></label><label className="block">{ar ? 'كلمة المرور' : 'Password'}<input className={inputClass} name="password" type="password" autoComplete="current-password" required/></label><button disabled={busy} className="bg-[#D71920] text-white rounded-lg px-6 py-3">{busy ? (ar ? 'جارٍ الدخول…' : 'Signing in…') : (ar ? 'تسجيل الدخول' : 'Sign in')}</button>{error && <p role="alert" className="text-red-700">{error}</p>}{app.syncError && <p role="status">{app.syncError}</p>}</form></main>;
    return <main id="main-content" className="min-h-screen pt-28 pb-16 px-4 sm:px-8 bg-slate-50 text-slate-900"><div className="max-w-6xl mx-auto space-y-6"><header className="flex flex-wrap justify-between gap-4"><h1 className="text-2xl font-bold">{ar ? 'إدارة العيادة' : 'Clinic administration'}</h1><div className="flex gap-3"><button className="underline" onClick={() => { app.setActiveView('home'); }}>{ar ? 'معاينة الموقع' : 'View website'}</button><button className="underline" onClick={() => void app.adminLogout().catch(e => setError(errorMessage(e, app.language)))}>{ar ? 'تسجيل الخروج' : 'Sign out'}</button></div></header>
  {app.syncError && <p role="alert" className="p-4 bg-amber-100 rounded-lg">{app.syncError}</p>}{error && <p role="alert">{error}</p>}
  <nav aria-label={ar ? 'أقسام الإدارة' : 'Admin sections'} className="flex flex-wrap gap-2">{[...Object.entries(sections), ['appointments', ['طلبات الحجز', 'Bookings']], ['reviews', ['التقييمات', 'Reviews']], ['password', ['كلمة المرور', 'Password']]].map(([key, names]) => <button key={String(key)} type="button" aria-current={tab === key ? 'page' : undefined} className={`px-4 py-3 rounded-lg border ${tab === key ? 'bg-slate-900 text-white' : 'bg-white'}`} onClick={() => switchTab(key as typeof tab)}>{(names as string[])[ar ? 0 : 1]}</button>)}</nav>
  <section className="bg-white border rounded-2xl p-5 sm:p-8">{app.isInitialLoading ? <p>{ar ? 'جارٍ تحميل البيانات…' : 'Loading…'}</p> : tab === 'appointments' ? <Appointments /> : tab === 'reviews' ? <Reviews /> : tab === 'password' ? <Password /> : <ContentEditor key={tab} section={tab}/>}</section>
 </div></main>;
}
