'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle, CircleNotch, Signature, Seal,
  ArrowLeft, WarningCircle, Scroll,
} from '@phosphor-icons/react';
import { api } from '../../../../lib/api';
import { useUser } from '../../../../contexts/user-context';
import { toast } from 'sonner';

function EngagementLetterContent({ personName }: { personName: string }) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="prose prose-sm max-w-none text-foreground space-y-5 text-sm leading-relaxed">
      <p className="text-muted-foreground text-xs">Effective date: {today}</p>

      <p>Dear <strong>{personName}</strong>,</p>

      <p>
        Thank you for choosing <strong>MJN Health Academy and Professional Services LTD</strong>. This Engagement Letter
        ("Letter") sets out the terms under which we will provide consulting services to you. Please read it carefully
        before signing.
      </p>

      <h3 className="font-bold text-foreground">1. Scope of Services</h3>
      <p>
        MJN Healthcare will provide professional consulting services in one or more of the following areas as agreed during
        your onboarding:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Healthcare licensing support (UAE DataFlow / DHA / MOH / DOH; UK NMC; US NCLEX / CGFNS; Ireland NMBI)</li>
        <li>Exam preparation — NCLEX, HAAD, DHA, CBT, DA</li>
        <li>International placement and staffing support</li>
        <li>Student support services (internship placement, university applications)</li>
      </ul>
      <p>
        The specific services applicable to your engagement are as agreed with your assigned consultant and reflected
        in your service order. Services may be updated by mutual agreement.
      </p>

      <h3 className="font-bold text-foreground">2. Fees and Payment</h3>
      <p>
        A non-refundable engagement fee of <strong>USD 50</strong> applies to all engagements. Service fees are as
        itemised in your order summary and are payable in advance or according to any instalment schedule agreed at
        checkout. All fees are stated in USD.
      </p>

      <h3 className="font-bold text-foreground">3. No Guarantee of Outcome</h3>
      <p>
        MJN Healthcare provides professional support and guidance. We do not guarantee, and expressly disclaim any
        guarantee of:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Passing any licensing or certification examination</li>
        <li>Approval of any visa, work permit, or immigration application</li>
        <li>A job offer, placement, or contract from any employer or partner</li>
        <li>Admission to any university or academic programme</li>
      </ul>
      <p>
        Outcomes depend on third-party bodies (regulatory authorities, employers, immigration authorities) and factors
        outside our control, including applicant qualifications, documentation, and eligibility requirements.
      </p>

      <h3 className="font-bold text-foreground">4. Client Obligations</h3>
      <p>You agree to:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Provide accurate, complete, and truthful information and documents</li>
        <li>Respond promptly to requests from your consultant</li>
        <li>Not submit parallel applications through other agencies for the same licensing pathway without prior notice</li>
        <li>Notify us immediately of any change in your circumstances that may affect your application</li>
      </ul>

      <h3 className="font-bold text-foreground">5. Authorisation</h3>
      <p>
        By signing this letter you authorise MJN Healthcare to act on your behalf in communications with licensing bodies,
        regulatory authorities, and partner organisations, limited to the scope of services above. A separate
        Power of Attorney or Letter of Authorisation will be provided before any submission is made to a third party
        on your behalf.
      </p>

      <h3 className="font-bold text-foreground">6. Confidentiality</h3>
      <p>
        Both parties agree to keep confidential all non-public information exchanged in connection with this engagement.
        Your personal data will be processed in accordance with our Privacy Policy.
      </p>

      <h3 className="font-bold text-foreground">7. Refunds</h3>
      <p>
        The engagement fee (USD 50) is non-refundable. Refunds for service fees are governed by our Refund Policy,
        available on our website. Fees already paid to third parties on your behalf (regulatory body fees, DataFlow
        fees, etc.) are not refundable by MJN Healthcare regardless of outcome.
      </p>

      <h3 className="font-bold text-foreground">8. Limitation of Liability</h3>
      <p>
        MJN Healthcare's total liability under this engagement shall not exceed the total fees paid by you for the specific
        service in dispute. We are not liable for indirect, consequential, or incidental losses.
      </p>

      <h3 className="font-bold text-foreground">9. Governing Law</h3>
      <p>
        This Letter is governed by the laws of the jurisdiction of MJN Healthcare's principal place of business.
        Disputes shall first be referred to mediation before any legal proceedings are commenced.
      </p>

      <p className="pt-2 border-t border-border">
        By electronically signing below, you confirm that you have read, understood, and agree to the terms of this
        Engagement Letter. Your electronic signature carries the same legal weight as a handwritten signature.
      </p>
    </div>
  );
}

