# CLAUDE.md — MJN Health Academy and Professional Services

> Company: **MJN Health Academy and Professional Services**

This file is the root reference for AI-assisted and human development on this project. It documents the business model, architecture, data model, module breakdown, and conventions. Read this in full before making structural changes.

---

## 1. What this is

A healthcare career consulting agency operating across three revenue pillars, unified by one client relationship model:

1. **Healthcare Staffing & Global Placement** — connects licensed healthcare professionals (nurses, physicians, allied health) to international job opportunities in UAE, UK, US, Ireland and other markets, with full licensing support (UAE DataFlow/DHA/MOH/DOH, UK NMC, US NCLEX/CGFNS).
2. **Education & Training (Academy)** — virtual classes, question banks, and study plans for licensure exams (NCLEX, CBT, HAAD, DHA, DA), plus hands-on simulation training and CPD programs for already-licensed professionals.
3. **Student Support Services** — internship placement (local and abroad), study-abroad guidance, and university application assistance.

A fourth initiative, **comprehensive health training across Africa**, is currently a strategic direction rather than a defined system component — see §12 Open Decisions.

**This is a consulting agency, not a self-serve SaaS product.** Every client relationship begins with a signed engagement, is managed by an assigned consultant, and involves the agency acting on the client's behalf with third parties (licensing bodies, universities, employers). This distinction drives several architectural decisions below — do not treat this as a generic marketplace or LMS.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Database | **Neon PostgreSQL** | Single source of truth across all four surfaces. This system has heavy relational integrity needs — an `Engagement` links a `Person` to a `LicensingPathway`, multiple `Order`s, `Document`s with expiry dates, and stage-dependent workflow state, all of which must stay in sync. Postgres is the right tool for that; Neon specifically for its branching/serverless ops fit with the rest of the portfolio. |
| ORM | **Prisma** (not Drizzle) | Deliberate difference from PharmaFlow. Drizzle earned its place there for Neon-serverless query complexity (FEFO, ATP calculations). This project's hard parts are relational integrity and workflow state — engagement → pathway → stage → document → payment — not complex serverless queries. Prisma's schema clarity and migration tooling fit that better. |
| Backend | **NestJS (Node.js)** | Modular monolith, same pattern as EduCore/TeraSM and NexDesk. The module boundaries (`EngagementModule`, `LicensingModule`, `StaffingModule`, `AcademyModule`, `OrderModule`, `BookingModule`, `PartnerModule`, `EventModule` — see §5) map cleanly onto NestJS's DI and module system. |
| Marketing/public site | Next.js 14 (App Router) | SSG/ISR-first for performance on low-bandwidth connections |
| Client portal | Next.js 14 | Authenticated, separate route group or separate app (decide before scaffolding — see §12) |
| Partner/employer portal | Next.js 14 | Authenticated, role-gated |
| Internal admin console | Next.js 14 | Authenticated, RBAC-heavy |
| Cache/queue | Upstash Redis + BullMQ | Same pattern as GymFlow, Mailstream, NexDesk. Reminders, installment dunning, document-expiry scans, notification fan-out. |
| Scheduled jobs | node-cron (in NestJS) | Document expiry scans, installment reminders, session reminders |
| File storage | Cloudflare R2 | Document vault (passports, licenses, medical credentials) — encrypted at rest, same as PharmaFlow |
| Auth | **Custom NestJS + Passport JWT** | Not Clerk (unlike PharmaFlow). Candidates authenticate via phone OTP through Africa's Talking (already used elsewhere in this stack — avoids paying two vendors for African SMS delivery); partner/admin/consultant users authenticate via email+password (bcrypt), with SSO as a future option for enterprise partners. Role claims embedded in the JWT for API-layer RBAC. Chosen over Clerk for cost predictability at candidate scale and full control over the three distinct user-type login flows. |
| Payments | **Paystack + Flutterwave (Africa) + Stripe (international cards)**, behind a provider abstraction layer | ⚠️ Deviates from the usual Korapay-first pattern (GymFlow). Reasoning: this product has meaningful international-card volume from the start (UK/US/Ireland-side client and employer payments) alongside African client volume, so Stripe needs to be a first-class option, not bolted on later. **Confirm this assumption** — if MoMo/Orange Money volume dominates from launch instead, switch to Korapay-first with Paystack fallback to match the portfolio default. |
| Mobile money | MTN MoMo, Orange Money | Via Paystack/Flutterwave where supported, direct integration otherwise |
| SMS/OTP | Africa's Talking | Primary for African numbers |
| WhatsApp | Twilio WhatsApp API | Primary channel for reminders and confirmations |
| Email | Resend | Receipts, formal correspondence, document status updates |
| E-signature | **Dropbox Sign** (formerly HelloSign) | Used specifically for the EngagementLetter and POA/Authorization documents — the two with real legal enforceability requirements. Chosen over DocuSign for comparable validity at lower per-envelope cost, with solid webhook support to trigger `EngagementModule` status updates on completion. Lower-stakes consent (privacy policy ack, marketing opt-in) does NOT need this — use a simple checkbox + timestamp + IP capture in `ComplianceModule` instead, no paid provider required. |
| Video/live classes | **Daily.co** | Chosen over Zoom SDK and Agora for the Academy module's virtual classrooms — built for embedded-in-app classrooms (not a redirect to an external app), strong bandwidth-adaptive streaming for the low-bandwidth-Africa audience, pay-per-minute pricing fits variable class volume better than Zoom's per-host licensing. Recording, screen share, and host controls included. |
| Mobile app | None planned | This product is web-first — professionals and employers both operate primarily on desktop for document-heavy workflows. Revisit only if a specific candidate-facing mobile need is identified (do not default to React Native + Expo here without a concrete driver) |
| AI / LLM | **Claude API (Anthropic)** | Powers the student Study Assistant, email campaign/content drafting, and staff-facing drafting tools — see §7. Assistive only for anything licensing/visa/exam-related; human review required before client-facing send in that category. |

