import content from '../../shared/default-content.json';
import type { SiteData } from '../types';
export const defaultSiteData: SiteData = { ...content, testimonials: [] };
export const initialDoctorProfile = defaultSiteData.doctorProfile;
