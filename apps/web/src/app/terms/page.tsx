'use client';

import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Badge } from '@mjn/ui';

export default function TermsPage() {
  return (
    <>
      <MarketingNav />

      <section className="px-6 pt-28 pb-8">
        <div className="mx-auto max-w-3xl">
          <Badge variant="outline" className="mb-4">Legal</Badge>
          <h1 className="text-4xl font-extrabold text-foreground">Terms of Service</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: 1 July 2026</p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">1. Introduction</h2>
              <p>These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the MJN Health Academy and Professional Services website, platform, and consulting services. By accessing our services, you agree to these Terms. These Terms are supplemented by the Engagement Letter signed at the start of any consulting engagement — in the event of conflict, the Engagement Letter governs.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">2. Services Provided</h2>
              <p>MJN provides healthcare career consulting services including but not limited to: international licensing pathway support, credential verification application management, exam preparation (Academy), staffing and employer placement, student support, continuing professional development, health training, career planning, relocation assistance, and related advisory services.</p>
              <p className="mt-2">MJN acts as a consulting and representation intermediary. We are not a regulatory body, immigration authority, employer, or university. Our services do not guarantee any specific outcome from third parties.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">3. Engagement and Authorisation</h2>
              <p>All consulting engagements require a signed Engagement Letter before any service delivery commences or payment is processed. The Engagement Letter defines the scope of services, fees, payment schedule, and explicit disclaimers regarding outcomes outside MJN&apos;s control.</p>
              <p className="mt-2">Submission of applications to third parties (regulatory bodies, employers, universities) on your behalf requires a signed Letter of Authorization or Power of Attorney specific to each submission. MJN will not make third-party submissions without your explicit written authorisation.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">4. No Guarantee of Outcomes</h2>
              <p>MJN explicitly does not guarantee:</p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li>Exam pass rates or specific exam scores</li>
                <li>Regulatory body approval of licensing applications</li>
                <li>Visa or immigration permit approval</li>
                <li>Job offers, employment placement, or specific salary outcomes</li>
                <li>Specific processing timelines from third-party regulatory bodies</li>
                <li>University admission decisions</li>
              </ul>
              <p className="mt-2">These outcomes are decisions of third parties (regulatory bodies, visa authorities, employers, universities) outside MJN&apos;s control. What MJN guarantees is professional, thorough, and compliant handling of every submission within our scope of service.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">5. Fees and Payment</h2>
              <p>Service fees are specified in your Engagement Letter. A non-refundable engagement fee of $50 USD is required before any services commence. Payment is processed via our approved payment providers (Tranzak, Paystack, Flutterwave, Stripe).</p>
              <p className="mt-2">Where instalment payment plans are agreed, the schedule is defined in the Engagement Letter. MJN reserves the right to pause active case management for engagements where instalment payments are overdue by more than 21 days, following notice as specified in the Engagement Letter.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">6. Refund Policy</h2>
              <p>The engagement fee ($50) is non-refundable in all circumstances. For other service fees:</p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li>Fees for work not yet commenced may be refunded in full upon written request</li>
                <li>Fees for work in progress are subject to a pro-rated refund based on work completed</li>
                <li>Third-party fees (DataFlow, regulatory body application fees, exam booking fees) paid on your behalf are non-refundable once disbursed to the third party</li>
                <li>Academy access fees are non-refundable after 7 days of first access</li>
              </ul>
              <p className="mt-2">Refund requests must be submitted in writing to <a href="mailto:billing@mjnhealthcare.com" className="text-primary hover:underline">billing@mjnhealthcare.com</a>. We respond within 10 business days.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">7. Client Obligations</h2>
              <p>You agree to:</p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li>Provide accurate, complete, and truthful information and documents at all times</li>
                <li>Not misrepresent qualifications, clinical experience, or professional history to MJN or any third party</li>
                <li>Respond to information requests within the timeframes specified by your consultant (typically 5 business days)</li>
                <li>Not use our platform for unlawful purposes or in violation of any regulatory body&apos;s code of conduct</li>
                <li>Maintain confidentiality of your portal login credentials</li>
              </ul>
              <p className="mt-2">MJN reserves the right to terminate your engagement immediately if we discover or reasonably suspect credential fraud or misrepresentation. No refund will be issued in such circumstances.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">8. Intellectual Property</h2>
              <p>All Academy content (study plans, question banks, video lessons, guides) is the intellectual property of MJN Health Academy and Professional Services. Access is licensed to you personally and non-transferably for the duration of your Academy subscription. You may not reproduce, share, resell, or distribute Academy content.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">9. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, MJN&apos;s liability for any claim arising from our services is limited to the fees paid by you for the specific service that is the subject of the claim. MJN is not liable for indirect, consequential, or incidental losses including lost employment income, missed opportunities, or visa delays caused by third-party processing timelines.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">10. Governing Law</h2>
              <p>These Terms are governed by the laws of Cameroon. For clients based in the EU or UK, applicable consumer protection laws in those jurisdictions are not affected by this choice of law.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">11. Changes to These Terms</h2>
              <p>We may update these Terms. Changes will be notified via email or platform notice 14 days before they take effect for existing clients. Continued use of our services after the effective date constitutes acceptance.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">12. Contact</h2>
              <p>Legal enquiries: <a href="mailto:legal@mjnhealthcare.com" className="text-primary hover:underline">legal@mjnhealthcare.com</a></p>
              <p className="mt-1">General contact: <Link href="/contact" className="text-primary hover:underline">Contact page</Link></p>
            </div>

          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
