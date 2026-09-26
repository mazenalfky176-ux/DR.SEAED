import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { defaultSiteData } from '../data/initialData';
import { api, RequestError, errorMessage } from '../lib/api';
import type { Language, SiteData, ContentData, ContentSection, ServiceItem, CaseStudy, AppointmentRequest, Result } from '../types';
import { playChimeTone } from '../utils/phone';
function useAppState() {
    const [language, setLanguage] = useState<Language>(() => {
        try {
            return localStorage.getItem('clinic_language') === 'en' ? 'en' : 'ar';
        }
        catch {
            return 'ar';
        }
    });
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    const [activeView, changeView] = useState<'home' | 'admin'>('home');
    function setActiveView(view: 'home' | 'admin') {
        if (view !== activeView && document.querySelector('[data-dirty="true"]') && !confirm(language === 'ar' ? 'مغادرة المسودة غير المحفوظة؟' : 'Discard the unsaved draft?'))
            return false;
        changeView(view);
        return true;
    }
    const [site, setSite] = useState<SiteData>(defaultSiteData);
    const [version, setVersion] = useState(0);
    const [isInitialLoading, setInitialLoading] = useState(true);
    const [syncError, setSyncError] = useState('');
    const [isAdminAuthenticated, setAdminAuthenticated] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [isServerSyncing, setServerSyncing] = useState(false);
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
    const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
    const [isBioOpen, setIsBioOpen] = useState(false);
    const [prefilledTreatment, setPrefilledTreatment] = useState('');
    const [cursorText, setCursorText] = useState('');
    const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
    const [liveAppointment, setLiveAppointment] = useState<AppointmentRequest | null>(null);
    const seenAppointments = useRef<Set<string> | null>(null);
    const revision = useRef(0);
    const mutation = useRef(false);
    const requestNumber = useRef(0);
    const readAbort = useRef<AbortController | null>(null);
    const readFailures = useRef(0);
    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = direction;
        try {
            localStorage.setItem('clinic_language', language);
        }
        catch { }
    }, [language, direction]);
    useEffect(() => {
        // Remove obsolete local credentials and sessions from older versions.
        ['drelmaghlany_admin_auth_session', 'drelmaghlany_owner_code', 'drelmaghlany_admin_pass', 'drelmaghlany_supabase_config', 'dr_saeed_custom_photo'].forEach(key => {
            try {
                localStorage.removeItem(key);
            }
            catch { }
        });
        try {
            sessionStorage.removeItem('drelmaghlany_owner_unlocked');
            indexedDB.deleteDatabase('DoctorPhotoDB');
        }
        catch { }
    }, []);
    const refreshFromDatabase = useCallback(async () => {
        if (mutation.current)
            return;
        const number = ++requestNumber.current;
        readAbort.current?.abort();
        const controller = new AbortController();
        readAbort.current = controller;
        try {
            const result = await api<{
                data: SiteData;
                version: number;
            }>('/content', { signal: controller.signal });
            if (!mutation.current && number === requestNumber.current && result.version >= revision.current) {
                setSite(result.data);
                setVersion(result.version);
                revision.current = result.version;
                readFailures.current = 0;
                setSyncError('');
            }
        }
        catch (error) {
            if (number === requestNumber.current && !controller.signal.aborted) {
                readFailures.current++;
                setSyncError(errorMessage(error, language));
            }
        }
        finally {
            setInitialLoading(false);
        }
    }, [language]);
    useEffect(() => {
        let stopped = false;
        let timer: ReturnType<typeof setTimeout>;
        const run = async () => {
            if (!document.hidden)
                await refreshFromDatabase();
            if (!stopped)
                timer = setTimeout(run, Math.min(120000, 15000 * 2 ** Math.min(readFailures.current, 3)));
        };
        void run();
        const visible = () => {
            if (!document.hidden)
                void refreshFromDatabase();
        };
        document.addEventListener('visibilitychange', visible);
        return () => { stopped = true; clearTimeout(timer); readAbort.current?.abort(); document.removeEventListener('visibilitychange', visible); };
    }, [refreshFromDatabase]);
    const refreshAppointments = useCallback(async () => {
        try {
            const result = await api<{
                data: AppointmentRequest[];
            }>('/appointments');
            if (seenAppointments.current) {
                const fresh = result.data.find(a => !seenAppointments.current!.has(a.id));
                if (fresh) {
                    setLiveAppointment(fresh);
                    playChimeTone();
                }
            }
            seenAppointments.current = new Set(result.data.map(a => a.id));
            setAppointments(result.data);
        }
        catch (error) {
            if (error instanceof RequestError && error.status === 401) {
                setSessionExpired(true);
                setAppointments([]);
                setLiveAppointment(null);
                seenAppointments.current = null;
            }
        }
    }, []);
    useEffect(() => { void api('/session').then(() => setAdminAuthenticated(true)).catch(() => setAdminAuthenticated(false)); }, []);
    useEffect(() => {
        if (!isAdminAuthenticated)
            return;
        let stopped = false;
        let timer: ReturnType<typeof setTimeout>;
        const run = async () => {
            if (!document.hidden)
                await refreshAppointments();
            if (!stopped)
                timer = setTimeout(run, 15000);
        };
        void run();
        return () => { stopped = true; clearTimeout(timer); };
    }, [isAdminAuthenticated, refreshAppointments]);
    async function saveSection<K extends ContentSection>(section: K, value: ContentData[K], expectedVersion: number): Promise<Result> {
        if (mutation.current)
            return { success: false, error: language === 'ar' ? 'انتظر انتهاء الحفظ الحالي.' : 'Wait for the current save.' };
        mutation.current = true;
        requestNumber.current++;
        setServerSyncing(true);
        try {
            const saved = await api<{
                data: ContentData;
                version: number;
            }>('/content', { method: 'PATCH', body: JSON.stringify({ section, value, version: expectedVersion }) });
            setSite(previous => ({ ...saved.data, testimonials: previous.testimonials }));
            setVersion(saved.version);
            revision.current = saved.version;
            setSyncError('');
            return { success: true };
        }
        catch (error) {
            if (error instanceof RequestError && error.status === 401)
                setSessionExpired(true);
            return { success: false, error: errorMessage(error, language), code: error instanceof RequestError ? error.code : undefined };
        }
        finally {
            mutation.current = false;
            setServerSyncing(false);
        }
    }
    async function adminLogin(email: string, password: string) { await api('/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setAdminAuthenticated(true); setSessionExpired(false); }
    async function adminLogout() {
        if (document.querySelector('[data-dirty="true"]') && !confirm(language === 'ar' ? 'تسجيل الخروج وترك المسودة غير المحفوظة؟' : 'Sign out and discard the unsaved draft?'))
            return;
        await api('/logout', { method: 'POST' });
        setAdminAuthenticated(false);
        setAppointments([]);
        setLiveAppointment(null);
        seenAppointments.current = null;
    }
    function openBookingWithTreatment(serviceId: string) {
        if (!setActiveView('home'))
            return;
        const matched = site.services.find(s => [s.id, s.nameAr, s.nameEn].includes(serviceId));
        setPrefilledTreatment(matched?.id || 'consultation');
        setSelectedCase(null);
        setSelectedService(null);
        setIsBioOpen(false);
        requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })));
    }
    return { ...site, site, version, language, setLanguage, direction, activeView, setActiveView, isInitialLoading, syncError, isAdminAuthenticated, isAdminLoggedIn: isAdminAuthenticated, isServerSyncing, sessionExpired, setSessionExpired,
        selectedService, setSelectedService, selectedCase, setSelectedCase, isBioOpen, setIsBioOpen, prefilledTreatment, openBookingWithTreatment, cursorText, setCursorText,
        appointments, refreshAppointments, liveAppointment, dismissLiveNotification: () => setLiveAppointment(null), refreshFromDatabase, saveSection, adminLogin, adminLogout };
}
type AppState = ReturnType<typeof useAppState>;
const AppContext = createContext<AppState | null>(null);
export function AppProvider({ children }: {
    children: React.ReactNode;
}) { const state = useAppState(); return <AppContext.Provider value={state}>{children}</AppContext.Provider>; }
export function useApp() {
    const context = useContext(AppContext);
    if (!context)
        throw new Error('AppProvider missing');
    return context;
}
