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
    expertise: ['Strategic Leadership', 'International Licensing', 'US NCLEX Pathway', 'Organisational Development'],
    credibility: 'MBA-HCM, BSN, RN — founded MJN after personally navigating international nursing licensure, combining clinical expertise with healthcare management leadership.',
    credentials: ['MBA-HCM', 'BSN', 'RN'],
    languages: ['EN', 'FR'],
    photo: '/nyah-ceo.png',
  },
  {
    slug: 'arrey-manor-besongngem',
    name: 'Arrey Manor Besongngem',
    role: 'Licensing Officer — Cameroon & West Africa',
    initials: 'AM',
    location: 'Cameroon',
    flag: '🇨🇲',
    background: 'BSN · R.N · Licensing specialist for Cameroon and West African countries',
    bio: 'Arrey Manor leads licensing support for clients from Cameroon and across West Africa, guiding nurses and healthcare professionals through credential evaluation, regulatory body applications, and document submission. His deep familiarity with West African nursing education systems and licensing bodies ensures clients receive accurate, context-specific guidance from the very first step.',
    expertise: ['Credential Evaluation', 'West Africa Licensing', 'Document Preparation', 'Regulatory Body Applications'],
    credibility: 'Specialist in Cameroon and West African licensing pathways with hands-on regulatory experience.',
    credentials: ['BSN', 'R.N'],
    languages: ['EN', 'FR'],
    photo: '/arreymanor.webp',
  },
  {
    slug: 'louis-tita-manoji',
    name: 'Louis Tita Manoji',
    role: 'Licensing Officer — Nigeria & East Africa',
    initials: 'LT',
    location: 'Nigeria',
    flag: '🇳🇬',
    background: 'BSN · RN · Licensing specialist for Nigeria and East African countries',
    bio: "Louis Tita manages licensing engagements for clients from Nigeria and East Africa — one of the highest-volume regions in MJN's portfolio. He specialises in navigating country-specific credential verification requirements, NCLEX eligibility timelines, and EB-3 retrogression realities for Nigerian candidates pursuing the US pathway, as well as UAE and UK licensing routes for East African professionals.",
    expertise: ['Nigeria Licensing Pathways', 'East Africa Credential Verification', 'NCLEX Eligibility', 'UAE / UK Licensing'],
    credibility: 'Specialist in Nigeria and East Africa — highest-volume markets in MJN\'s licensing portfolio.',
    credentials: ['BSN', 'RN'],
    languages: ['EN'],
    photo: '/louistita.webp',
  },
  {
    slug: 'amina-ousseini',
    name: 'Amina Ousseini',
    role: 'Head of Student Support',
    initials: 'AO',
    location: 'Dublin, Ireland',
    flag: '🇮🇪',
    background: 'BSN (University of Ngaoundéré) · NMBI Registered Nurse · Postgraduate Diploma in Healthcare Management (UCD)',
    bio: "Amina completed her own nursing degree in Cameroon and navigated the NMBI registration and Critical Skills Employment Permit process herself in 2021. She is now based in Dublin, working at an Irish voluntary hospital while leading MJN's student support services. She has particular expertise in francophone West and Central African candidates pursuing the Ireland pathway.",
    expertise: ['NMBI Registration', 'Ireland Critical Skills Permit', 'Student Advisory', 'French-Language Support'],
    credibility: 'Completed NMBI + Ireland Critical Skills Permit personally in 2021. Based in Dublin — live experience of the Ireland pathway.',
    credentials: ['NMBI Registered', 'PG Dip UCD', 'BSN'],
    languages: ['EN', 'FR'],
    photo: null,
  },
  {
    slug: 'patrick-mbang',
    name: 'Patrick Mbang',
    role: 'Head of Staffing & Employer Relations',
    initials: 'PM',
    location: 'London, UK',
    flag: '🇬🇧',
    background: 'MBA (University of Bath) · Former NHS HR Director · 15 years international healthcare recruitment',
    bio: "Patrick brings an employer perspective that most recruitment agencies lack — he spent 8 years on the NHS trust side managing overseas nurse recruitment before joining MJN. He built the employer partner network from 12 to 80+ institutions and designed the placement compliance documentation package that reduced employer onboarding friction significantly.",
    expertise: ['NHS Employer Relations', 'Healthcare Recruitment', 'Employment Contracts', 'Partner Development'],
    credibility: '8 years inside NHS trusts as HR director. Built MJN\'s 80+ institution employer network from scratch.',
    credentials: ['MBA Bath', 'Former NHS HR', '15 yrs Recruitment'],
    languages: ['EN'],
    photo: null,
  },
  {
    slug: 'raissa-fombe',
    name: 'Dr. Raïssa Fombe',
    role: 'Head of Health Training',
    initials: 'RF',
    location: 'Douala, Cameroon',
    flag: '🇨🇲',
    background: 'MD (FMSB Yaoundé) · MPH (Tulane University) · WHO West Africa Fellow · 10 years health systems work',
    bio: "Raïssa leads MJN's Africa-based health training division, bringing a public health systems perspective to clinical workforce development. She has designed training programmes for Ministry of Health teams in Cameroon and Nigeria, and led WHO-funded IPC training during the 2022 outbreak response. She holds a Master of Public Health from Tulane University.",
    expertise: ['Health Systems Strengthening', 'Community Health Training', 'Public Health Emergency Preparedness', 'WHO Frameworks'],
    credibility: 'Led WHO-funded IPC training in 2022 outbreak response. MPH Tulane. 10 years Ministry of Health engagement.',
    credentials: ['MD', 'MPH Tulane', 'WHO Fellow'],
    languages: ['EN', 'FR'],
    photo: null,
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
