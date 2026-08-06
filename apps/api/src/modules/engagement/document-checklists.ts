export interface ChecklistItem {
  label: string;
  note?: string;
}

export interface DocumentChecklist {
  pathway: string;
  regulatoryBody: string;
  country: string;
  items: ChecklistItem[];
}

export const DOCUMENT_CHECKLISTS: Record<string, DocumentChecklist> = {
  UAE_DATAFLOW_NURSE: {
    pathway: 'UAE DataFlow Verification — Nurse',
    regulatoryBody: 'DataFlow Group / DHA / MOH / DOH',
    country: 'UAE',
    items: [
      { label: 'Valid international passport', note: 'Biographic/photo page — must not expire within 6 months' },
      { label: 'Current nursing licence / registration certificate', note: 'Issued by your home country licensing board — must be active' },
      { label: 'Nursing school diploma or degree certificate' },
      { label: 'Official nursing school transcripts', note: 'Must show all subjects and grades; some boards require direct institution-to-DataFlow delivery' },
      { label: 'Experience letter(s) from all employers', note: 'On official company letterhead, showing job title, start and end dates, signed by HR or supervisor — required for every place of work' },
      { label: 'Certificate of Good Standing', note: 'From your current nursing licensing board — issued within the last 3–6 months' },
      { label: 'Recent passport-size photograph', note: 'White background, taken within the last 6 months' },
    ],
  },

  UAE_DATAFLOW_PHYSICIAN: {
    pathway: 'UAE DataFlow Verification — Physician',
    regulatoryBody: 'DataFlow Group / DHA / MOH / DOH',
    country: 'UAE',
    items: [
      { label: 'Valid international passport', note: 'Biographic/photo page — must not expire within 6 months' },
      { label: 'Medical licence / registration certificate', note: 'From your home country medical council — must be active' },
      { label: 'Medical degree certificate', note: 'MBBS, MD, or equivalent — certified copy' },
      { label: 'Official medical school transcripts', note: 'Showing all subjects and grades' },
      { label: 'Internship completion certificate', note: 'If applicable — required for most regulatory bodies' },
      { label: 'Experience letter(s) from all employers', note: 'On official letterhead, with job title, start/end dates, and supervisor signature — for every employer' },
      { label: 'Certificate of Good Standing', note: 'From your medical licensing board — issued within the last 3–6 months' },
      { label: 'Recent passport-size photograph', note: 'White background, taken within the last 6 months' },
    ],
  },

  UAE_DHA: {
    pathway: 'UAE DHA Licence — Dubai Health Authority',
    regulatoryBody: 'Dubai Health Authority (DHA)',
    country: 'UAE',
    items: [
      { label: 'Valid international passport', note: 'Must not expire within 6 months' },
      { label: 'Current professional licence / registration', note: 'From home country licensing board — must be active' },
      { label: 'Professional qualification certificate', note: 'Degree or diploma in your healthcare discipline' },
      { label: 'Official academic transcripts' },
      { label: 'Experience letters (minimum 2 years post-qualification)', note: 'On official letterhead with job title, dates, and signature' },
      { label: 'Certificate of Good Standing', note: 'From home country licensing board — issued within 3 months' },
      { label: 'Passport-size photograph', note: 'White background, recent' },
      { label: 'DataFlow primary source verification report', note: 'If not already completed — we will initiate this on your behalf once documents are received' },
    ],
  },

  UAE_MOH_DOH: {
    pathway: 'UAE MOH / DOH Licence',
    regulatoryBody: 'Ministry of Health (MOH) / Department of Health Abu Dhabi (DOH)',
    country: 'UAE',
    items: [
      { label: 'Valid international passport', note: 'Must not expire within 6 months' },
      { label: 'Current professional licence / registration', note: 'From home country licensing board' },
      { label: 'Qualification certificate', note: 'Degree or diploma' },
      { label: 'Official academic transcripts' },
      { label: 'Experience letters (minimum 2 years)', note: 'On official letterhead with dates and signature' },
      { label: 'Certificate of Good Standing', note: 'Issued within 3 months' },
      { label: 'Passport-size photograph', note: 'White background' },
    ],
  },

  UK_NMC: {
    pathway: 'UK NMC Registration',
    regulatoryBody: 'Nursing and Midwifery Council (NMC)',
    country: 'United Kingdom',
    items: [
      { label: 'Valid passport or government-issued photo ID' },
      { label: 'Current nursing licence / registration from home country', note: 'Must be in good standing' },
      { label: 'Nursing diploma or degree certificate' },
      { label: 'Official nursing school transcripts' },
      { label: 'Certificate of Good Standing', note: 'From your home country licensing board — issued within 3 months' },
      { label: 'Good character reference', note: 'From a current or recent employer or professional colleague' },
      { label: 'English language proficiency certificate', note: 'IELTS Academic — 7.0 overall (no band below 6.5), OR OET — Grade B in all four components' },
      { label: 'Health declaration', note: 'Confirming your fitness to practise — we will provide the form' },
      { label: 'Criminal record / police clearance certificate', note: 'Equivalent to UK DBS — from every country you have lived in for 12+ months in the past 5 years' },
    ],
  },

  US_NCLEX_CGFNS: {
    pathway: 'US NCLEX-RN / CGFNS',
    regulatoryBody: 'CGFNS International / State Board of Nursing',
    country: 'United States',
    items: [
      { label: 'Valid passport' },
      { label: 'Current nursing licence from home country', note: 'Must be active and in good standing' },
      { label: 'Nursing school diploma or degree certificate' },
      { label: 'Official transcripts', note: 'Must be sent directly from your nursing school to CGFNS — do not open sealed transcripts' },
      { label: 'CGFNS application confirmation / fee payment receipt', note: 'We will guide you through the CGFNS online application process' },
      { label: 'English language proficiency certificate', note: 'TOEFL iBT 83+ overall OR IELTS Academic 6.5+ overall (check your State Board for specific requirements)' },
      { label: 'Two professional references', note: 'From nursing supervisors or educators — we will provide the reference forms' },
    ],
  },

  IRELAND_NMBI: {
    pathway: 'Ireland NMBI Registration',
    regulatoryBody: 'Nursing and Midwifery Board of Ireland (NMBI)',
    country: 'Ireland',
    items: [
      { label: 'Valid passport' },
      { label: 'Current nursing registration from home country', note: 'Must be active and in good standing' },
      { label: 'Nursing degree or diploma certificate' },
      { label: 'Official academic transcripts' },
      { label: 'Certificate of Good Standing', note: 'From home country licensing board — issued within 3 months' },
      { label: 'English language proficiency certificate', note: 'IELTS Academic 6.5 overall (no band below 6.0) OR OET Grade B' },
      { label: 'Two professional references', note: 'From nursing supervisors or managers — NMBI reference forms required' },
      { label: 'Police clearance certificate', note: 'From home country (and any country lived in for 6+ months in the past 5 years)' },
    ],
  },
};

export const CHECKLIST_OPTIONS = Object.entries(DOCUMENT_CHECKLISTS).map(([key, val]) => ({
  key,
  label: val.pathway,
  country: val.country,
}));