---

## 3. The four frontend surfaces

Do not build this as one undifferentiated app. Four distinct experiences, sharing a component library and hitting the same NestJS API:

1. **Public marketing site** — unauthenticated, SEO-critical, performance-critical (low-bandwidth users). Service pages, course catalog previews, testimonials, blog, lead capture, legal/policy pages.
2. **Client/candidate portal** — authenticated. Pipeline dashboard, document vault, checkout, booking calendar, LMS access, receipts, engagement letter.
3. **Partner/employer portal** — authenticated, separate audience. Opportunity posting, candidate review, commission/invoice visibility. Gated behind a verification/onboarding flow — no open self-service signup.
4. **Internal admin console** — authenticated, RBAC. Caseload dashboards, compliance queue, financial reporting, content management for courses/blog.

Shared component library (buttons, forms, cards, the checkout cart, the document uploader) lives in a shared package consumed by all four — do not let the client portal and admin console visually diverge from the marketing site.

---

## 4. Core data model

### 4.1 Person / Client
One record per human, regardless of how many pillars they touch (student → intern → licensed candidate → placed professional is a common lifecycle — do not create duplicate records per pillar).

```
Person
 ├── id, name, contact info, profession (nurse/physician/allied health/student)
 ├── locale (en/fr)
 ├── Engagements[]
 ├── Documents[]
 ├── Payments[]
 └── CommunicationLog[]
```

### 4.2 Engagement (the consulting layer)
The formal contractual relationship — sits above individual services.

```
Engagement
 ├── Client (Person)
 ├── EngagementLetter (signed SOW: scope, fees, exclusions, disclaimers, POA/authorization)
 ├── Assigned Consultant(s)
 ├── Status (active / on hold / completed / terminated)
 ├── Services included (Order — see §4.4)
 └── Milestones (mapped to LicensingPathway stages where applicable)
```

No checkout without a signed EngagementLetter on file. This is a hard gate, not a UX nicety — it defines what's promised and what's explicitly not guaranteed (exam pass, visa approval, job offer), which matters for both compliance and dispute prevention.

### 4.3 LicensingPathway
Configurable per destination country — do not hardcode country logic into application code. Each pathway is a sequence of stages with associated documents and fees.

```
LicensingPathway
 ├── country (UAE / UK / US / Ireland / ...)
 ├── regulatoryBody (DHA, MOH, DOH, NMC, NCLEX/CGFNS, NMBI, ...)
 ├── stages[] (ordered, each with: required documents, associated ServiceItems, prerequisite stage)
```

### 4.4 Pricing catalog and orders

```
ServiceCategory
 id, name, is_mandatory (bool), sort_order

ServiceItem
 id, category_id, name, price_usd, description, sort_order,
 variant_group (nullable — e.g. "profession"), is_default_selected

ServiceItemVariant
 id, service_item_id, variant_key (e.g. "nurse" / "physician"), price_usd

Order
 id, engagement_id, line_items[], subtotal, tax_rate, tax_amount, total,
 status (pending / paid / partially_paid), created_at

OrderLineItem
 id, order_id, service_item_id, variant_id (nullable), price_charged,
 installment_plan (nullable: total_installments, installments_paid)

Receipt
 id, order_id, snapshot (immutable JSON of line items + prices at payment time),
 pdf_url, issued_at
```

