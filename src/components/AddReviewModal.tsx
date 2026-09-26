import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Dialog } from './Dialog';
import { api, errorMessage } from '../lib/api';
export function AddReviewModal({ isOpen, onClose }: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { language, services, syncError } = useApp(), ar = language === 'ar';
    const id = useRef(crypto.randomUUID());
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [sent, setSent] = useState(false);
    if (!isOpen)
        return null;
    return <Dialog title={ar ? 'شارك تجربتك' : 'Share your experience'} onClose={onClose}>{sent ? <p role="status">{ar ? 'تم استلام تقييمك. سيظهر بعد مراجعة العيادة.' : 'Your review was received and will appear after moderation.'}</p> : <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                if (busy)
                    return;
                const data = new FormData(e.currentTarget);
                setBusy(true);
                setError('');
                try {
                    await api('/reviews', { method: 'POST', body: JSON.stringify({ id: id.current, name: data.get('name'), treatment: data.get('treatment'), rating: Number(data.get('rating')), review: data.get('review'), website: data.get('website') || '' }) });
                    setSent(true);
                }
                catch (err) {
                    setError(errorMessage(err, language));
                }
                finally {
                    setBusy(false);
                }
            }}><fieldset disabled={busy} className="space-y-4"><label className="block">{ar ? 'الاسم' : 'Name'}<input name="name" className="field" required maxLength={200} autoComplete="name"/></label><label className="block">{ar ? 'الخدمة' : 'Treatment'}<select name="treatment" className="field" required><option value="consultation">{ar ? 'استشارة' : 'Consultation'}</option>{services.map(s => <option key={s.id} value={s.id}>{ar ? s.nameAr : s.nameEn}</option>)}</select></label><label className="block">{ar ? 'التقييم من ٥' : 'Rating out of 5'}<select name="rating" defaultValue="5" className="field">{[5, 4, 3, 2, 1].map(n => <option key={n}>{n}</option>)}</select></label><label className="block">{ar ? 'تجربتك' : 'Your experience'}<textarea name="review" className="field" required minLength={3} maxLength={2000} rows={4}/></label><label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label></fieldset><p className="text-sm">{ar ? 'سيظهر اسمك وتقييمك للعامة بعد المراجعة. تجنب كتابة تفاصيل طبية أو معلومات اتصال خاصة.' : 'Your name and review will be public after moderation. Please avoid private medical or contact details.'}</p>{(error || syncError) && <p role="alert" className="text-red-700">{error || syncError}</p>}<button disabled={busy || !!syncError} className="bg-[#D71920] text-white px-6 py-3 rounded-xl disabled:opacity-50">{busy ? (ar ? 'جارٍ الإرسال…' : 'Sending…') : (ar ? 'إرسال للمراجعة' : 'Submit for moderation')}</button></form>}</Dialog>;
}
