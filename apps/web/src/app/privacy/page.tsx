'use client';

import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Badge } from '@mjn/ui';

export default function PrivacyPage() {
  return (
    <>
      <MarketingNav />

      <section className="px-6 pt-28 pb-8">
        <div className="mx-auto max-w-3xl">
          <Badge variant="outline" className="mb-4">Legal</Badge>
          <h1 className="text-4xl font-extrabold text-foreground">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: 1 July 2026</p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl prose prose-sm prose-slate max-w-none">
          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">1. Who We Are</h2>
              <p>MJN Health Academy and Professional Services (&ldquo;MJN,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a healthcare career consulting agency registered in Cameroon. We provide international healthcare licensing support, exam preparation, staffing placement, and related professional services.</p>
              <p className="mt-2">Data controller contact: <a href="mailto:privacy@mjnhealthcare.com" className="text-primary hover:underline">privacy@mjnhealthcare.com</a></p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">2. What Data We Collect</h2>
              <p>We collect the following categories of personal data:</p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li><strong>Identity data:</strong> Name, date of birth, nationality, passport details</li>
                <li><strong>Contact data:</strong> Email address, phone number, WhatsApp number, postal address</li>
                <li><strong>Professional data:</strong> Nursing/medical degree, registration numbers, clinical experience, employer history</li>
                <li><strong>Document data:</strong> Copies of passports, degree certificates, transcripts, licences, and other credential documents uploaded to our platform</li>
                <li><strong>Financial data:</strong> Payment records (we do not store card details — these are held by our payment processors)</li>
                <li><strong>Usage data:</strong> How you use our website and portal, including IP address, browser type, pages visited</li>
                <li><strong>Communications data:</strong> Email, WhatsApp, and chat correspondence with our team</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">3. Why We Collect Your Data</h2>
              <p>We collect and use your data to:</p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li>Provide licensing, placement, and consulting services under your signed engagement</li>
                <li>Submit applications to regulatory bodies and employers on your behalf (where you have authorised us via Letter of Authorization)</li>
                <li>Process payments and issue receipts</li>
                <li>Communicate with you about your case status, document requirements, and service updates</li>
                <li>Deliver Academy content, study plans, and exam preparation</li>
                <li>Meet our legal and compliance obligations (Cameroon data protection law; UK and Irish GDPR obligations where applicable)</li>
                <li>Send marketing communications (where you have opted in — you can opt out at any time)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">4. Legal Basis for Processing</h2>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li><strong>Contract performance:</strong> Processing necessary to deliver your signed engagement</li>
                <li><strong>Legitimate interests:</strong> Fraud prevention, platform security, improving our services</li>
                <li><strong>Consent:</strong> Marketing communications, AI-assisted features (where applicable)</li>
                <li><strong>Legal obligation:</strong> Compliance with applicable law and regulatory body requirements</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">5. Who We Share Your Data With</h2>
              <p>We share personal data only when necessary:</p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li><strong>Regulatory bodies:</strong> DHA, MOH, DOH, NMC, NMBI, CGFNS, and other authorities — solely when you have signed a Letter of Authorization</li>
                <li><strong>Employers:</strong> Partner hospitals and clinics — only with your explicit consent for each introduction</li>
                <li><strong>Service providers:</strong> Cloudflare (file storage), Brevo (email), Africa&apos;s Talking (SMS), Twilio (WhatsApp), Neon (database), Dropbox Sign (e-signature), Tranzak/Paystack (payments), Daily.co (live classes), Anthropic (AI features)</li>
                <li><strong>Legal advisors:</strong> Where required for dispute resolution or compliance</li>
              </ul>
              <p className="mt-2">We do not sell your personal data to third parties.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">6. Cross-Border Data Transfers</h2>
              <p>Your data is processed and stored on servers located in the United States and European Union (Neon PostgreSQL, Cloudflare R2). Cross-border transfers are made under standard contractual clauses or equivalent safeguards. Given that your engagement involves submission to regulatory bodies in the UAE, UK, US, and Ireland, your credential data will necessarily be transferred to those jurisdictions as part of the service.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">7. Data Retention</h2>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li><strong>Active engagement data:</strong> Retained for the duration of the engagement plus 5 years (for legal and audit purposes)</li>
                <li><strong>Credential documents:</strong> Deleted on request after engagement closure, unless retention is required by law</li>
                <li><strong>Financial records:</strong> Retained for 7 years (tax and audit requirements)</li>
                <li><strong>Marketing data:</strong> Retained until you unsubscribe or request deletion</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">8. Your Rights</h2>
              <p>Depending on your jurisdiction, you have the right to:</p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data (subject to retention obligations)</li>
                <li>Object to processing based on legitimate interests</li>
                <li>Withdraw consent where processing is based on consent</li>
                <li>Data portability (receive your data in a portable format)</li>
                <li>Lodge a complaint with your local data protection authority</li>
              </ul>
              <p className="mt-2">To exercise any of these rights, email <a href="mailto:privacy@mjnhealthcare.com" className="text-primary hover:underline">privacy@mjnhealthcare.com</a>. We will respond within 30 days.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">9. Security</h2>
              <p>Credential documents are encrypted at rest and in transit (Cloudflare R2 encryption). Access to your data is role-based — only your assigned consultant and relevant operations staff can access your case. All document access is audit-logged. We conduct regular security reviews.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">10. Changes to This Policy</h2>
              <p>We may update this policy. Material changes will be notified by email or prominent notice on the platform. Continued use of our services after the effective date constitutes acceptance of the revised policy.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">11. Contact</h2>
              <p>Data protection enquiries: <a href="mailto:privacy@mjnhealthcare.com" className="text-primary hover:underline">privacy@mjnhealthcare.com</a></p>
              <p className="mt-1">General contact: <Link href="/contact" className="text-primary hover:underline">Contact page</Link></p>
            </div>

          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
