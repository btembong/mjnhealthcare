export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  initials: string;
  location: string;
  flag: string;
  background: string;
  bio: string;
  expertise: string[];
  credibility: string;
  credentials: string[];
  languages: string[];
  linkedin?: string;
  photo: string | null;
}

export interface Advisor {
  name: string;
  role: string;
  affiliation: string;
  contributes: string;
}

export const members: TeamMember[] = [
  {
    slug: 'mbout-john-nyah',
    name: 'MBOUT John Nyah (MJN)',
    role: 'Founder & Chief Executive Officer',
    initials: 'MJN',
    location: 'Cameroon',
    flag: '🇨🇲',
    background: 'MBA-HCM · BSN · RN · Founder of MJN Health Academy and Professional Services',
    bio: 'MBOUT John Nyah (MJN) founded MJN Health Academy and Professional Services to bridge the gap between African healthcare professionals and international licensing opportunities. Holding an MBA in Healthcare Management alongside his BSN and RN credentials, he combines executive leadership with frontline clinical experience — building MJN from the ground up to ensure every client is guided by someone who has walked the same path and understands both the clinical and business dimensions of international healthcare careers.',
    expertise: ['NCLEX', 'Student Support', 'Strategic Leadership', 'International Licensing', 'US NCLEX Pathway', 'Organisational Development'],
    credibility: 'MBA-HCM, BSN, RN — founded MJN after personally navigating international nursing licensure, combining clinical expertise with healthcare management leadership.',
    credentials: ['MBA-HCM', 'BSN', 'RN'],
    languages: ['EN', 'FR'],
    photo: '/nyah-ceo.png',
  },
  {
    slug: 'arrey-manor-besongngem',
    name: 'Arrey Manor Besongngem',
    role: 'Healthcare Staffing — Program Coordinator',
    initials: 'AM',
    location: 'Cameroon',
    flag: '🇨🇲',
    background: 'BSN · RN · Healthcare Staffing Program Coordinator',
    bio: 'Arrey Manor coordinates the healthcare staffing programme at MJN, supporting the end-to-end placement pipeline from candidate preparation through to employer onboarding. He works closely with consultants and processing officers to ensure every placement runs smoothly and on schedule.',
    expertise: ['Healthcare Staffing', 'Gulf Countries Placement', 'UAE / DHA / DOH / MOH', 'Candidate Placement', 'Employer Onboarding', 'Pipeline Management'],
    credibility: 'Healthcare Staffing Program Coordinator overseeing MJN\'s international placement operations.',
    credentials: ['BSN', 'RN'],
    languages: ['EN', 'FR'],
    photo: '/arreymanor.webp',
  },
  {
    slug: 'louis-tita-manoji',
    name: 'Louis Tita Manoji',
    role: 'Education & Training — Program Coordinator',
    initials: 'LT',
    location: 'Nigeria',
    flag: '🇳🇬',
    background: 'BSN · RN · Education & Training Program Coordinator',
    bio: "Louis Tita coordinates MJN's education and training programmes, overseeing exam preparation courses, study plan delivery, and the Academy's live class schedule. He ensures candidates are well-supported through every stage of their exam prep journey — from enrolment through to sitting day.",
    expertise: ['NCLEX', 'Education & Training', 'Exam Prep Coordination', 'Study Programme Management', 'Academy Operations', 'Candidate Support'],
    credibility: 'Education & Training Program Coordinator overseeing MJN\'s Academy and exam preparation programmes.',
    credentials: ['BSN', 'RN'],
    languages: ['EN'],
    photo: '/louistita.webp',
  },
];

export interface ProcessingOfficer {
  slug: string;
  name: string;
  role: string;
  initials: string;
  location: string;
  flag: string;
  email: string;
  expertise: string[];
  languages: string[];
  photo: string | null;
}

export const processingOfficers: ProcessingOfficer[] = [
  {
    slug: 'elangwe-lois-makane',
    name: 'Elangwe Lois Makane',
    role: 'Processing Officer',
    initials: 'EL',
    location: 'Cameroon',
    flag: '🇨🇲',
    email: 'Lois.makene@mjnhealthcare.com',
    expertise: ['DataFlow Submissions', 'Document Processing', 'DHA / DOH Applications', 'Application Tracking'],
    languages: ['EN', 'FR'],
    photo: '/lois.jpeg',
  },
  {
    slug: 'claude-nji-atanga',
    name: 'Claude Nji Atanga',
    role: 'Processing Officer',
    initials: 'CN',
    location: 'Cameroon',
    flag: '🇨🇲',
    email: 'claude.nji@mjnhealthcare.com',
    expertise: ['NMC Applications', 'CGFNS Processing', 'Regulatory Submissions', 'Application Tracking'],
    languages: ['EN', 'FR'],
    photo: '/claude.jpeg',
  },
];

export const advisors: Advisor[] = [
  {
    name: 'Prof. Jean-Claude Assiga',
    role: 'Academic Advisor — Medical Education',
    affiliation: 'Faculty of Medicine and Biomedical Sciences, University of Yaoundé I',
    contributes: 'Validates clinical curriculum alignment and ensures MJN Academy content meets international medical education standards.',
  },
  {
    name: 'Nurse Charlotte Osei',
    role: 'Clinical Advisor — UAE Operations',
    affiliation: 'Senior Staff Nurse, Dubai Health Authority facility; DHA 2018',
    contributes: 'Provides real-time intelligence on DHA facility expectations, exam formats, and on-the-ground placement realities in Dubai.',
  },
  {
    name: 'Barrister Ngozi Adeyemi',
    role: 'Legal Advisor — UK & Irish Operations',
    affiliation: 'Healthcare & Immigration Law, London',
    contributes: 'Reviews engagement letters, advises on UK visa and immigration compliance, and provides legal oversight for Irish Critical Skills Permit processes.',
  },
];
