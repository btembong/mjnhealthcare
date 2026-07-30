'use client';

import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Badge } from '@mjn/ui';

export default function RefundPolicyPage() {
  return (
    <>
      <MarketingNav />

      <section className="px-6 pt-28 pb-8">
        <div className="mx-auto max-w-3xl">
          <Badge variant="outline" className="mb-4">Legal</Badge>
          <h1 className="text-4xl font-extrabold text-foreground">Refund Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: 1 July 2026 · Applies to all engagements from 1 July 2026</p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 text-sm leading-relaxed">
              <p className="font-semibold mb-1">Important — read before you engage</p>
              <p>MJN operates as a professional consulting agency. A portion of every fee is applied to third-party costs (DataFlow submissions, regulatory body application fees, translation services, courier costs) on your behalf within days of engagement. Those third-party costs are non-refundable because they cannot be recovered once paid. This policy defines exactly what is and is not refundable at each stage.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">1. Engagement Fee</h2>
              <p>The $50 engagement fee is <strong className="text-foreground">non-refundable</strong> under all circumstances. It covers the administrative cost of onboarding your case, assigning a consultant, and preparing your engagement letter — work that is performed before any service delivery begins.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">2. Service Fees — Cancellation Before Work Commences</h2>
              <p>If you request cancellation in writing within <strong className="text-foreground">5 business days</strong> of signing your engagement letter, and MJN has not yet submitted any documents or applications to any third party on your behalf, you are entitled to a full refund of service fees paid, excluding the $50 engagement fee.</p>
              <p className="mt-3">To request cancellation, email <a href="mailto:accounts@mjnhealthcare.com" className="text-primary hover:underline">accounts@mjnhealthcare.com</a> with your engagement reference number. Refunds are processed within 10 business days via the original payment method.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">3. Service Fees — Cancellation After Work Has Commenced</h2>
              <p>Once MJN has begun active work on your case — defined as any of the following — your refund entitlement is reduced:</p>
              <ul className="mt-3 list-disc list-inside space-y-1.5 ml-2">
                <li>DataFlow application submitted to HAAD/DHA/DOH/MOH</li>
                <li>Primary source verification request sent to your training institution or registration body</li>
                <li>NMC, NCLEX, NMBI, or other regulatory body application lodged</li>
                <li>Document translation or attestation commissioned</li>
                <li>Employer matching and introduction begun</li>
              </ul>
              <p className="mt-4">In these cases, the refund is calculated as:</p>
              <div className="mt-3 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Stage at cancellation</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Refund of service fees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ['Work commenced, no third-party submissions yet', '75%'],
                      ['Third-party submissions made, less than 30 days since engagement', '50%'],
                      ['Third-party submissions made, 30–90 days since engagement', '25%'],
                      ['More than 90 days since engagement commencement', '0%'],
                    ].map(([stage, refund]) => (
                      <tr key={stage}>
                        <td className="px-4 py-3 text-muted-foreground">{stage}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{refund}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4">Service fee refunds are calculated on the MJN consulting fee component only. Third-party fees are not included in any refund calculation — see Section 4.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">4. Third-Party Fees — Non-Refundable</h2>
              <p>Fees paid to third parties on your behalf are <strong className="text-foreground">strictly non-refundable</strong>, regardless of the outcome or reason for cancellation. These include:</p>
              <ul className="mt-3 list-disc list-inside space-y-1.5 ml-2">
                <li>DataFlow Primary Source Verification fees (DHA, DOH, MOH)</li>
                <li>Regulatory body application fees (NMC, NCLEX/CGFNS, NMBI, IMC, CORU, HCPC)</li>
                <li>Exam registration fees (DHA, HAAD/DOH, Prometric, Pearson VUE)</li>
                <li>Translation, notarisation, or attestation fees</li>
                <li>Courier or document handling costs</li>
                <li>e-Signature platform fees (for engagement letter processing)</li>
              </ul>
              <p className="mt-3">MJN itemises all third-party costs in your engagement letter before payment. You authorise MJN to disburse those amounts on your behalf when you sign.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">5. Exam Preparation (Academy) Fees</h2>
              <p>Access to the MJN Academy (question banks, live classes, study plans, AI Study Assistant) is governed by the following:</p>
              <ul className="mt-3 list-disc list-inside space-y-1.5 ml-2">
                <li><strong className="text-foreground">Within 7 days of purchase, no sessions attended:</strong> Full refund of Academy fees.</li>
                <li><strong className="text-foreground">Within 14 days, fewer than 3 live sessions attended:</strong> 50% refund.</li>
                <li><strong className="text-foreground">After 14 days or 3+ sessions attended:</strong> No refund. Access continues until the enrolled period ends.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">6. Consultation Bookings</h2>
              <p>Individual consultation sessions (booked through <Link href="/consult" className="text-primary hover:underline">/consult</Link>) are governed by the following cancellation terms:</p>
              <ul className="mt-3 list-disc list-inside space-y-1.5 ml-2">
                <li><strong className="text-foreground">Cancelled more than 24 hours before the session:</strong> Full refund.</li>
                <li><strong className="text-foreground">Cancelled 4–24 hours before the session:</strong> 50% refund.</li>
                <li><strong className="text-foreground">Cancelled less than 4 hours before or no-show:</strong> No refund.</li>
              </ul>
              <p className="mt-3">If MJN cancels or reschedules a session, you will receive a full refund or rescheduled session at your choice.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">7. Instalment Plans</h2>
              <p>Where your engagement is structured as two instalments, each instalment is subject to this refund policy independently at the time it is paid. The first instalment covers early-stage work. The second instalment is invoiced only when the first deliverable milestone is reached — meaning refund eligibility at the point the second instalment falls due is typically limited to Section 3 rates above.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">8. Outcome Disclaimer</h2>
              <p>MJN does not guarantee exam pass outcomes, visa approval, regulatory body approval, or job offers. These outcomes depend on your individual qualifications, exam performance, and decisions made by third-party regulatory and immigration authorities entirely outside MJN&apos;s control. Failure to pass an exam or receive approval from a regulatory body does not entitle you to a refund of MJN consulting or third-party fees. This disclaimer is also stated in your engagement letter.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">9. How to Request a Refund</h2>
              <p>Submit your refund request in writing to <a href="mailto:accounts@mjnhealthcare.com" className="text-primary hover:underline">accounts@mjnhealthcare.com</a> with the following:</p>
              <ul className="mt-3 list-disc list-inside space-y-1.5 ml-2">
                <li>Your full name and engagement reference number</li>
                <li>Date of engagement letter signature</li>
                <li>Reason for cancellation</li>
                <li>Preferred refund method (must match original payment method)</li>
              </ul>
              <p className="mt-3">MJN will acknowledge your request within 2 business days and issue a refund decision within 10 business days. Approved refunds are processed within 10 business days of decision.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">10. Disputes</h2>
              <p>If you disagree with a refund decision, you may escalate in writing to <a href="mailto:director@mjnhealthcare.com" className="text-primary hover:underline">director@mjnhealthcare.com</a>. MJN will review the escalation within 5 business days. This policy does not affect any statutory rights you may have under applicable law in your jurisdiction.</p>
            </div>

            <div className="border-t border-border pt-8">
              <p className="text-xs text-muted-foreground">
                This policy is incorporated by reference into your MJN engagement letter. It applies to all engagements signed on or after 1 July 2026.
                Earlier engagements are subject to the policy version in effect at the time of signing.
                Questions: <a href="mailto:accounts@mjnhealthcare.com" className="text-primary hover:underline">accounts@mjnhealthcare.com</a>
              </p>
              <div className="mt-4 flex gap-4 text-xs">
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
