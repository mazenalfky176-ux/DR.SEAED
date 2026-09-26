import { Reauthenticate } from './components/Reauthenticate';
import { lazy, Suspense, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './sections/HeroSection';
import { MarqueeSection } from './sections/MarqueeSection';
import { PhilosophySection } from './sections/PhilosophySection';
import { AboutDoctorSection } from './sections/AboutDoctorSection';
import { ServicesSection } from './sections/ServicesSection';
import { FeaturedTreatmentsSection } from './sections/FeaturedTreatmentsSection';
import { BeforeAfterSection } from './sections/BeforeAfterSection';
import { StatisticsSection } from './sections/StatisticsSection';
import { TechnologySection } from './sections/TechnologySection';
import { PatientJourneySection } from './sections/PatientJourneySection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { FaqSection } from './sections/FaqSection';
import { BookingSection } from './sections/BookingSection';
import { ContactSection } from './sections/ContactSection';
import { Footer } from './components/Footer';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { CaseDetailModal } from './components/CaseDetailModal';
import { DoctorBioModal } from './components/DoctorBioModal';
import { LiveAppointmentToast } from './components/LiveAppointmentToast';
const Admin = lazy(() => import('./sections/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
function Layout() {
    const app = useApp(), ar = app.language === 'ar';
    useEffect(() => { document.title = `${ar ? app.doctorProfile.nameAr : app.doctorProfile.nameEn} | ${ar ? 'طب وتجميل الأسنان' : 'Dental care'}`; const desc = ar ? app.websiteContent.heroSubtitleAr : app.websiteContent.heroSubtitleEn; document.querySelector('meta[name="description"]')?.setAttribute('content', desc); document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title); document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc); document.querySelector('meta[property="og:image"]')?.setAttribute('content', new URL(app.doctorProfile.photoUrl, location.origin).href); }, [app.doctorProfile, app.websiteContent, ar]);
    return <MotionConfig reducedMotion="user"><div className="min-h-screen bg-[#0B0B0B] text-[#F5F4F0]"><a href="#main-content" className="skip-link">{ar ? 'تخطي إلى المحتوى' : 'Skip to content'}</a><Navbar /><LiveAppointmentToast />
  {app.activeView === 'admin' ? <Suspense fallback={<p className="pt-32 p-6" role="status">{ar ? 'جارٍ تحميل الإدارة…' : 'Loading administration…'}</p>}><Admin /></Suspense> : <main id="main-content"><HeroSection /><MarqueeSection /><PhilosophySection /><AboutDoctorSection /><ServicesSection /><FeaturedTreatmentsSection /><BeforeAfterSection /><StatisticsSection /><TechnologySection /><PatientJourneySection /><TestimonialsSection /><FaqSection /><BookingSection /><ContactSection /><Footer /></main>}
  {app.sessionExpired && app.isAdminAuthenticated && <Reauthenticate />}<ServiceDetailModal /><CaseDetailModal /><DoctorBioModal />
 </div></MotionConfig>;
}
export default function App() { return <AppProvider><Layout /></AppProvider>; }
