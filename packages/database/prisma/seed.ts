import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding catalog...');

  // ── Engagement Fee (mandatory, hardcoded ID used by OrderService) ──────────
  const engagementFeeCategory = await prisma.serviceCategory.upsert({
    where: { id: 'cat-engagement' },
    update: {},
    create: {
      id: 'cat-engagement',
      name: 'Engagement Fee',
      isMandatory: true,
      sortOrder: 0,
    },
  });

  await prisma.serviceItem.upsert({
    where: { id: 'engagement-fee' },
    update: { priceUsd: 50 },
    create: {
      id: 'engagement-fee',
      categoryId: engagementFeeCategory.id,
      name: 'Engagement Fee',
      priceUsd: 50,
      description: 'Mandatory one-time engagement fee to activate your consulting relationship.',
      sortOrder: 0,
      isDefaultSelected: true,
      isAvailableStandalone: false,
    },
  });

  // ── UAE Licensure ──────────────────────────────────────────────────────────
  const uaeCat = await prisma.serviceCategory.upsert({
    where: { id: 'cat-uae' },
    update: {},
    create: {
      id: 'cat-uae',
      name: 'UAE Licensure',
      isMandatory: false,
      sortOrder: 1,
    },
  });

  const uaeItems = [
    // DHA/MOH DataFlow — profession variant
    {
      id: 'uae-dataflow-dha-moh',
      name: 'DHA / MOH DataFlow Verification (3 credentials)',
      priceUsd: 370, // nurse default
      description: 'DataFlow credential verification required for DHA and MOH licensing pathways.',
      sortOrder: 1,
      variantGroup: 'profession',
      isDefaultSelected: true,
      variants: [
        { variantKey: 'nurse', priceUsd: 370 },
        { variantKey: 'physician', priceUsd: 457 },
      ],
    },
    // DOH DataFlow — profession variant
    {
      id: 'uae-dataflow-doh',
      name: 'DOH DataFlow Verification (3 credentials)',
      priceUsd: 314,
      description: 'DataFlow credential verification for the DOH (Department of Health Abu Dhabi) pathway.',
      sortOrder: 2,
      variantGroup: 'profession',
      isDefaultSelected: false,
      variants: [
        { variantKey: 'nurse', priceUsd: 314 },
        { variantKey: 'physician', priceUsd: 372 },
      ],
    },
    {
      id: 'uae-fresh-grad-dha',
      name: 'Fresh Graduate DHA Eligibility Assessment',
      priceUsd: 72,
      description: 'DHA eligibility assessment for fresh graduates.',
      sortOrder: 3,
      isDefaultSelected: false,
    },
    {
      id: 'uae-dha-prometric',
      name: 'DHA Prometric Exam',
      priceUsd: 240,
      description: 'DHA licensing examination via Prometric.',
      sortOrder: 4,
      isDefaultSelected: false,
    },
    {
      id: 'uae-dha-eligibility-letter',
      name: 'DHA Eligibility Letter',
      priceUsd: 63,
      description: 'Processing of the DHA Eligibility Letter.',
      sortOrder: 5,
      isDefaultSelected: false,
    },
    {
      id: 'uae-moh-application',
      name: 'MOH Application Fee',
      priceUsd: 100,
      description: 'Ministry of Health application processing fee.',
      sortOrder: 6,
      isDefaultSelected: false,
    },
    {
      id: 'uae-moh-att-prometric',
      name: 'MOH ATT & Prometric Exam',
      priceUsd: 244,
      description: 'MOH Authorization to Test (ATT) and Prometric exam.',
      sortOrder: 7,
      isDefaultSelected: false,
    },
    {
      id: 'uae-moh-eval-cert',
      name: 'MOH Evaluation Certificate',
      priceUsd: 57,
      description: 'MOH Evaluation Certificate processing.',
      sortOrder: 8,
      isDefaultSelected: false,
    },
    {
      id: 'uae-doh-exam-att',
      name: 'DOH Exam Approval & ATT',
      priceUsd: 46,
      description: 'DOH exam approval and Authorization to Test.',
      sortOrder: 9,
      isDefaultSelected: false,
    },
    {
      id: 'uae-doh-personvue-rn',
      name: 'DOH Person Vue Exam (RN)',
      priceUsd: 147,
      description: 'DOH licensing exam via Person Vue for Registered Nurses.',
      sortOrder: 10,
      isDefaultSelected: false,
    },
    {
      id: 'uae-doh-personvue-an',
      name: 'DOH Person Vue Exam (AN)',
      priceUsd: 135,
      description: 'DOH licensing exam via Person Vue for Assistant Nurses.',
      sortOrder: 11,
      isDefaultSelected: false,
    },
    {
      id: 'uae-internship-cert-physician',
      name: 'Internship Certificate Verification (Physicians)',
      priceUsd: 90,
      description: 'Verification of internship certificate for physician applicants.',
      sortOrder: 12,
      isDefaultSelected: false,
    },
    {
      id: 'uae-additional-cert',
      name: 'Additional Certificate Verification',
      priceUsd: 90,
      description: 'Verification of an additional academic or professional certificate.',
      sortOrder: 13,
      isDefaultSelected: false,
    },
    {
      id: 'uae-nmc-ghana',
      name: 'NMC Ghana Verification Fee',
      priceUsd: 49,
      description: 'NMC Ghana nursing council verification fee.',
      sortOrder: 14,
      isDefaultSelected: false,
    },
    {
      id: 'uae-univ-buea',
      name: 'University of Buea Verification Fee',
      priceUsd: 46,
      description: 'University of Buea academic verification fee.',
      sortOrder: 15,
      isDefaultSelected: false,
    },
    {
      id: 'uae-processing-instate',
      name: 'Processing Fee (In-State Applicant)',
      priceUsd: 228,
      description: 'MJN processing and management fee for in-state UAE applicants.',
      sortOrder: 16,
      isDefaultSelected: false,
    },
    {
      id: 'uae-processing-intl-1',
      name: 'Processing Fee — International (1st Instalment)',
      priceUsd: 230,
      description: 'First instalment of the MJN processing fee for international applicants.',
      sortOrder: 17,
      isDefaultSelected: false,
    },
    {
      id: 'uae-processing-intl-2',
      name: 'Processing Fee — International (2nd Instalment)',
      priceUsd: 199,
      description: 'Second instalment of the MJN processing fee for international applicants.',
      sortOrder: 18,
      isDefaultSelected: false,
    },
  ];

  for (const item of uaeItems) {
    const { variants, ...data } = item as any;
    await prisma.serviceItem.upsert({
      where: { id: item.id },
      update: { priceUsd: item.priceUsd },
      create: {
        ...data,
        categoryId: uaeCat.id,
        isAvailableStandalone: false,
        variants: variants ? { create: variants } : undefined,
      },
    });
  }

  // ── NCLEX ─────────────────────────────────────────────────────────────────
  const nclexCat = await prisma.serviceCategory.upsert({
    where: { id: 'cat-nclex' },
    update: {},
    create: {
      id: 'cat-nclex',
      name: 'NCLEX',
      isMandatory: false,
      sortOrder: 2,
    },
  });

  const nclexItems = [
    { id: 'nclex-eres', name: 'ERES Credential Evaluation', priceUsd: 480, sortOrder: 1, isDefaultSelected: true, description: 'Educational Records Evaluation Service (ERES) credential evaluation for NCLEX.' },
    { id: 'nclex-eres-rush', name: 'ERES Rush Evaluation (add-on)', priceUsd: 180, sortOrder: 2, isDefaultSelected: false, description: 'Rush processing add-on for ERES evaluation.' },
    { id: 'nclex-jsa', name: 'JSA Credential Evaluation', priceUsd: 400, sortOrder: 3, isDefaultSelected: false, description: 'Joseph Silny & Associates (JSA) credential evaluation.' },
    { id: 'nclex-jsa-rush', name: 'JSA Rush Evaluation (add-on)', priceUsd: 100, sortOrder: 4, isDefaultSelected: false, description: 'Rush processing add-on for JSA evaluation.' },
    { id: 'nclex-cgfns', name: 'CGFNS Credential Evaluation', priceUsd: 485, sortOrder: 5, isDefaultSelected: false, description: 'CGFNS Commission on Graduates of Foreign Nursing Schools evaluation.' },
    { id: 'nclex-cgfns-expedite', name: 'CGFNS Expedite Service (add-on)', priceUsd: 425, sortOrder: 6, isDefaultSelected: false, description: 'Expedited processing add-on for CGFNS evaluation.' },
    { id: 'nclex-bon-account', name: 'Board of Nursing Account Creation', priceUsd: 175, sortOrder: 7, isDefaultSelected: true, description: 'MJN assistance creating your State Board of Nursing account.' },
    { id: 'nclex-pearsonvue', name: 'Pearson Vue Account Creation', priceUsd: 215, sortOrder: 8, isDefaultSelected: true, description: 'MJN assistance creating your Pearson Vue NCLEX testing account.' },
    { id: 'nclex-background-check', name: 'Criminal Background Check', priceUsd: 185, sortOrder: 9, isDefaultSelected: true, description: 'Required criminal background check for NCLEX application.' },
    { id: 'nclex-exam-booking', name: 'NCLEX Exam Booking', priceUsd: 175, sortOrder: 10, isDefaultSelected: true, description: 'MJN assistance booking your NCLEX examination date.' },
    { id: 'nclex-processing-1', name: 'Processing Fee — 1st Instalment', priceUsd: 355, sortOrder: 11, isDefaultSelected: true, description: 'First instalment of MJN case management and processing fee for NCLEX.' },
    { id: 'nclex-processing-2', name: 'Processing Fee — 2nd Instalment', priceUsd: 290, sortOrder: 12, isDefaultSelected: false, description: 'Second instalment of MJN processing fee, invoiced after evaluation is complete.' },
  ];

  for (const item of nclexItems) {
    await prisma.serviceItem.upsert({
      where: { id: item.id },
      update: { priceUsd: item.priceUsd },
      create: {
        ...item,
        categoryId: nclexCat.id,
        isAvailableStandalone: false,
      },
    });
  }

  // ── Student Support ────────────────────────────────────────────────────────
  const studentCat = await prisma.serviceCategory.upsert({
    where: { id: 'cat-student' },
    update: {},
    create: {
      id: 'cat-student',
      name: 'Student Support',
      isMandatory: false,
      sortOrder: 3,
    },
  });

  const studentItems = [
    { id: 'student-wes-1', name: 'WES Evaluation (1 academic credential)', priceUsd: 301, sortOrder: 1, isDefaultSelected: true, description: 'World Education Services (WES) evaluation for one academic credential.' },
    { id: 'student-wes-additional', name: 'WES Additional Credential Evaluation', priceUsd: 50, sortOrder: 2, isDefaultSelected: false, description: 'WES evaluation for each additional credential beyond the first.' },
    { id: 'student-uni-app-1', name: 'University Application Fee (1 university)', priceUsd: 100, sortOrder: 3, isDefaultSelected: true, description: 'MJN-managed university application for one institution.' },
    { id: 'student-uni-app-2', name: 'University Application Fee (2 universities)', priceUsd: 200, sortOrder: 4, isDefaultSelected: false, description: 'MJN-managed applications for two institutions.' },
    { id: 'student-processing-1', name: 'Processing Fee — 1st Instalment', priceUsd: 350, sortOrder: 5, isDefaultSelected: true, description: 'First instalment of MJN case management fee for student support.' },
    { id: 'student-processing-2', name: 'Processing Fee — 2nd Instalment', priceUsd: 250, sortOrder: 6, isDefaultSelected: false, description: 'Second instalment of MJN processing fee, invoiced after application submission.' },
  ];

  for (const item of studentItems) {
    await prisma.serviceItem.upsert({
      where: { id: item.id },
      update: { priceUsd: item.priceUsd },
      create: {
        ...item,
        categoryId: studentCat.id,
        isAvailableStandalone: false,
      },
    });
  }

  // ── UK / Ireland / Staffing (TBD — placeholder) ────────────────────────────
  const ukCat = await prisma.serviceCategory.upsert({
    where: { id: 'cat-uk' },
    update: {},
    create: {
      id: 'cat-uk',
      name: 'UK / Ireland Licensure',
      isMandatory: false,
      sortOrder: 4,
    },
  });
  await prisma.serviceItem.upsert({
    where: { id: 'uk-consultation' },
    update: {},
    create: {
      id: 'uk-consultation',
      categoryId: ukCat.id,
      name: 'UK / Ireland Pathway — Pricing on Consultation',
      priceUsd: 0,
      description: 'UK (NMC) and Ireland (NMBI) pathway fees are assessed on a case-by-case basis. Book a consultation to receive your personalised quote.',
      sortOrder: 1,
      isDefaultSelected: false,
      isAvailableStandalone: false,
    },
  });

  console.log('Catalog seed complete.');

  // ── Licensing Pathways ────────────────────────────────────────────────────
  console.log('Seeding licensing pathways...');

  const pathways = [
    {
      id: 'pathway-uae-dha',
      country: 'UAE',
      regulatoryBody: 'DHA',
      profession: null,
      stages: [
        { id: 'stage-uae-dha-1', label: 'DataFlow Verification', order: 1, requiredDocs: ['Passport', 'Degree Certificate', 'Transcripts', 'License from Home Country'] },
        { id: 'stage-uae-dha-2', label: 'DHA Exam Registration', order: 2, requiredDocs: ['DataFlow Approval Letter', 'Passport Photo'] },
        { id: 'stage-uae-dha-3', label: 'Exam Preparation', order: 3, requiredDocs: [] },
        { id: 'stage-uae-dha-4', label: 'DHA Exam Sitting', order: 4, requiredDocs: ['Exam Permit'] },
        { id: 'stage-uae-dha-5', label: 'Authority Approval & License', order: 5, requiredDocs: ['Exam Result Letter', 'Good Standing Certificate'] },
        { id: 'stage-uae-dha-6', label: 'Visa Processing', order: 6, requiredDocs: ['DHA License', 'Offer Letter', 'Medical Fitness Certificate'] },
        { id: 'stage-uae-dha-7', label: 'Employer Onboarding', order: 7, requiredDocs: ['Emirates ID', 'Signed Employment Contract'] },
      ],
    },
    {
      id: 'pathway-uae-doh',
      country: 'UAE',
      regulatoryBody: 'DOH / HAAD',
      profession: null,
      stages: [
        { id: 'stage-uae-doh-1', label: 'DataFlow Verification', order: 1, requiredDocs: ['Passport', 'Degree Certificate', 'Transcripts', 'Home Country License'] },
        { id: 'stage-uae-doh-2', label: 'HAAD / DOH Exam Registration', order: 2, requiredDocs: ['DataFlow Approval', 'Passport Photo'] },
        { id: 'stage-uae-doh-3', label: 'Exam Preparation', order: 3, requiredDocs: [] },
        { id: 'stage-uae-doh-4', label: 'HAAD / DOH Exam Sitting', order: 4, requiredDocs: ['Exam Permit'] },
        { id: 'stage-uae-doh-5', label: 'Authority Approval & License', order: 5, requiredDocs: ['Exam Result', 'Good Standing Certificate'] },
        { id: 'stage-uae-doh-6', label: 'Visa & Residency', order: 6, requiredDocs: ['DOH License', 'Offer Letter', 'Medical Fitness'] },
        { id: 'stage-uae-doh-7', label: 'Employer Onboarding', order: 7, requiredDocs: ['Emirates ID', 'Signed Contract'] },
      ],
    },
    {
      id: 'pathway-uk-nmc',
      country: 'UK',
      regulatoryBody: 'NMC',
      profession: null,
      stages: [
        { id: 'stage-uk-nmc-1', label: 'English Language Test (IELTS / OET)', order: 1, requiredDocs: ['Passport', 'Proof of English Test Booking'] },
        { id: 'stage-uk-nmc-2', label: 'NMC Application Submission', order: 2, requiredDocs: ['IELTS/OET Result (above threshold)', 'Degree Certificate', 'Transcripts', 'Home Country License', 'Good Standing Certificate'] },
        { id: 'stage-uk-nmc-3', label: 'Credential Verification (NMC Review)', order: 3, requiredDocs: ['NMC Reference Number'] },
        { id: 'stage-uk-nmc-4', label: 'CBT Preparation', order: 4, requiredDocs: [] },
        { id: 'stage-uk-nmc-5', label: 'CBT Sitting (Computer-Based Test)', order: 5, requiredDocs: ['CBT Booking Confirmation'] },
        { id: 'stage-uk-nmc-6', label: 'OSCE Preparation', order: 6, requiredDocs: ['CBT Pass Certificate'] },
        { id: 'stage-uk-nmc-7', label: 'OSCE Sitting (Objective Structured Clinical Examination)', order: 7, requiredDocs: ['OSCE Booking Confirmation', 'Valid Passport'] },
        { id: 'stage-uk-nmc-8', label: 'NMC PIN Issued', order: 8, requiredDocs: ['OSCE Pass Letter'] },
        { id: 'stage-uk-nmc-9', label: 'Job Offer & Skilled Worker Visa', order: 9, requiredDocs: ['NMC PIN', 'Offer Letter from NHS/Employer', 'Certificate of Sponsorship'] },
      ],
    },
    {
      id: 'pathway-us-nclex',
      country: 'US',
      regulatoryBody: 'NCLEX / CGFNS',
      profession: null,
      stages: [
        { id: 'stage-us-1', label: 'CGFNS / ERES Credential Evaluation', order: 1, requiredDocs: ['Degree Certificate', 'Transcripts', 'Home Country License', 'Passport'] },
        { id: 'stage-us-2', label: 'State Board of Nursing Application', order: 2, requiredDocs: ['CGFNS/ERES Report', 'Application Fee Receipt'] },
        { id: 'stage-us-3', label: 'ATT (Authorization to Test) Issued', order: 3, requiredDocs: ['State Board Approval Letter'] },
        { id: 'stage-us-4', label: 'NCLEX Preparation', order: 4, requiredDocs: [] },
        { id: 'stage-us-5', label: 'NCLEX Sitting', order: 5, requiredDocs: ['ATT Letter', 'Valid ID'] },
        { id: 'stage-us-6', label: 'State License Issued', order: 6, requiredDocs: ['NCLEX Pass Result'] },
        { id: 'stage-us-7', label: 'Visa Processing (EB-3 / TN / H-1B)', order: 7, requiredDocs: ['State License', 'Job Offer Letter', 'Visa Application Forms'] },
      ],
    },
    {
      id: 'pathway-ireland-nmbi',
      country: 'Ireland',
      regulatoryBody: 'NMBI',
      profession: null,
      stages: [
        { id: 'stage-ie-1', label: 'English Language Test (IELTS / OET)', order: 1, requiredDocs: ['Passport', 'English Test Result'] },
        { id: 'stage-ie-2', label: 'NMBI Application Submission', order: 2, requiredDocs: ['Degree Certificate', 'Transcripts', 'Home Country License', 'Good Standing Certificate', 'IELTS/OET Result'] },
        { id: 'stage-ie-3', label: 'Credential Verification', order: 3, requiredDocs: ['NMBI Reference Number'] },
        { id: 'stage-ie-4', label: 'Competence Assessment (if required)', order: 4, requiredDocs: ['NMBI Assessment Notice'] },
        { id: 'stage-ie-5', label: 'Registration Decision', order: 5, requiredDocs: ['Competence Assessment Result or Waiver'] },
        { id: 'stage-ie-6', label: 'Critical Skills Employment Permit', order: 6, requiredDocs: ['NMBI Registration Certificate', 'Offer Letter', 'Employer EORI Number'] },
        { id: 'stage-ie-7', label: 'Employment Start', order: 7, requiredDocs: ['Employment Permit', 'IRP Registration'] },
      ],
    },
  ];

  for (const pathway of pathways) {
    await prisma.licensingPathway.upsert({
      where: { id: pathway.id },
      update: {},
      create: {
        id: pathway.id,
        country: pathway.country,
        regulatoryBody: pathway.regulatoryBody,
        profession: pathway.profession,
        stages: {
          create: pathway.stages.map((s) => ({
            id: s.id,
            label: s.label,
            order: s.order,
            requiredDocs: s.requiredDocs,
          })),
        },
      },
    });
    console.log(`  ✓ ${pathway.country} – ${pathway.regulatoryBody}`);
  }

  console.log('Pathway seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