export default function SignEngagementPage() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const router = useRouter();
  const { me, loading: userLoading } = useUser();

  const [engagement, setEngagement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  // Scroll-to-bottom tracking
  const letterRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (userLoading || !me) return;
    api.getEngagement(engagementId)
      .then((eng) => {
        setEngagement(eng);
        if (eng.letterSignedAt) setSigned(true);
      })
      .catch((err: any) => setError(err.message ?? 'Failed to load engagement'))
      .finally(() => setLoading(false));
  }, [engagementId, userLoading, me]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    if (atBottom) setScrolledToBottom(true);
  }

  async function handleSign() {
    if (!agreed || !scrolledToBottom || signing) return;
    setSigning(true);
    try {
      await api.signEngagementLetter(engagementId);
      setSigned(true);
      toast.success('Engagement letter signed. Your case is now active!');
    } catch (err: any) {
      toast.error(err.message ?? 'Signing failed. Please try again.');
    } finally {
      setSigning(false);
    }
  }

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <CircleNotch className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <WarningCircle className="h-10 w-10 text-rose-400 mb-3" />
        <p className="font-semibold text-foreground">{error}</p>
        <button onClick={() => router.push('/case')}
          className="mt-4 text-sm font-semibold text-primary hover:underline">
          Back to My Case
        </button>
      </div>
    );
  }

  const person = engagement?.person ?? me ?? {};
  const personName = person.name ?? me?.name ?? 'Client';

  // ── Already signed ──
  if (signed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <Seal weight="fill" className="h-10 w-10 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Letter Signed</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Your engagement letter is signed and your case is now active. Your consultant will be in touch shortly.
          </p>
          {engagement?.letterSignedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Signed on {new Date(engagement.letterSignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/case')}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          View My Case
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/case')}
          className="rounded-xl border border-border p-2 hover:bg-muted/50 transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Engagement Letter</h1>
          <p className="text-xs text-muted-foreground">Read the full letter below, then sign to activate your case</p>
        </div>
      </div>

      {/* Scroll-progress hint */}
      {!scrolledToBottom && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          <Scroll className="h-4 w-4 shrink-0" />
          Scroll to the bottom of the letter to unlock the sign button.
        </div>
      )}

      {/* Letter card */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Letter header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Scroll className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-base">MJN Healthcare Engagement Letter</p>
              <p className="text-xs text-white/70">Please read all terms before signing</p>
            </div>
          </div>
        </div>

        {/* Scrollable letter body */}
        <div
          ref={letterRef}
          onScroll={handleScroll}
          className="overflow-y-auto px-6 py-6"
          style={{ maxHeight: '55vh' }}
        >
          <EngagementLetterContent personName={personName} />
        </div>

        {/* Scroll indicator */}
        {!scrolledToBottom && (
          <div className="border-t border-border bg-muted/30 px-6 py-2 text-center">
            <p className="text-xs text-muted-foreground">↓ Keep scrolling to read all terms</p>
          </div>
        )}
      </div>

      {/* Sign section */}
      <div className={`rounded-2xl border bg-white shadow-sm p-6 space-y-4 transition-opacity ${!scrolledToBottom ? 'opacity-40 pointer-events-none select-none' : ''}`}>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={!scrolledToBottom}
            className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
          />
          <label htmlFor="agree" className="text-sm text-foreground leading-snug cursor-pointer">
            I, <strong>{personName}</strong>, confirm that I have read and fully understood this Engagement Letter,
            and I agree to be bound by its terms. I understand that this electronic signature is legally binding.
          </label>
        </div>

        <div className="rounded-xl bg-muted/30 border border-border px-4 py-3 text-xs text-muted-foreground space-y-0.5">
          <p><span className="font-semibold">Signer:</span> {personName}</p>
          {me?.email && <p><span className="font-semibold">Email:</span> {me.email}</p>}
          <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <button
          onClick={handleSign}
          disabled={!agreed || !scrolledToBottom || signing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors active:scale-[0.99]"
        >
          {signing
            ? <><CircleNotch className="h-4 w-4 animate-spin" /> Signing…</>
            : <><Signature className="h-4 w-4" /> Sign Engagement Letter</>}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Your IP address and the time of signing are recorded for legal purposes.
        </p>
      </div>
    </div>
  );
}