Prices on `Receipt.snapshot` are immutable at time of payment — never recompute a historical receipt against current catalog prices.

### 4.5 Documents

```
Document
 id, person_id, type, file_url (R2), status (pending/verified/rejected),
 expiry_date (nullable), uploaded_at, verified_by, verified_at
```

Daily cron scans for documents nearing expiry (30/14/3 day thresholds) and fires expiry-reminder events.

### 4.6 Partner / Opportunity

```
Partner
 id, name, type (hospital/university/agency), verification_status,
 CommissionAgreement (nullable: structure, trigger_event)

Opportunity
 id, partner_id, type (job/program), details, status
```

---

## 5. Backend module boundaries (NestJS)

- `PersonModule` — shared identity, profile, locale
- `EngagementModule` — engagement letters, consultant assignment, milestones
- `LicensingModule` — pathway definitions, stage tracking, per-country configuration
- `StaffingModule` — job opportunities, employer applications, deployment pipeline
- `AcademyModule` — courses, live sessions, question banks, study plans, CPD tracking
- `StudentSupportModule` — internship placement, university applications
- `CatalogModule` — ServiceCategory/ServiceItem/Variant, pricing
- `OrderModule` — cart, checkout, tax calculation, installment tracking
- `PaymentModule` — provider abstraction (Paystack/Flutterwave/Stripe/MoMo), webhook handling
- `DocumentModule` — upload, verification workflow, expiry tracking
- `BookingModule` — generic resource-based scheduling (advisor sessions, live classes, simulation labs)
- `PartnerModule` — partner onboarding/verification, opportunities, commissions
- `EventModule` — internal event bus (see §6)
- `NotificationModule` — email (Resend), SMS/WhatsApp (Africa's Talking/Twilio) listeners on the event bus
- `ComplianceModule` — audit logging, consent records, POA/authorization capture
- `AIModule` — Claude API integration for the Study Assistant, campaign/content drafting, and staff drafting tools; enforces the review-before-send guardrail (see §7)

---

## 6. Event-driven architecture

Central event bus (NestJS `EventEmitterModule` or equivalent) — business logic publishes typed events, notification/CRM/compliance concerns subscribe independently. Do not hardcode "send email" calls inside business logic; publish an event instead.

Core events:

| Event | Typical listeners |
|---|---|
| `payment.completed` | Generate receipt, send email + WhatsApp, update Engagement status, notify consultant |
| `payment.installment_due` | Send invoice/payment link |
| `payment.installment_overdue` | Reminder → grace period → hold engagement (dunning flow — see §12) |
| `document.uploaded` | Add to compliance review queue |
| `document.expiring_soon` | Reminder to client and consultant |
| `licensing_stage.changed` | Status update to client, dashboard refresh |
| `application.submitted` | Confirm to client, notify partner |
| `booking.created` / `booking.reminder_due` | Calendar invite, reminder sequence |
| `candidate.deployed` / `student.enrolled` | Trigger partner commission invoice |

Every event should be logged for audit purposes (see §9).

---

## 7. AI capabilities

AI is used as an assistive layer across three areas — student-facing, marketing-facing, and staff-facing. In every case involving licensing, visa, or exam-eligibility information, **AI drafts and assists; it does not replace consultant sign-off**. This is a regulated, high-stakes domain — wrong information about a licensing pathway can cost a client months and real money, so nothing AI-generated reaches a client in that category without human review. That constraint should be enforced in code (a `reviewed_by`/`approved_at` field gating send), not just policy.

Provider: **Claude API (Anthropic)**, consistent with the B2B Prospecting Tool and PharmaFlow patterns already in the portfolio.

### 7.1 Student-facing — AI Study Assistant (`AcademyModule`)
- Chat-based tutor embedded in the Academy: answers exam-prep questions (NCLEX/CBT/HAAD/DA), explains question-bank rationale in plain language, available in English or French per client locale.
- Personalized study plan generation from diagnostic and practice-exam results — feeds the existing "study plan generator" requirement rather than replacing it.
- Weak-area detection — flags topics where practice performance is consistently low, surfaces them in the study plan and to the assigned tutor/consultant.
- At-risk detection — inactivity or declining practice scores flag a candidate for consultant outreach (a *flag*, not an automated intervention — a human decides what to do with it).

### 7.2 Marketing-facing — email campaigns and content (`AIModule` + `NotificationModule`)
- AI-drafted lead-nurture email sequences and campaign copy, same pattern as the B2B Prospecting Tool's Claude-API personalization.
- Subject-line and content variant generation for A/B testing.
- First-pass blog/SEO article drafts for the marketing site content pipeline.
- First-pass French/English translation assistance for marketing copy — **not** for legal documents (engagement letter, refund policy, disclaimers), which require professional/human translation given their enforceability requirements (see §9).

### 7.3 Staff-facing — consultant and compliance tooling (`AIModule` + `EngagementModule`)
- Draft client status-update messages (email/WhatsApp) triggered off `licensing_stage.changed` and similar events — drafted by AI, reviewed and sent by the assigned consultant, not auto-sent.
- Case-note summarization — condenses a candidate's history into a quick-read brief for a consultant picking up or reviewing a case.
- Document pre-screening — flags likely missing fields or inconsistencies on uploaded documents *before* human compliance review, to speed up (not replace) the verification queue in `ComplianceModule`.
- Partner-outreach personalization for the B2B side of Staffing/Partner relationships, reusing the existing Claude-API personalization pattern from the B2B Prospecting Tool.

### 7.4 Support bot (marketing site + WhatsApp + portal)
Distinct from the Study Assistant (§7.1) — this handles general help and case-status questions, not exam content.

- **Pre-engagement (marketing site widget)** — answers general service/pricing/timeline questions, qualifies leads, captures contact info into the CRM as a lead (closes the lead-funnel gap noted in §12), hands off to consultant booking rather than attempting to close the sale itself.
- **Post-engagement (WhatsApp + portal, WhatsApp being the primary channel for this audience)** — answers status questions ("where's my case," "what documents do I still need"), sends document-checklist reminders, assists with rebooking.
- **Grounded, not generative, for anything case-specific.** Status answers come from Claude tool-use/function-calling against the real `EngagementModule`/`OrderModule`/`DocumentModule` APIs — the bot looks up a status, it never generates one from general knowledge. Free-text generation is fine for FAQs; specific-candidate facts are not.
- **Escalation** — licensing eligibility, visa outcomes, and exam-pass likelihood are off-limits for the bot per the §7.5 guardrail below; low-confidence answers or an explicit request for a human also escalate. Fires `bot.escalation_requested` on the event bus (§6), notifying the assigned consultant with full conversation context.

### 7.5 Guardrails
- Any AI output touching licensing eligibility, visa guidance, or exam-pass likelihood is labeled as informational and routed through consultant approval before reaching a client — no exceptions.
- AI-drafted client communications are queued for review, not sent directly, distinguishing them from the fully automated system notifications in §6 (receipts, reminders) which are safe to send unreviewed because they're deterministic, not generated.
- Log AI-assisted actions (draft generated, reviewed by whom, sent/edited/rejected) in the same audit trail as document access (§9) — this is also useful data for improving prompts over time.

---

## 8. Checkout and payment flow

1. **Prerequisite**: EngagementLetter signed (see §4.2) — no checkout without it.
2. **Engagement fee** — $50, mandatory, auto-added, not removable.
3. **Category selection** — multi-select (not single-choice): UAE Licensure / NCLEX / Student Support. Multiple categories can be active simultaneously on one order.
4. **Line item selection** — each selected category expands its itemized checklist; items default-checked but individually removable. Profession-based price variants (e.g. DataFlow verification: nurse vs. physician) resolve to a single line using the client's profession on file.
5. **Live cart total** — recalculated client-side for UX, re-validated server-side on submit (never trust client-computed totals).
6. **Installments** — where the catalog defines "1st/2nd instalment" items, only the first is charged at checkout; the second is auto-invoiced on a schedule or stage-trigger, delivered via the notification listeners on `payment.installment_due`.
7. **Tax** — applied once to the full subtotal; shown as its own line, never folded into item prices. `total = subtotal + (subtotal × tax_rate)`.
8. **Payment** — provider selection based on client location (card/Stripe international, MoMo/Orange Money/Paystack/Flutterwave for African clients).
9. **Receipt** — generated as an immutable snapshot on `payment.completed`, itemized by category, shows tax and total, marks partial payment status clearly if applicable. PDF + email + WhatsApp confirmation, all via the event bus.

**Fulfillment vs. payment are decoupled**: a client may pay for a step before its prerequisite stage is confirmed complete. Payment always succeeds if the cart is valid; actual work on a paid-for step is gated by `LicensingPathway` stage completion, tracked separately in the consultant's case view. This avoids blocking revenue while avoiding promises the pipeline can't yet keep.

---

## 9. Compliance, security, and consulting-specific requirements

- **Engagement letter** — every engagement requires a signed SOW capturing scope, fees, and explicit disclaimers (no guarantee of exam pass, visa approval, or job placement).
- **Power of Attorney / Letter of Authorization** — required before staff submit anything to a third party (DataFlow, NMC, CGFNS, etc.) on a client's behalf. Captured per engagement, not assumed from the engagement letter alone.
- **Document encryption at rest** (R2 with encryption) — these are passports, licenses, medical credentials.
- **RBAC enforced at the API layer**, not just hidden in the UI.
- **Audit logging** — who viewed/downloaded which document, when. Required both for compliance and because clients may reasonably ask.
- **Session timeout** on the client portal given sensitive document access.
- **Cross-border data handling** — candidate documents move between Cameroon/other African jurisdictions and UAE/UK/US/Ireland. Requires actual legal review (Cameroon data protection rules + UK/Ireland GDPR obligations at minimum) before launch — do not treat this as solved by an audit log.
- **Partner verification** — no partner (hospital/university/agency) gets self-service access to candidate data without a completed verification workflow.

---

## 10. Bilingual requirement (French/English)

Built into routing and content model from the start — not a translated-string bolt-on.
- Locale-aware routing (`/en/...`, `/fr/...`) across all four surfaces.
- Legal documents (engagement letter, refund policy, privacy policy) must exist in both languages — an English-only refund policy is not defensible for francophone clients.
- Consultant assignment may need to account for client language preference.

---

## 11. Performance and accessibility

- Marketing site: SSG/ISR wherever content doesn't require per-request dynamism. Minimize JS shipped to marketing visitors — do not leak client-portal bundle weight into public pages.
- Aggressive image optimization (Next.js Image, WebP, lazy loading) — first-touch audience is often on constrained connections in West Africa.
- WCAG AA baseline, especially for forms and document upload flows.
- Organization + Course schema.org structured data on the marketing site for SEO.

---

## 12. Open decisions (resolve before/during build, not after)

- **Africa training pillar** — is this individual CPD sales, B2B institutional contracts, or physical/mobile training delivery? Each implies a different data model. Do not build generic placeholder support for all three.
- **Client portal / partner portal / admin console** — separate Next.js apps, or role-gated route groups within one app? Affects deployment and auth architecture.
- **Installment dunning policy** — exact reminder/grace-period/hold sequence for overdue second installments needs to be defined and encoded, not left implicit.
- **Refund policy per pipeline stage** — what's refundable vs. already-spent-on-client's-behalf (non-refundable third-party fees) needs explicit definition, referenced from the engagement letter.
- **Failed-attempt handling** — is a retake (failed NCLEX, rejected DataFlow submission) a new full-price purchase or a discounted retake SKU? Affects `ServiceItem` catalog design.

---

## 13. Conventions (matching established project patterns)

- Payment provider abstraction layer — never call a specific gateway directly from business logic.
- Payment provider order for this project is Paystack + Flutterwave + Stripe, not the usual Korapay-first pattern — see §2 for reasoning and the open confirmation needed.
- Africa's Talking preferred over Twilio for SMS to African numbers; Twilio retained for WhatsApp.
- Prisma for all relational modeling (not Drizzle — this project doesn't have PharmaFlow's serverless-query-complexity driver).
- BullMQ + Upstash Redis for all queuing (reminders, dunning, expiry scans).
- Neon PostgreSQL, single database across all four frontend surfaces.
- No mobile app unless a specific, concrete candidate-facing need emerges — this is a document-heavy, desktop-first workflow product.
- Auth is custom (Passport JWT), not Clerk — phone OTP via Africa's Talking for candidates, email/password for staff/partners. See §2 for reasoning.
- Dropbox Sign is reserved for legally enforceable documents only (EngagementLetter, POA/Authorization) — do not route routine consent checkboxes through it.
- Daily.co for all live classroom sessions in the Academy module.
- Claude API for all AI features (§7); anything licensing/visa/exam-eligibility related is drafted by AI but requires consultant approval before it reaches a client — enforce this in code, not just processcons