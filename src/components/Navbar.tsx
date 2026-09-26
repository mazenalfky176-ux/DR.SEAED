import { Dialog } from './Dialog';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowUpRight, Shield, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
export const Navbar: React.FC = () => {
    const { language, setLanguage, direction, openBookingWithTreatment, activeView, setActiveView, doctorProfile, clinicContact } = useApp();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('hero');
    const isArabic = language === 'ar';
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 40);
            // Simple spy
            const sections = ['hero', 'about', 'services', 'cases', 'technology', 'reviews', 'contact'];
            for (const s of sections.reverse()) {
                const el = document.getElementById(s);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 200) {
                        setActiveSection(s);
                        break;
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const navLinks = [
        { id: 'hero', labelEn: 'Home', labelAr: 'الرئيسية' },
        { id: 'about', labelEn: 'About', labelAr: 'عن الدكتور' },
        { id: 'services', labelEn: 'Services', labelAr: 'الخدمات' },
        { id: 'cases', labelEn: 'Cases', labelAr: 'الحالات' },
        { id: 'technology', labelEn: 'Technology', labelAr: 'التكنولوجيا' },
        { id: 'reviews', labelEn: 'Reviews', labelAr: 'آراء المرضى' },
        { id: 'contact', labelEn: 'Contact', labelAr: 'تواصل معنا' },
    ];
    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        if (activeView !== 'home') {
            if (!setActiveView('home'))
                return;
            setTimeout(() => {
                const el = document.getElementById(id);
                el?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth' });
    };
    return (<>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${(isScrolled || activeView === 'admin')
            ? 'py-3.5 bg-[#0B0B0B]/85 backdrop-blur-md border-b border-[#171717]'
            : 'py-6 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-2">
          {/* Brand */}
          <button onClick={() => scrollToSection('hero')} className="flex items-center gap-3 text-left group focus:outline-none">
            <div className="hidden sm:flex w-9 h-9 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D71920] font-bold text-sm tracking-widest group-hover:border-[#D71920] transition-colors">
              SE
            </div>
            <div>
              <span className="block max-w-[120px] sm:max-w-none truncate text-xs md:text-base font-bold tracking-tight text-white group-hover:text-[#F5F4F0] transition-colors">
                {isArabic ? doctorProfile.nameAr : doctorProfile.nameEn}
              </span>
              <span className="block text-[10px] tracking-[0.2em] uppercase text-[#A8A8A8]">
                {isArabic ? 'طب وتجميل الأسنان' : 'Dental Care'}
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((item) => {
            const isActive = activeSection === item.id;
            return (<button key={item.id} onClick={() => scrollToSection(item.id)} className={`text-xs uppercase tracking-widest transition-all relative py-1 focus:outline-none ${isActive ? 'text-white font-semibold' : 'text-[#A8A8A8] hover:text-[#F5F4F0]'}`}>
                  {isArabic ? item.labelAr : item.labelEn}
                  {isActive && (<motion.div layoutId="activeNavIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D71920]" transition={{ type: 'spring', stiffness: 380, damping: 30 }}/>)}
                </button>);
        })}
          </nav>

          {/* Right Actions: Lang Switcher + Admin Shortcut + CTA */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-[#171717] rounded-full p-1 border border-[#262626]">
              <button onClick={() => setLanguage('ar')} className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors ${isArabic ? 'bg-[#D71920] text-white shadow-sm' : 'text-[#A8A8A8] hover:text-white'}`} title="العربية">
                AR
              </button>
              <button onClick={() => setLanguage('en')} className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors ${!isArabic ? 'bg-[#D71920] text-white shadow-sm' : 'text-[#A8A8A8] hover:text-white'}`} title="English">
                EN
              </button>
            </div>

            {/* Admin Portal Shortcut */}
            <button onClick={() => setActiveView(activeView === 'admin' ? 'home' : 'admin')} className={`p-2 rounded-full border transition-colors ${activeView === 'admin'
            ? 'bg-[#D71920] text-white border-[#D71920]'
            : 'bg-[#171717] text-[#A8A8A8] border-[#262626] hover:text-white hover:border-[#A8A8A8]'}`} title={activeView === 'admin' ? (isArabic ? 'العودة للموقع' : 'View Website') : (isArabic ? 'لوحة التحكم' : 'Admin Portal')}>
              <Shield className="w-3.5 h-3.5"/>
            </button>

            {/* CTA Button */}
            <button onClick={() => openBookingWithTreatment('General Consultation')} className="hidden sm:inline-flex items-center gap-2 bg-[#D71920] hover:bg-[#b5141a] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-transform active:scale-95 shadow-md shadow-red-950/40">
              <span>{isArabic ? 'احجز موعدك' : 'BOOK APPOINTMENT'}</span>
              <ArrowUpRight className={`w-3.5 h-3.5 ${direction === 'rtl' ? 'rotate-[-90deg]' : ''}`}/>
            </button>

            {/* Mobile Hamburger */}
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-full bg-[#171717] text-white border border-[#262626]" aria-label={isArabic ? 'فتح القائمة' : 'Open navigation menu'} aria-expanded={mobileMenuOpen}>
              <Menu className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </header>

    {mobileMenuOpen && <Dialog title={isArabic ? 'القائمة' : 'Navigation'} onClose={() => setMobileMenuOpen(false)}><nav className="flex flex-col gap-4">{navLinks.map(item => <button key={item.id} className="text-start text-xl py-2" onClick={() => scrollToSection(item.id)}>{isArabic ? item.labelAr : item.labelEn}</button>)}</nav><p dir="ltr" className="mt-5">{clinicContact.whatsapp}</p><button className="underline mt-4" onClick={() => { setMobileMenuOpen(false); setActiveView('admin'); }}>{isArabic ? 'دخول الإدارة' : 'Administration'}</button></Dialog>}
    </>);
};
