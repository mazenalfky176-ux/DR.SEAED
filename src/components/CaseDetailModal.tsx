import { Dialog } from './Dialog';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, ArrowRight, Sparkles, Layers, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
export const CaseDetailModal: React.FC = () => {
    const { selectedCase, setSelectedCase, language, direction, openBookingWithTreatment } = useApp();
    const isArabic = language === 'ar';
    if (!selectedCase)
        return null;
    const handleBook = () => {
        const treatment = isArabic ? selectedCase.treatmentAr : selectedCase.treatmentEn;
        setSelectedCase(null);
        openBookingWithTreatment(treatment);
    };
    return <Dialog title={isArabic ? selectedCase.titleAr : selectedCase.titleEn} onClose={() => setSelectedCase(null)}>
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            {/* Side by Side Images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden border border-[#DDDAD4] bg-[#F5F4F0] relative">
                <img src={selectedCase.beforeImage} alt={isArabic ? 'قبل العلاج' : 'Before treatment'} loading="lazy" referrerPolicy="no-referrer" className="w-full h-48 sm:h-56 object-cover"/>
                <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-md text-[11px] font-mono text-white">
                  {isArabic ? 'قبل العلاج' : 'BEFORE'}
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-[#D71920] bg-[#F5F4F0] relative">
                <img src={selectedCase.afterImage} alt={isArabic ? 'بعد العلاج' : 'After treatment'} loading="lazy" referrerPolicy="no-referrer" className="w-full h-48 sm:h-56 object-cover"/>
                <div className="absolute top-3 right-3 bg-[#D71920] px-2.5 py-1 rounded-md text-[11px] font-mono text-white font-bold">
                  {isArabic ? 'النتيجة النهائية' : 'AFTER'}
                </div>
              </div>
            </div>

            {/* Overview */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#737373]">
                {isArabic ? 'وصف الحالة والخطة العلاجية' : 'CLINICAL OVERVIEW'}
              </h4>
              <p className="text-sm sm:text-base text-[#525252] leading-relaxed">
                {isArabic ? selectedCase.overviewAr : selectedCase.overviewEn}
              </p>
            </div>

            {/* Treatment Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#DDDAD4] space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#737373] uppercase">
                  <Layers className="w-3.5 h-3.5 text-[#D71920]"/>
                  <span>{isArabic ? 'الخامات المستخدمة' : 'MATERIALS'}</span>
                </div>
                <span className="text-sm font-semibold text-[#0B0B0B] block">
                  {isArabic ? selectedCase.materialsAr : selectedCase.materialsEn}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#DDDAD4] space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#737373] uppercase">
                  <Clock className="w-3.5 h-3.5 text-[#D71920]"/>
                  <span>{isArabic ? 'المدة الزمنية الإجمالية' : 'TREATMENT DURATION'}</span>
                </div>
                <span className="text-sm font-semibold text-[#0B0B0B] block">
                  {isArabic ? selectedCase.durationAr : selectedCase.durationEn}
                </span>
              </div>
            </div>

            {/* Doctor Notes Callout */}
            <div className="p-5 rounded-2xl bg-[#F5F4F0] border border-[#DDDAD4] space-y-1.5">
              <span className="text-xs font-bold text-[#0B0B0B] block">
                {isArabic ? 'رأي د. سعيد المغلاني السريري:' : "Doctor's Assessment:"}
              </span>
              <p className="text-xs sm:text-sm text-[#525252] italic leading-relaxed">
                "{isArabic ? selectedCase.doctorNotesAr : selectedCase.doctorNotesEn}"
              </p>
            </div>
          </div>

          <button className="bg-[#D71920] text-white rounded-full px-6 py-3" onClick={() => openBookingWithTreatment('consultation')}>{isArabic ? 'طلب استشارة' : 'Request a consultation'}</button></Dialog>;
};
