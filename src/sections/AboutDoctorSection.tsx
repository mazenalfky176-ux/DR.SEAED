import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Award, GraduationCap, Clock, CheckCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DoctorImage } from '../components/DoctorImage';
export const AboutDoctorSection: React.FC = () => {
    const { language, direction, doctorProfile, setIsBioOpen, setCursorText, setActiveView, } = useApp();
    const isArabic = language === 'ar';
    const certsRaw = isArabic ? doctorProfile.certificationsAr : doctorProfile.certificationsEn;
    const certsList = certsRaw
        ? certsRaw
            .split(/[\n،,]+/)
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
        : [];
    return (<section id="about" className="bg-[#FFFFFF] text-[#0B0B0B] py-28 md:py-36 border-b border-[#DDDAD4] relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-[#DDDAD4]">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-mono font-bold text-[#D71920]">{isArabic ? '٠٢ // عن الطبيب' : '02 // ABOUT DOCTOR'}</span>
              <div className="h-[1px] w-8 bg-[#DDDAD4]"/>
            </div>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#0B0B0B]">
              {isArabic ? 'تعرف على' : 'MEET'}<br />
              <span className="text-[#0B0B0B] font-light">
                {isArabic ? doctorProfile.nameAr : doctorProfile.nameEn}
              </span>
            </h2>
          </div>

          <p className="mt-4 md:mt-0 text-sm md:text-base text-[#737373] max-w-sm">
            {isArabic
            ? 'نهج شخصي واستثنائي لكل حالة يعتمد على أدق معايير طب وتجميل الأسنان الحديث.'
            : 'An architectural approach to smile design rooted in biological preservation and precision.'}
          </p>
        </div>

        {/* Magazine Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Doctor Photo (Framed in Luxury Editorial Format) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#0B0B0B] border border-[#DDDAD4] group" onMouseEnter={() => setCursorText(isArabic ? 'استعراض' : 'PORTRAIT')} onMouseLeave={() => setCursorText('')}>
              <DoctorImage src={doctorProfile.photoUrl} alt={language === 'ar' ? doctorProfile.nameAr : doctorProfile.nameEn} className="w-full h-auto object-cover"/>

              {/* Photo modification restricted strictly to doctor admin session */}
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-xs font-mono tracking-widest text-[#D71920] uppercase block">
                  {isArabic ? 'استشاري التجميل والترميم' : 'PRACTICE FOUNDER'}
                </span>
                <span className="text-xl font-bold block">
                  {isArabic ? doctorProfile.nameAr : doctorProfile.nameEn}
                </span>
                <span className="text-xs text-[#626262] block mt-0.5">
                  {isArabic ? doctorProfile.titleAr : doctorProfile.titleEn}
                </span>
              </div>
            </div>

            {/* Accent badge */}
            <div className="absolute -bottom-5 -right-5 bg-[#0B0B0B] text-white p-4 rounded-xl shadow-xl border border-white/10 hidden sm:block">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#D71920] block">
                {isArabic ? 'معايير العلاج' : 'STANDARDS'}
              </span>
              <span className="text-xs font-semibold">
                {isArabic ? 'رعاية سنية فائقة الدقة' : 'Bespoke Craftsmanship'}
              </span>
            </div>
          </div>

          {/* Right: Editorial Bio and Structured Placeholders */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-full bg-[#F5F4F0] border border-[#DDDAD4] text-xs font-mono text-[#0B0B0B]">
                {isArabic ? doctorProfile.titleAr : doctorProfile.titleEn}
              </div>

              <h3 className="text-3xl sm:text-4xl font-bold text-[#0B0B0B] tracking-tight">
                {isArabic ? doctorProfile.nameAr : doctorProfile.nameEn}
              </h3>

              <p className="text-base sm:text-lg text-[#525252] leading-relaxed font-normal">
                {isArabic ? doctorProfile.bioAr : doctorProfile.bioEn}
              </p>
            </div>

            {/* Credential Cards (Strictly using requested editable placeholders) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#DDDAD4] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#DDDAD4] flex items-center justify-center text-[#D71920] shrink-0">
                  <GraduationCap className="w-4 h-4"/>
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#626262] block">
                    {isArabic ? 'الدرجة العلمية' : 'DEGREE'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#0B0B0B] leading-tight block mt-0.5">
                    {isArabic ? doctorProfile.degreeAr : doctorProfile.degreeEn}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#DDDAD4] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#DDDAD4] flex items-center justify-center text-[#D71920] shrink-0">
                  <Award className="w-4 h-4"/>
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#626262] block">
                    {isArabic ? 'الجامعة' : 'UNIVERSITY'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#0B0B0B] leading-tight block mt-0.5">
                    {isArabic ? doctorProfile.universityAr : doctorProfile.universityEn}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#DDDAD4] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#DDDAD4] flex items-center justify-center text-[#D71920] shrink-0">
                  <Clock className="w-4 h-4"/>
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#626262] block">
                    {isArabic ? 'سنوات الخبرة' : 'YEARS OF EXPERIENCE'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#0B0B0B] leading-tight block mt-0.5">
                    {isArabic ? doctorProfile.experienceAr : doctorProfile.experienceEn}
                  </span>
                </div>
              </div>
            </div>

            {/* Specialized Certifications - Stacked List (متراكمين وكل شهادة في سطر منفصل) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#F5F4F0] border border-[#DDDAD4]">
              <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-[#DDDAD4]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#DDDAD4] flex items-center justify-center text-[#D71920] shrink-0 shadow-xs">
                    <ShieldCheck className="w-4.5 h-4.5"/>
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#626262] block">
                      {isArabic ? 'الشهادات والاعتمادات التخصصية' : 'ACCREDITATIONS & MASTERCLASSES'}
                    </span>
                    <span className="text-xs font-bold text-[#0B0B0B]">
                      {isArabic ? 'برامج متقدمة وماستر كلاس معتمد' : 'Advanced Clinical Masterclasses & Diplomas'}
                    </span>
                  </div>
                </div>
                {certsList.length > 0 && (<span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#D71920]/10 text-[#D71920]">
                    {certsList.length} {isArabic ? 'شهادات' : 'Certifications'}
                  </span>)}
              </div>

              {/* Stacked certifications - each in its own clean row */}
              <div className="flex flex-col gap-2">
                {certsList.map((cert, index) => (<div key={index} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-[#E2DFD8] text-xs sm:text-sm font-semibold text-[#0B0B0B] hover:border-[#D71920]/60 transition-colors shadow-xs">
                    <span className="w-6 h-6 rounded-lg bg-[#F5F4F0] border border-[#DDDAD4] text-[#D71920] flex items-center justify-center text-[11px] font-mono font-bold shrink-0">
                      0{index + 1}
                    </span>
                    <span className="leading-snug">{cert}</span>
                  </div>))}
              </div>
            </div>

            {/* Specialization Pill */}
            <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#DDDAD4] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#626262] block">
                  {isArabic ? 'التخصص الدقيق' : 'SPECIALIZATION'}
                </span>
                <span className="text-sm font-semibold text-[#0B0B0B]">
                  {isArabic ? doctorProfile.specializationAr : doctorProfile.specializationEn}
                </span>
              </div>
              <span className="text-xs text-[#D71920] font-mono font-medium">Verified Practice</span>
            </div>

            {/* READ MORE Button */}
            <div className="pt-2">
              <button onClick={() => setIsBioOpen(true)} className="group px-7 py-3.5 bg-[#0B0B0B] hover:bg-[#1f1f1f] text-white text-sm font-semibold rounded-full inline-flex items-center gap-2.5 transition-all shadow-md active:scale-95">
                <span>{isArabic ? 'اعرف أكثر عن الدكتور' : 'READ MORE ABOUT DR. SAEED'}</span>
                <ArrowUpRight className={`w-4 h-4 text-[#D71920] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${direction === 'rtl' ? 'rotate-[-90deg]' : ''}`}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>);
};
