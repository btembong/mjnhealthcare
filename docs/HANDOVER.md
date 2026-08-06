# MJN Health Academy and Professional Services LTD
## Technical Handover Document & Service Agreement

**Prepared by:** Digos Technologies
**Prepared for:** MJN Health Academy and Professional Services LTD
**Date:** August 2026
**Document version:** 1.0
**Confidentiality:** This document contains sensitive infrastructure information. Do not share publicly.

---

# PART A — TECHNICAL RUNBOOK

## 1. System Overview

The MJN Healthcare digital platform is a full-stack web application serving four distinct user audiences:

| Application | URL | Purpose |
|---|---|---|
| Marketing / Public Site | `https://mjnhealthcare.com` | SEO, lead generation, public information |
| Client Portal | `https://portal.mjnhealthcare.com` | Candidate dashboard, documents, payments, case management |
| Partner Portal | `https://partner.mjnhealthcare.com` | Employer/partner access |
| Admin Console | `https://admin.mjnhealthcare.com` | Internal staff and consultant operations |
| API (backend) | `https://api.mjnhealthcare.com` | All data and business logic |

All five applications run on a single VPS and are managed as one monorepo codebase.

---

## 2. Server Infrastructure

| Item | Detail |
|---|---|
| Host | Hostinger KVM2 VPS |
| Operating system | Ubuntu 24.04 LTS |
| Server hostname | srv1871064 |
| IPv4 address | See Hostinger hPanel |
| IPv6 address | `2a02:4780:f:7f83::1` |
| Process manager | PM2 |
| Reverse proxy / SSL | Caddy (auto HTTPS via Let's Encrypt) |
| Code location | `/var/www/mjnhealthcare/` |
| Git repository | `https://github.com/btembong/mjnhealthcare` |

### SSH Access

```bash
ssh root@<server-ip>
```

Credentials are held by the system administrator. Store securely — do not share over email or messaging apps.

---

## 3. Architecture

```
Browser / Mobile
      |
      v
   Caddy (ports 80 + 443, auto SSL)
      |
      |-- mjnhealthcare.com          --> Next.js  (port 3001)
      |-- portal.mjnhealthcare.com   --> Next.js  (port 3002)
      |-- partner.mjnhealthcare.com  --> Next.js  (port 3003)
      |-- admin.mjnhealthcare.com    --> Next.js  (port 3004)
      |-- api.mjnhealthcare.com      --> NestJS   (port 3000)
```

**Technology stack:**

| Layer | Technology |
|---|---|
| Backend API | NestJS (Node.js) — modular monolith |
| Frontend (all 4 apps) | Next.js 16 (React 19, App Router) |
| Database | Neon PostgreSQL (cloud-hosted, serverless) |
| ORM | Prisma |
| Job queue | BullMQ + Upstash Redis |
| File storage | Cloudflare R2 (encrypted at rest) |
| Email | Brevo |
| SMS / OTP | Africa's Talking |
| WhatsApp | Twilio |
| Payments | Tranzak |
| E-signature | Dropbox Sign |
| Live classes | Daily.co |
| AI (Study Assistant, support bot) | Anthropic Claude API |

---

## 4. Domain & DNS

**Registrar / DNS manager:** Namecheap
**Domain:** `mjnhealthcare.com`

### Current DNS Records

| Type | Host | Value | Purpose |
|---|---|---|---|
| A | @ | Server IPv4 | Main domain → server |
| A | www | Server IPv4 | www redirect |
| A | portal | Server IPv4 | Client portal |
| A | partner | Server IPv4 | Partner portal |
| A | admin | Server IPv4 | Admin console |
| A | api | Server IPv4 | Backend API |
| AAAA | @ | `2a02:4780:f:7f83::1` | IPv6 (Starlink / modern networks) |
| AAAA | www | `2a02:4780:f:7f83::1` | IPv6 www |

SSL certificates are issued and renewed automatically by Caddy — no manual renewal required.

---

## 5. Third-Party Services

| Service | Purpose | Where to manage |
|---|---|---|
| **Neon** (neon.tech) | PostgreSQL database | neon.tech dashboard |
| **Cloudflare R2** | Document file storage (passports, licences) | Cloudflare dashboard |
| **Brevo** | Transactional email (receipts, notifications) | brevo.com |
| **Africa's Talking** | SMS and phone OTP for African numbers | africastalking.com |
| **Twilio** | WhatsApp notifications | twilio.com |
| **Tranzak** | Payment processing (African cards + mobile money) | tranzak.me |
| **Dropbox Sign** | E-signature for engagement letters and POA | dropbox.com/sign |
| **Daily.co** | Live virtual classroom video | daily.co |
| **Upstash** | Redis (OTP cache, job queue) | upstash.com |
| **Anthropic** | Claude AI (Study Assistant, support bot) | console.anthropic.com |
| **Namecheap** | Domain registration and DNS | namecheap.com |
| **Hostinger** | VPS server | hpanel.hostinger.com |

All API keys and credentials are stored in `/var/www/mjnhealthcare/.env` on the server. A template of required keys (without values) is at `.env.example` in the repository.

---

## 6. Environment Variables

Environment variables live in two files on the server:

- `/var/www/mjnhealthcare/.env` — root (shared)
- `/var/www/mjnhealthcare/apps/api/.env` — API-specific copy (must be kept in sync)

**Never commit `.env` files to Git.** The `.gitignore` already excludes them.

Key variable groups:

| Group | Variables | Controls |
|---|---|---|
| Database | `DATABASE_URL` | Neon PostgreSQL connection |
| Auth | `JWT_SECRET` | Token signing |
| Storage | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` | File uploads |
| Email | `BREVO_API_KEY` | Transactional email |
| SMS | `AT_API_KEY`, `AT_USERNAME` | Africa's Talking OTP/SMS |
| WhatsApp | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | WhatsApp messages |
| Payments | `TRANZAK_APP_ID`, `TRANZAK_APP_KEY` | Payment processing |
| E-signature | `DROPBOX_SIGN_API_KEY`, `DROPBOX_SIGN_TEMPLATE_ID` | Engagement letter signing |
| Video | `DAILY_CO_API_KEY` | Live class rooms |
| Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | OTP cache, job queue |
| AI | `ANTHROPIC_API_KEY` | Claude AI features |

---

## 7. Process Management (PM2)

All five applications are managed by PM2. The configuration is at `/var/www/mjnhealthcare/ecosystem.config.js`.

### Common PM2 commands

```bash
# View all running processes and their status
pm2 status

# View live logs for a specific app
pm2 logs mjn-api
pm2 logs mjn-web
pm2 logs mjn-portal
pm2 logs mjn-admin
pm2 logs mjn-partner

# Restart a single app
pm2 restart mjn-api
pm2 restart mjn-web

# Restart all apps
pm2 restart all

# Stop all apps
pm2 stop all

# Ensure PM2 restarts on server reboot
pm2 startup
pm2 save
```

---

## 8. Deployment Procedure

All code changes are deployed from the Git repository. The workflow is:

```bash
# 1. SSH into the server
ssh root@<server-ip>

# 2. Navigate to the project
cd /var/www/mjnhealthcare

# 3. Pull latest code
git pull origin main

# 4. Build and restart the affected app(s)
# — For the API:
cd apps/api && pnpm build && pm2 restart mjn-api

# — For the public website:
cd apps/web && pnpm build && pm2 restart mjn-web

# — For the client portal:
cd apps/portal && pnpm build && pm2 restart mjn-portal

# — For the admin console:
cd apps/admin && pnpm build && pm2 restart mjn-admin

# 5. Verify (should show "online" for all processes)
pm2 status
```

If database schema changes were made, run migrations before restarting the API:

```bash
cd /var/www/mjnhealthcare/packages/database
export DATABASE_URL="<value from .env>"
npx prisma migrate deploy
```

---

## 9. Database

| Item | Detail |
|---|---|
| Provider | Neon (neon.tech) |
| Engine | PostgreSQL 16 |
| Access | Via `DATABASE_URL` in `.env` |
| ORM | Prisma |
| Schema location | `packages/database/prisma/schema.prisma` |
| Migrations folder | `packages/database/prisma/migrations/` |

**Never edit the database directly in production unless absolutely necessary.** All schema changes must go through Prisma migrations.

**Backups:** Neon provides automatic point-in-time recovery. Log into neon.tech to manage backup retention and restore points.

---

## 10. Caddy (Reverse Proxy & SSL)

Caddy configuration: `/var/www/mjnhealthcare/Caddyfile`

SSL certificates are issued and renewed automatically via Let's Encrypt — no manual action required.

```bash
# View Caddy status
systemctl status caddy

# Restart Caddy (e.g. after editing Caddyfile)
systemctl reload caddy

# View Caddy logs
journalctl -u caddy -f
```

---

## 11. Troubleshooting

### Site not loading

```bash
pm2 status                        # Check all processes are "online"
pm2 logs mjn-web --lines 50       # Check for errors
systemctl status caddy            # Check reverse proxy is running
```

### API errors / 500 responses

```bash
pm2 logs mjn-api --lines 100      # Check API logs for exceptions
```

### Cannot receive OTP / SMS not arriving

- Check Africa's Talking dashboard for delivery reports and account balance
- Verify `AT_API_KEY` and `AT_USERNAME` in `.env`

### Payments not processing

- Check Tranzak dashboard for webhook logs
- Verify `TRANZAK_APP_ID` and `TRANZAK_APP_KEY` in `.env`

### Emails not sending

- Check Brevo dashboard for bounce/block reports
- Verify `BREVO_API_KEY` in `.env`
- Check daily sending quota has not been exceeded

### Site unreachable from specific networks (e.g. Starlink)

- Confirm AAAA DNS records exist in Namecheap for `@` and `www`
- Run `ss -tlnp | grep caddy` on server — should show `*:443`

---

---

# PART B — PROJECT DELIVERY AGREEMENT

**Agreement reference:** DT-MJN-2026-001
**Date:** August 2026

**Between:**

**Digos Technologies** (hereinafter "the Developer")
Digital solutions agency, Republic of Cameroon

**And:**

**MJN Health Academy and Professional Services LTD** (hereinafter "the Client")
Ministerial Authorization No. M032517649867P/RC/YAO/2025/B/637
Republic of Cameroon

---

## 1. Scope of Delivered Work

The Developer has designed, developed, and delivered the following digital platform on behalf of the Client:

### 1.1 Public Marketing Website (`mjnhealthcare.com`)
- Full multi-page marketing site (home, services, academy, success stories, blog, contact, get-started, and destination pages)
- SEO optimization (sitemap, structured data, Open Graph meta, robots.txt)
- Bilingual-ready architecture (English / French routing)
- Mobile-responsive design across all screen sizes
- WhatsApp chat widget and AI-powered support bot
- Lead capture and consultation booking flow

### 1.2 Client / Candidate Portal (`portal.mjnhealthcare.com`)
- Secure authenticated candidate dashboard
- Case management and pipeline tracking
- Document vault (upload, verification status, expiry alerts)
- Payment and receipt management
- Checkout flow with installment support
- Academy (courses, question banks, study plans, AI study assistant)
- Consultation booking
- Engagement letter signing integration (Dropbox Sign)

### 1.3 Partner Portal (`partner.mjnhealthcare.com`)
- Authenticated partner/employer access
- Opportunity management and candidate pipeline visibility

### 1.4 Admin Console (`admin.mjnhealthcare.com`)
- Staff authentication and role-based access control
- Caseload management and compliance queue
- Document verification workflow
- AI drafts review and approval queue
- Financial reporting and lead management
- Course and content management

### 1.5 Backend API (`api.mjnhealthcare.com`)
- NestJS modular API with 17 modules:
  Auth, Person, Engagement, Licensing, Staffing, Academy, StudentSupport,
  Catalog, Order, Payment, Document, Booking, Partner, Notification,
  Compliance, AI, Consultation
- Event-driven notifications (email, SMS, WhatsApp)
- PDF receipt generation
- Installment and dunning automation
- Document expiry scanning (daily cron)
- Dropbox Sign webhook integration
- Tranzak payment processing and webhook handling

### 1.6 Infrastructure & Deployment
- VPS server provisioned and configured (Hostinger KVM2)
- Caddy reverse proxy with automatic SSL
- PM2 process management with startup persistence
- IPv4 and IPv6 dual-stack DNS configuration
- CI/CD via Git (GitHub repository: `btembong/mjnhealthcare`)
- Environment variable management and security configuration

---

## 2. Delivery Acceptance

The Client acknowledges receipt and acceptance of the delivered platform as described in Section 1, subject to the following:

- All features listed above are operational as of the date of this agreement
- The Client has been provided with login credentials, server access, and all third-party service account details
- A full walkthrough and handover session has been conducted

**Client acceptance signature:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Name:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Title:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Developer representative:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Name:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Title:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## 3. Intellectual Property

Upon receipt of full payment for the delivered project:

- The Client owns all custom code, designs, and content developed specifically for this platform
- The Developer retains no claim over the platform or its derivatives after handover
- Third-party libraries, frameworks, and services remain subject to their respective licenses
- The Developer retains the right to reference this project in its portfolio (without disclosing confidential business data)

---

## 4. Warranties & Limitations

The Developer warrants that:

- The platform has been built using industry-standard practices and technologies
- The code is original work except where open-source libraries are used

The Developer does not warrant:

- Uninterrupted operation of third-party services (Neon, Tranzak, Brevo, etc.)
- Exam pass rates, visa approvals, or job placement outcomes (these are subject to regulatory bodies beyond any party's control)
- Compatibility with future browser or OS versions without maintenance

---

---

# PART C — MAINTENANCE & SUPPORT AGREEMENT

**Agreement reference:** DT-MJN-2026-MSA-001
**Effective date:** Upon signing
**Governing law:** Republic of Cameroon

**Between:**

**Digos Technologies** — Developer / Service Provider
**MJN Health Academy and Professional Services LTD** — Client

---

## 1. Maintenance Plans

Three tiers are offered. The Client selects one tier at signing.

---

### Tier 1 — Essential · USD 20 / month

Covers the minimum required to keep the platform secure and operational.

| Service | Included |
|---|---|
| Uptime monitoring (24/7 automated alerts) | Yes |
| Security patches and dependency updates | Yes |
| Server health checks (monthly) | Yes |
| Bug fixes — critical (site down, payment failure, data loss) | Yes — within 24 hours |
| Bug fixes — minor (visual issues, non-blocking errors) | Up to 3 per month |
| Feature development | Not included |
| Content updates | Not included |
| Response time (business hours, Mon–Fri) | Within 24 hours |
| Emergency support (outside business hours) | Not included |

---

### Tier 2 — Standard · USD 39 / month

Recommended for active, growing platforms.

| Service | Included |
|---|---|
| Everything in Tier 1 | Yes |
| Bug fixes — minor | Unlimited |
| Minor feature updates (up to 10 development hours/month) | Yes |
| Content updates (text, images, pricing changes) | Up to 5 per month |
| Database backup verification (monthly) | Yes |
| Third-party service monitoring (Brevo, Tranzak, etc.) | Yes |
| Response time | Within 12 hours |
| Emergency support | 1 incident/month included |

---

### Tier 3 — Premium · USD 59 / month

Full-service ongoing development and operations partner.

| Service | Included |
|---|---|
| Everything in Tier 2 | Yes |
| Minor and major feature updates (up to 20 development hours/month) | Yes |
| Content updates | Unlimited |
| Performance optimization (quarterly audit) | Yes |
| New page / service additions | Yes (within hour allocation) |
| Priority support — all issues treated as urgent | Yes |
| Monthly progress report and recommendations | Yes |
| Response time | Within 4 hours |
| Emergency support | Unlimited |
| Dedicated WhatsApp support line | Yes |

---

## 2. Selected Plan

The Client has selected: **Tier \_\_\_ — USD \_\_\_ / month**

*(Circle or initial the selected tier above)*

---

## 3. Payment Terms

- Maintenance fee is billed monthly, in advance, on the 1st of each month
- Payment is due within 7 days of invoice
- Accepted payment methods: bank transfer, mobile money (MTN / Orange), or Tranzak
- Late payment (beyond 14 days) may result in suspension of non-critical support services
- If payment is not received within 30 days, the Developer reserves the right to suspend maintenance activities until the account is brought current

---

## 4. What is Covered

Maintenance covers the platform as delivered and described in Part B. It includes:

- The five applications (`web`, `portal`, `partner`, `admin`, `api`)
- The server configuration and PM2 / Caddy setup
- Integrations with third-party services already connected (see Part A, Section 5)

---

## 5. What is Not Covered

The following are outside the scope of this maintenance agreement and will be quoted separately:

- New modules or features beyond the hourly allocations in the selected tier
- Third-party service subscription costs (Neon, Brevo, Tranzak, etc. — the Client pays these directly)
- Domain registration and renewal fees (managed by the Client via Namecheap)
- VPS hosting costs (managed by the Client via Hostinger)
- Legal compliance advisory (data protection, licensing disclaimers)
- Content creation (articles, course material, marketing copy)

---

## 6. Response Time & Communication

All support requests must be submitted via:

- **Primary:** Email to the designated Digos Technologies support address
- **Tier 3 only:** Dedicated WhatsApp support line

Response time commitments apply during business hours (Monday–Friday, 08:00–18:00 WAT) except where emergency coverage is included in the selected tier.

---

## 7. Term & Termination

- This agreement runs month-to-month with no minimum commitment
- Either party may terminate with **30 days written notice**
- Upon termination, the Developer will provide a final handover session and all relevant access credentials
- Outstanding invoices remain due regardless of termination

---

## 8. Confidentiality

Both parties agree to keep confidential:

- Server credentials and environment variables
- Client business data and candidate information
- Pricing terms in this agreement

This obligation survives termination of the agreement.

---

## 9. Limitation of Liability

The Developer's total liability under this maintenance agreement shall not exceed three (3) months of the applicable monthly fee. The Developer is not liable for:

- Downtime caused by third-party service outages (Neon, Hostinger, Cloudflare, etc.)
- Data loss caused by the Client's own actions or third-party failures
- Losses arising from regulatory decisions, exam outcomes, or visa decisions

---

## 10. Governing Law & Dispute Resolution

This agreement is governed by the laws of the **Republic of Cameroon**. Any dispute that cannot be resolved amicably within 30 days shall be referred to the competent courts of Yaoundé, Cameroon.

---

## 11. Signatures

By signing below, both parties agree to the terms of this Maintenance & Support Agreement.

**For MJN Health Academy and Professional Services LTD:**

Signature: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
Title: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
Stamp: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

**For Digos Technologies:**

Signature: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
Title: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
Stamp: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

*End of Document — MJN Health Academy and Professional Services LTD / Digos Technologies — Ref: DT-MJN-2026-001*
