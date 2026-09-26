import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronLeft, ChevronRight, Quote, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AddReviewModal } from '../components/AddReviewModal';
export const TestimonialsSection: React.FC = () => {
    const { language, testimonials } = useApp();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
    const isArabic = language === 'ar';
    const nextReview = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };
    const prevReview = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };
    const current = testimonials[currentIndex] || testimonials[0];
    return (<section id="reviews" className="bg-[#FFFFFF] text-[#0B0B0B] py-28 md:py-36 border-b border-[#DDDAD4] relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-[#DDDAD4]">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-mono font-bold text-[#D71920]">{isArabic ? '٠٨ // تجارب المرضى' : '08 // PATIENT EXPERIENCES'}</span>
              <div className="h-[1px] w-8 bg-[#DDDAD4]"/>
            </div>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#0B0B0B]">
              {isArabic ? 'آراء' : 'WHAT OUR'}<br />
              <span className="text-[#0B0B0B] font-light">
                {isArabic ? 'مرضانا.' : 'PATIENTS SAY.'}
              </span>
            </h2>
          </div>

          <div className="mt-6 md:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Add Review Button */}
            <button type="button" onClick={() => setIsAddReviewOpen(true)} className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#D71920] hover:bg-[#b5141a] text-white text-xs font-bold uppercase tracking-wider shadow-xl shadow-red-950/20 active:scale-[0.98] transition-all group">
              <Star className="w-4 h-4 fill-white text-white group-hover:rotate-12 transition-transform"/>
              <span>{isArabic ? 'أضف تقييمك / اكتب رأيك في العيادة' : 'Leave a Patient Review'}</span>
              <Plus className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>

        {/* Testimonial Stage */}
        <div className="bg-[#F5F4F0] rounded-3xl p-8 sm:p-14 border border-[#DDDAD4] relative overflow-hidden">
          <div className="absolute top-6 right-8 text-[#DDDAD4] opacity-40">
            <Quote className="w-24 h-24"/>
          </div>

          {current ? <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="relative z-10 max-w-3xl space-y-6">
              {/* 5 Stars */}
              <div className="flex items-center gap-1 text-[#D71920]">
                {[...Array(Math.max(1, Math.min(5, Math.trunc(current.rating))))].map((_, i) => (<Star key={i} className="w-5 h-5 fill-current"/>))}
              </div>

              {/* Review Quote */}
              <p className="text-xl sm:text-2xl md:text-3xl font-light text-[#0B0B0B] leading-relaxed italic">
                "{isArabic ? current.reviewAr : current.reviewEn}"
              </p>

              {/* Patient Info */}
              <div className="pt-4 flex items-center justify-between border-t border-[#DDDAD4]">
                <div>
                  <h4 className="text-lg font-bold text-[#0B0B0B]">
                    {isArabic ? current.patientNameAr : current.patientNameEn}
                  </h4>
                  <span className="text-xs text-[#737373] font-medium">
                    {isArabic ? current.treatmentAr : current.treatmentEn}
                  </span>
                </div>

                {current.isDemo && (<span className="text-[10px] font-mono uppercase tracking-widest text-[#737373] bg-white px-2.5 py-1 rounded-full border border-[#DDDAD4]">
                    DEMO REVIEW
                  </span>)}
              </div>
            </motion.div>
          </AnimatePresence> : <p>{isArabic ? 'لا توجد تقييمات منشورة بعد. يسعدنا سماع تجربتك.' : 'No published reviews yet. We welcome your feedback.'}</p>}

          {/* Slider Controls */}
          <div className="mt-8 pt-6 flex items-center justify-between border-t border-[#DDDAD4]/80">
            <div className="text-xs font-mono text-[#737373]">
              {testimonials.length ? Math.min(currentIndex + 1, testimonials.length) : 0} / {testimonials.length}
            </div>

            <div className="flex items-center gap-2">
              <button disabled={testimonials.length < 2} onClick={prevReview} className="w-10 h-10 rounded-full bg-white border border-[#DDDAD4] hover:border-[#D71920] flex items-center justify-center text-[#0B0B0B] transition-colors" aria-label="Previous testimonial">
                <ChevronLeft className="w-4 h-4 rtl:rotate-180"/>
              </button>
              <button disabled={testimonials.length < 2} onClick={nextReview} className="w-10 h-10 rounded-full bg-white border border-[#DDDAD4] hover:border-[#D71920] flex items-center justify-center text-[#0B0B0B] transition-colors" aria-label="Next testimonial">
                <ChevronRight className="w-4 h-4 rtl:rotate-180"/>
              </button>
            </div>
          </div>
        </div>

        {/* Modal for adding patient review */}
        {isAddReviewOpen && <AddReviewModal isOpen onClose={() => setIsAddReviewOpen(false)}/>}
      </div>
    </section>);
};
