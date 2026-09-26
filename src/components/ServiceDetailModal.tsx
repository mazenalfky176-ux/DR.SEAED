import { Dialog } from './Dialog';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
export const ServiceDetailModal: React.FC = () => {
    const { selectedService, setSelectedService, language, direction, openBookingWithTreatment } = useApp();
    const isArabic = language === 'ar';
    if (!selectedService)
        return null;
    const handleBook = () => {
        const treatmentName = isArabic ? selectedService.nameAr : selectedService.nameEn;
        setSelectedService(null);
        openBookingWithTreatment(treatmentName);
    };
    return <Dialog title={isArabic ? selectedService.nameAr : selectedService.nameEn} onClose={() => setSelectedService(null)}>
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#737373] mb-2">
                {isArabic ? 'نظرة عامة على الإجراء' : 'CLINICAL OVERVIEW'}
              </h4>
              <p className="text-base text-[#525252] leading-relaxed">
                {isArabic ? selectedService.fullDescAr : selectedService.fullDescEn}
              </p>
            </div>

            {/* Key Benefits */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#737373] mb-3">
                {isArabic ? 'المزايا والنتائج المتوقعة' : 'KEY CLINICAL ADVANTAGES'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(isArabic ? selectedService.benefitsAr : selectedService.benefitsEn).map((benefit, i) => (<div key={i} className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#DDDAD4] flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#D71920] shrink-0 mt-0.5"/>
                    <span className="text-xs sm:text-sm font-medium text-[#0B0B0B]">{benefit}</span>
                  </div>))}
              </div>
            </div>

            {/* Treatment Timeline & Sessions */}
            <div className="p-4 rounded-xl bg-[#0B0B0B] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#D71920]"/>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A8A8A8] block">
                    {isArabic ? 'مدة العلاج المتوقعة' : 'ESTIMATED TIMELINE'}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {isArabic ? (selectedService.sessionsAr || selectedService.durationAr) : (selectedService.sessionsEn || selectedService.durationEn)}
                  </span>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-[#D71920] hidden sm:block"/>
            </div>
          </div>

          <button className="bg-[#D71920] text-white rounded-full px-6 py-3" onClick={() => openBookingWithTreatment(selectedService.id)}>{isArabic ? 'حجز هذا الإجراء' : 'Book this treatment'}</button></Dialog>;
};
