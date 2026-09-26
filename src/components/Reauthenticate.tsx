import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Dialog } from './Dialog';
import { errorMessage } from '../lib/api';
export function Reauthenticate() {
    const app = useApp(), ar = app.language === 'ar';
    const [error, setError] = useState(''), [busy, setBusy] = useState(false);
    return <Dialog title={ar ? 'تجديد جلسة الإدارة' : 'Renew admin session'} onClose={() => app.setSessionExpired(false)}><p className="mb-4">{ar ? 'انتهت الجلسة. سجّل الدخول هنا لمتابعة مسودتك.' : 'Your session expired. Sign in here to continue your draft.'}</p><form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            setBusy(true);
            try {
                await app.adminLogin(String(data.get('email')), String(data.get('password')));
            }
            catch (err) {
                setError(errorMessage(err, app.language));
            }
            finally {
                setBusy(false);
            }
        }}><label className="block">{ar ? 'البريد الإلكتروني' : 'Email'}<input className="field" name="email" type="email" autoComplete="username" required/></label><label className="block">{ar ? 'كلمة المرور' : 'Password'}<input className="field" name="password" type="password" autoComplete="current-password" required/></label><button disabled={busy} className="px-6 py-3 bg-[#D71920] text-white rounded-lg">{ar ? 'تسجيل الدخول' : 'Sign in'}</button>{error && <p role="alert">{error}</p>}</form></Dialog>;
}
