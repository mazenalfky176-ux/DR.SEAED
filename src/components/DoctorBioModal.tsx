import { DoctorImage } from './DoctorImage';
import { Dialog } from './Dialog';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award, GraduationCap, Clock, ShieldCheck, CheckCircle2, Phone, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTelUrl, formatWhatsAppUrl } from '../utils/phone';
import { initialDoctorProfile } from '../data/initialData';
export const DoctorBioModal: React.FC = () => {
    const { isBioOpen, setIsBioOpen, doctorProfile, clinicContact, language, openBookingWithTreatment } = useApp();
    const isArabic = language === 'ar';
    const doctorCVPhone = clinicContact.phone || clinicContact.whatsapp;
    const certsRaw = isArabic ? doctorProfile.certificationsAr : doctorProfile.certificationsEn;
    const certsList = certsRaw
        ? certsRaw
            .split(/[\n،,]+/)
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
        : [];
    if (!isBioOpen)
        return null;
    return <Dialog title={isArabic ? doctorProfile.nameAr : doctorProfile.nameEn} onClose={() => setIsBioOpen(false)}><DoctorImage src={doctorProfile.photoUrl} alt={isArabic ? doctorProfile.nameAr : doctorProfile.nameEn} className="w-32 h-36 object-cover rounded-xl mb-5"/>
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#737373] mb-2">
                {isArabic ? 'الرؤية والنهج المهني' : 'PRACTICE ETHOS & PHILOSOPHY'}
              </h4>
              <p className="text-base text-[#525252] leading-relaxed">
                {isArabic ? doctorProfile.bioAr : doctorProfile.bioEn}
              </p>
            </div>

            {/* Academic Credentials Placeholders */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#737373] mb-3">
                {isArabic ? 'المؤهلات والاعتمادات الرسمية' : 'ACCREDITATIONS & BACKGROUND'}
              </h4>
              <div className="space-y-2.5">
                <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#DDDAD4] flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-[#D71920] shrink-0"/>
                  <div>
                    <span className="text-xs text-[#737373] block">{isArabic ? 'الدرجة والجامعة' : 'Degree & University'}</span>
                    <span className="text-sm font-semibold text-[#0B0B0B]">
                      {isArabic ? `${doctorProfile.degreeAr} - ${doctorProfile.universityAr}` : `${doctorProfile.degreeEn} - ${doctorProfile.universityEn}`}
                    </span>
                  </div>
                </div>

                {/* Stacked Certifications (كل شهادة في سطر منفصل) */}
                <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#DDDAD4]">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DDDAD4]">
                    <div className="flex items-center gap-2.5">
                      <Award className="w-5 h-5 text-[#D71920] shrink-0"/>
                      <div>
                        <span className="text-xs text-[#737373] block">{isArabic ? 'الشهادات والاعتمادات المعتمدة' : 'Accreditations & Masterclasses'}</span>
                        <span className="text-xs font-bold text-[#0B0B0B]">
                          {isArabic ? 'برامج تخصصية معتمدة' : 'Accredited Clinical Diplomas'}
                        </span>
                      </div>
                    </div>
                    {certsList.length > 0 && (<span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#D71920]/10 text-[#D71920]">
                        {certsList.length} {isArabic ? 'شهادات' : 'Certs'}
                      </span>)}
                  </div>

                  <div className="flex flex-col gap-2">
                    {certsList.map((cert, idx) => (<div key={idx} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-[#E2DFD8] text-xs font-semibold text-[#0B0B0B]">
                        <span className="w-5 h-5 rounded-md bg-[#F5F4F0] border border-[#DDDAD4] text-[#D71920] flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{cert}</span>
                      </div>))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#DDDAD4] flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#D71920] shrink-0"/>
                  <div>
                    <span className="text-xs text-[#737373] block">{isArabic ? 'الخبرة السريرية' : 'Clinical Experience'}</span>
                    <span className="text-sm font-semibold text-[#0B0B0B]">
                      {isArabic ? doctorProfile.experienceAr : doctorProfile.experienceEn}
                    </span>
                  </div>
                </div>

                {/* Direct Doctor Phone from CV */}
                <div className="p-4 rounded-xl bg-[#0B0B0B] text-white flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-emerald-400 shrink-0"/>
                    <div>
                      <span className="text-[10px] font-mono text-[#A8A8A8] block uppercase tracking-wider">
                        {isArabic ? 'رقم هاتف الدكتور المباشر (CV)' : 'Direct Doctor Phone (CV)'}
                      </span>
                      <a href={formatTelUrl(doctorCVPhone)} className="text-sm font-mono font-bold text-emerald-400 hover:underline" dir="ltr">
                        {doctorCVPhone}
                      </a>
                    </div>
                  </div>
                  <a href={formatWhatsAppUrl(clinicContact.whatsapp, isArabic
            ? 'مرحباً د. سعيد المغلاني، اطلعت على سيرتك الذاتية في الموقع وأود الاستفسار وحجز موعد.'
            : 'Hello Dr. Saeed Elmaghlany, I viewed your CV and would like to book a consultation.')} target="_blank" rel="noreferrer" className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5"/>
                    <span>{isArabic ? 'واتساب' : 'WhatsApp'}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <button className="bg-[#D71920] text-white rounded-full px-6 py-3" onClick={() => openBookingWithTreatment('consultation')}>{isArabic ? 'حجز استشارة' : 'Book a consultation'}</button></Dialog>;
};
