import { useEffect, useRef, useId } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
export function Dialog({ title, onClose, children }: {
    title: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const heading = useId();
    const { language } = useApp();
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const root = document.getElementById('root');
        if (root)
            root.inert = true;
        ref.current?.focus();
        const key = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeRef.current();
                return;
            }
            if (event.key !== 'Tab')
                return;
            const nodes = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || []).filter(n => n.getClientRects().length);
            const first = nodes[0], last = nodes.at(-1);
            if (!first) {
                event.preventDefault();
                return;
            }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
                event.preventDefault();
                last?.focus();
            }
            else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', key);
        return () => {
            document.body.style.overflow = overflow;
            if (root)
                root.inert = false;
            document.removeEventListener('keydown', key);
            previous?.focus();
        };
    }, []);
    return createPortal(<div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center" onMouseDown={e => {
            if (e.target === e.currentTarget)
                onClose();
        }}>
  <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={heading} tabIndex={-1} className="w-full max-w-3xl max-h-[90dvh] overflow-y-auto bg-white text-[#171717] rounded-2xl shadow-2xl">
   <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center gap-4 z-10"><h2 id={heading} className="text-xl font-bold">{title}</h2><button aria-label={language === 'ar' ? 'إغلاق' : 'Close'} onClick={onClose} className="p-3 rounded-full border"><X size={20}/></button></div>
   <div className="p-5 sm:p-8">{children}</div>
  </div>
 </div>, document.body);
}
