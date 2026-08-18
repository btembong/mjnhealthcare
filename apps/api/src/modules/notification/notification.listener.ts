import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { NotificationService } from './notification.service';
import { PdfService } from '../order/pdf.service';
import * as T from './email-templates';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly db: DatabaseService,
    private readonly pdfService: PdfService,
  ) {}

  // ── Order / payment ───────────────────────────────────────────────────────

  @OnEvent('payment.completed')
  async onPaymentCompleted(payload: {
    orderId: string;
    receiptId?: string;
    engagement?: { person: { name: string; email?: string | null; phone?: string | null } };
  }) {
    const person = payload.engagement?.person;
    if (!person) return;

    // Generate PDF receipt attachment
    let pdfAttachment: { name: string; content: Buffer } | undefined;
    try {
      if (payload.receiptId) {
        const receipt = await this.db.receipt.findUnique({ where: { id: payload.receiptId } });
        if (receipt?.snapshot) {
          const snap = receipt.snapshot as any;
          const pdfBuffer = await this.pdfService.generateReceiptPdf({
            orderId: snap.orderId ?? payload.orderId,
            receiptId: receipt.id,
            issuedAt: snap.issuedAt ?? new Date().toISOString(),
            person: snap.person,
            lineItems: snap.lineItems ?? [],
            subtotal: Number(snap.subtotal ?? 0),
            taxRate: Number(snap.taxRate ?? 0),
            taxAmount: Number(snap.taxAmount ?? 0),
            total: Number(snap.total ?? 0),
            amountDueNow: snap.amountDueNow ?? null,
            paymentMode: snap.paymentMode,
          });
          pdfAttachment = { name: `mjn-receipt-${payload.orderId.slice(-8)}.pdf`, content: pdfBuffer };
        }
      }
    } catch (err) {
      this.logger.warn(`Could not generate receipt PDF for order ${payload.orderId}: ${err}`);
    }

    if (person.email) {
      await this.notificationService.sendEmail(
        person.email,
        'Payment Confirmed — MJN Healthcare',
        T.tplPaymentConfirmed({ name: person.name, receiptId: payload.receiptId ?? 'N/A', orderId: payload.orderId }),
        person.name,
        pdfAttachment ? [pdfAttachment] : undefined,
      );
    }
    if (person.phone) {
      await this.notificationService.sendWhatsApp(
        person.phone,
        `MJN Healthcare: Payment confirmed ✓ Your engagement is now active. Receipt: ${payload.receiptId ?? 'N/A'}. Log in at ${process.env.PORTAL_URL ?? 'http://localhost:3002'}`,
      );
    }
    this.logger.log(`Payment confirmed notifications sent for order ${payload.orderId}`);
  }

  @OnEvent('payment.installment_due')
  async onInstallmentDue(payload: {
    orderId: string; amount?: number; phone?: string; email?: string; personName?: string;
  }) {
    const amount = payload.amount ?? 0;
    if (payload.email) {
      await this.notificationService.sendEmail(
        payload.email,
        'Instalment Payment Due — MJN Healthcare',
        T.tplInstallmentDue({ name: payload.personName ?? 'Client', orderId: payload.orderId, amount }),
        payload.personName,
      );
    }
    if (payload.phone) {
      await this.notificationService.sendWhatsApp(
        payload.phone,
        `MJN Healthcare: Your instalment payment of $${amount.toFixed(2)} is due. Pay at ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/payments`,
      );
    }
  }

  @OnEvent('payment.installment_overdue')
  async onInstallmentOverdue(payload: {
    orderId: string; installmentScheduleId: string; installmentNo: number;
    amount: number; daysPastDue: number; step: number;
    email?: string; phone?: string; personName?: string;
  }) {
    const isWarning = payload.step >= 2;
    const daysUntilHold = Math.max(0, 21 - payload.daysPastDue);

    if (payload.email) {
      await this.notificationService.sendEmail(
        payload.email,
        isWarning
          ? `Urgent: Payment ${payload.daysPastDue} Days Overdue — MJN Healthcare`
          : `Reminder: Instalment Payment Overdue — MJN Healthcare`,
        T.tplInstallmentOverdue({
          name: payload.personName ?? 'Client',
          orderId: payload.orderId,
          amount: payload.amount,
          daysPastDue: payload.daysPastDue,
          daysUntilHold,
          isWarning,
        }),
        payload.personName,
      );
    }
    if (payload.phone) {
      const sms = isWarning
        ? `MJN Healthcare ⚠: Your payment of $${payload.amount.toFixed(2)} is ${payload.daysPastDue} days overdue. Engagement holds in ${daysUntilHold} days. Pay now: ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/payments`
        : `MJN Healthcare: Reminder — instalment of $${payload.amount.toFixed(2)} is ${payload.daysPastDue} days overdue. Pay at ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/payments`;
      await this.notificationService.sendWhatsApp(payload.phone, sms);
    }
    this.logger.warn(`Dunning step ${payload.step} sent for order ${payload.orderId} (${payload.daysPastDue}d overdue)`);
  }

  @OnEvent('engagement.on_hold')
  async onEngagementHeld(payload: {
    engagementId: string; personId: string;
    email?: string; phone?: string; personName?: string;
    orderId: string; amount: number; daysPastDue: number;
  }) {
    if (payload.email) {
      await this.notificationService.sendEmail(
        payload.email,
        'Your Engagement Has Been Placed On Hold — MJN Healthcare',
        T.tplEngagementOnHold({
          name: payload.personName ?? 'Client',
          engagementId: payload.engagementId,
          orderId: payload.orderId,
          amount: payload.amount,
          daysPastDue: payload.daysPastDue,
        }),
        payload.personName,
      );
    }
    if (payload.phone) {
      await this.notificationService.sendWhatsApp(
        payload.phone,
        `MJN Healthcare: Your engagement is ON HOLD — overdue payment of $${payload.amount.toFixed(2)}. Pay immediately at ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/payments to reinstate.`,
      );
    }

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL ?? 'hello@mjnhealthcare.com';
    await this.notificationService.sendEmail(
      adminEmail,
      `Engagement On Hold — ${payload.personName ?? payload.personId}`,
      T.shell(
        T.h1(`Engagement Placed On Hold`) +
        T.p(`Engagement <strong>${payload.engagementId}</strong> for <strong>${payload.personName ?? payload.personId}</strong> was automatically placed on hold after ${payload.daysPastDue} days of non-payment.`) +
        T.infoTable([
          T.row('Person', payload.personName ?? payload.personId),
          T.row('Amount', `$${payload.amount.toFixed(2)}`),
          T.row('Order', payload.orderId),
          T.row('Days overdue', `${payload.daysPastDue} days`, true),
        ]) +
        T.btn('Review in Admin Console', `${process.env.ADMIN_URL ?? 'http://localhost:3004'}/caseload`),
      ),
    );

    this.logger.warn(`Engagement ${payload.engagementId} placed on hold — dunning day ${payload.daysPastDue}`);
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  @OnEvent('document.expiring_soon')
  async onDocumentExpiring(payload: { personId: string; documentId: string; daysLeft: number; documentType?: string }) {
    const person = await this.db.person.findUnique({ where: { id: payload.personId } });
    if (!person) return;

    if (person.email) {
      await this.notificationService.sendEmail(
        person.email,
        `Document Expiring in ${payload.daysLeft} Days — MJN Healthcare`,
        T.tplDocumentExpiring({ name: person.name ?? 'Client', daysLeft: payload.daysLeft, documentType: payload.documentType }),
        person.name,
      );
    }
    if (person.phone) {
      await this.notificationService.sendWhatsApp(
        person.phone,
        `MJN Healthcare: One of your documents expires in ${payload.daysLeft} day${payload.daysLeft !== 1 ? 's' : ''}. Upload a renewal at ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/documents`,
      );
    }
  }

  @OnEvent('document.officer_sent')
  async onOfficerSentDocument(payload: { personId: string; documentId: string; documentType: string; officerNote?: string }) {
    const person = await this.db.person.findUnique({ where: { id: payload.personId } });
    if (!person) return;
    const portalUrl = process.env.PORTAL_URL ?? 'http://localhost:3002';
    const note = payload.officerNote ? ` Note from officer: "${payload.officerNote}"` : '';
    if (person.email) {
      await this.notificationService.sendEmail(
        person.email,
        `Action Required: Form to Complete — MJN Healthcare`,
        `<p>Dear ${person.name ?? 'Client'},</p><p>Your processing officer has sent you a blank form that needs to be completed and returned. The form type is: <strong>${payload.documentType}</strong>.${note ? `</p><p>${note}` : ''}</p><p>Please log in to your portal to download, complete, and return the form.</p><p><a href="${portalUrl}/documents">View & Return Form →</a></p>`,
        person.name,
      );
    }
    if (person.phone) {
      await this.notificationService.sendWhatsApp(
        person.phone,
        `MJN Healthcare: Action required — your officer has sent a form (${payload.documentType}) for you to complete and return.${note} Log in: ${portalUrl}/documents`,
      );
    }
  }

  @OnEvent('document.client_returned')
  async onClientReturnedDocument(payload: { personId: string; documentId: string; documentType: string; officerId?: string; engagementId?: string }) {
    if (!payload.officerId) return;
    const officer = await this.db.person.findUnique({ where: { id: payload.officerId } });
    if (!officer?.email) return;
    const adminUrl = process.env.ADMIN_URL ?? 'http://localhost:3004';
    await this.notificationService.sendEmail(
      officer.email,
      `Form Returned by Client — MJN Healthcare`,
      `<p>Dear ${officer.name ?? 'Officer'},</p><p>A client has returned the completed form for: <strong>${payload.documentType}</strong>. Please review it in your case queue.</p><p><a href="${adminUrl}/officer/caseload">Review Now →</a></p>`,
      officer.name,
    );
  }

  // ── Licensing ─────────────────────────────────────────────────────────────

  @OnEvent('licensing_stage.changed')
  async onStageChanged(payload: { progressId: string; stage: { label: string }; personId?: string }) {
    if (!payload.personId) return;
    const person = await this.db.person.findUnique({ where: { id: payload.personId } });
    if (!person) return;

    if (person.email) {
      await this.notificationService.sendEmail(
        person.email,
        `Licensing Update: ${payload.stage.label} — MJN Healthcare`,
        T.tplLicensingStageChanged({ name: person.name ?? 'Client', stageLabel: payload.stage.label }),
        person.name,
      );
    }
    if (person.phone) {
      await this.notificationService.sendWhatsApp(
        person.phone,
        `MJN Healthcare: Your licensing case has advanced to "${payload.stage.label}". Log in for details: ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/case`,
      );
    }
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  @OnEvent('booking.reminder_due')
  async onBookingReminder(payload: { bookingId: string; personId: string; slotStart?: string; type?: string }) {
    const person = await this.db.person.findUnique({ where: { id: payload.personId } });
    if (!person) return;

    const sessionType = payload.type ?? 'session';
    const slotDisplay = payload.slotStart
      ? new Date(payload.slotStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) + ' WAT'
      : 'soon';

    if (person.email) {
      await this.notificationService.sendEmail(
        person.email,
        `Session Reminder — MJN Healthcare`,
        T.tplSessionReminder({ name: person.name ?? 'Client', sessionType, slotStart: slotDisplay }),
        person.name,
      );
    }
    if (person.phone) {
      await this.notificationService.sendWhatsApp(
        person.phone,
        `MJN Healthcare: Reminder — your ${sessionType} starts at ${slotDisplay}. Join via your portal: ${process.env.PORTAL_URL ?? 'http://localhost:3002'}`,
      );
    }
  }

  // ── Lead capture ─────────────────────────────────────────────────────────

  @OnEvent('lead.created')
  async onLeadCreated(payload: {
    name: string; email: string; phone?: string | null;
    profession?: string | null; destination?: string | null;
    serviceInterest?: string | null; notes?: string | null; source: string;
  }) {
    const isLibrary = payload.serviceInterest === 'library';

    // Extract resource title from notes: "Requested free resource: \"Title\""
    const resourceTitle = isLibrary && payload.notes
      ? (payload.notes.match(/^Requested free resource:\s*"?(.+?)"?\s*$/) ?? [])[1] ?? payload.notes
      : null;

    const clientEmail = isLibrary && resourceTitle
      ? this.notificationService.sendEmail(
          payload.email,
          `Your free resource from MJN Healthcare — "${resourceTitle}"`,
          T.tplLibraryResourceDelivery({ name: payload.name, resourceTitle }),
          payload.name,
        )
      : this.notificationService.sendEmail(
          payload.email,
          'We\'ve received your enquiry — MJN Healthcare',
          T.tplLeadAcknowledgement({ name: payload.name }),
          payload.name,
        );

    await Promise.allSettled([
      this.notificationService.sendEmail(
        process.env.ADMIN_EMAIL ?? 'hello@mjnhealthcare.com',
        isLibrary
          ? `Library download — ${payload.name} (${resourceTitle ?? 'unknown resource'})`
          : `New Lead — ${payload.name} (${payload.source})`,
        T.tplLeadNewAdmin(payload),
      ),
      clientEmail,
    ]);
    this.logger.log(`Lead email sent to ${payload.email} (${isLibrary ? `library: ${resourceTitle}` : payload.source}), admin notified`);
  }

  @OnEvent('lead.assigned')
  async onLeadAssigned(payload: {
    consultantEmail: string; consultantName: string;
    leadName: string; leadEmail: string; leadPhone?: string | null;
    leadProfession?: string | null; leadDestination?: string | null; leadNotes?: string | null;
  }) {
    await this.notificationService.sendEmail(
      payload.consultantEmail,
      `New lead assigned to you — ${payload.leadName}`,
      T.tplLeadAssignedConsultant(payload),
      payload.consultantName,
    );
    this.logger.log(`Consultant ${payload.consultantEmail} notified of lead assignment: ${payload.leadName}`);
  }

  @OnEvent('lead.converted')
  async onLeadConverted(payload: { name: string; email: string }) {
    await this.notificationService.sendEmail(
      payload.email,
      'Your MJN Healthcare portal is ready — log in now',
      T.tplLeadConvertedInvite({ name: payload.name, email: payload.email }),
      payload.name,
    );
    this.logger.log(`Portal invite sent to converted lead: ${payload.email}`);
  }

  @OnEvent('lead.stale_alert')
  async onLeadStaleAlert(payload: {
    newLeads: { name: string; email: string; daysOld: number }[];
    contactedLeads: { name: string; email: string; daysOld: number }[];
  }) {
    if (!payload.newLeads.length && !payload.contactedLeads.length) return;
    await this.notificationService.sendEmail(
      process.env.ADMIN_EMAIL ?? 'hello@mjnhealthcare.com',
      `Stale Leads Alert — ${payload.newLeads.length + payload.contactedLeads.length} leads need follow-up`,
      T.tplStaleLeadsAdmin(payload),
    );
    this.logger.log(`Stale leads alert sent: ${payload.newLeads.length} new, ${payload.contactedLeads.length} contacted`);
  }

  // ── Lead consultations ────────────────────────────────────────────────────

  @OnEvent('lead.consultation_booked')
  async onConsultationBooked(payload: {
    leadId: string; name: string; email: string;
    phone?: string | null; profession?: string | null;
    destination?: string | null; slotStart: string;
  }) {
    await Promise.allSettled([
      this.notificationService.sendEmail(
        payload.email,
        'Your Free Consultation Is Booked — MJN Healthcare',
        T.tplLeadConsultationBooked({ name: payload.name, slotStart: payload.slotStart }),
        payload.name,
      ),
      this.notificationService.sendEmail(
        process.env.ADMIN_EMAIL ?? 'hello@mjnhealthcare.com',
        `New Lead Consultation — ${payload.name}`,
        T.tplLeadConsultationBookedAdmin({
          name: payload.name, email: payload.email, phone: payload.phone,
          profession: payload.profession, destination: payload.destination, slotStart: payload.slotStart,
        }),
      ),
    ]);
    this.logger.log(`Consultation booked notifications sent for lead ${payload.leadId}`);
  }

  // ── Consultation (paid sessions) ──────────────────────────────────────────

  @OnEvent('consultation.initiated')
  async onConsultationInitiated(payload: {
    bookingId: string; clientName: string; clientEmail: string; clientPhone: string;
    consultantName: string; sessionStart: string; amountUsd: number; paymentUrl?: string;
  }) {
    const sessionTime = new Date(payload.sessionStart).toLocaleString('en-GB', {
      timeZone: 'Africa/Douala', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });
    await Promise.allSettled([
      this.notificationService.sendEmail(
        payload.clientEmail,
        'Booking Received — Complete Your Payment — MJN Healthcare',
        T.tplConsultationInitiated({
          bookingId: payload.bookingId,
          clientName: payload.clientName,
          consultantName: payload.consultantName,
          sessionStart: payload.sessionStart,
          amountUsd: payload.amountUsd,
          paymentUrl: payload.paymentUrl,
        }),
        payload.clientName,
      ),
      this.notificationService.sendWhatsApp(
        payload.clientPhone,
        `MJN Healthcare: Booking received — ${payload.consultantName} on ${sessionTime} WAT ($${payload.amountUsd}). Complete payment to confirm. Ref: ${payload.bookingId}`,
      ),
    ]);
    this.logger.log(`Consultation initiated notifications sent for booking ${payload.bookingId}`);
  }

  @OnEvent('consultation.confirmed')
  async onConsultationConfirmed(payload: {
    bookingId: string; clientName: string; clientEmail: string; clientPhone: string;
    consultantName: string; sessionStart: string; durationMins: number;
    roomUrl: string; category: string; recordingConsent: boolean;
  }) {
    const categoryLabel = payload.category === 'HEALTH' ? 'Health Advice' : 'Career & Licensing';
    const sessionTime = new Date(payload.sessionStart).toLocaleString('en-GB', {
      timeZone: 'Africa/Douala', weekday: 'long', year: 'numeric',
      month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    await Promise.all([
      this.notificationService.sendEmail(
        payload.clientEmail,
        `Consultation Confirmed — ${sessionTime} WAT — MJN Healthcare`,
        T.tplConsultationConfirmed({
          bookingId: payload.bookingId,
          clientName: payload.clientName,
          consultantName: payload.consultantName,
          sessionStart: payload.sessionStart,
          durationMins: payload.durationMins,
          roomUrl: payload.roomUrl,
          categoryLabel,
          recordingConsent: payload.recordingConsent,
        }),
        payload.clientName,
      ),
      this.notificationService.sendWhatsApp(
        payload.clientPhone,
        `MJN Healthcare: ✓ ${categoryLabel} consultation confirmed with ${payload.consultantName} — ${sessionTime} WAT.\n\nJoin link: ${payload.roomUrl}\n\nReminders will be sent 24h and 1h before.`,
      ),
    ]);
    this.logger.log(`Consultation confirmed notifications sent for booking ${payload.bookingId}`);
  }

  @OnEvent('consultation.cancelled')
  async onConsultationCancelled(payload: {
    bookingId: string; clientName: string; clientEmail: string; clientPhone: string;
    refundAmount: number; refundPercent: number; reason: string;
  }) {
    const refundMsg = payload.refundAmount > 0
      ? `Refund of $${payload.refundAmount.toFixed(2)} (${payload.refundPercent}%) will be processed in 5–7 business days.`
      : 'No refund applicable (cancelled less than 4 hours before session).';

    await Promise.all([
      this.notificationService.sendEmail(
        payload.clientEmail,
        'Consultation Cancelled — MJN Healthcare',
        T.tplConsultationCancelled({
          clientName: payload.clientName,
          refundAmount: payload.refundAmount,
          refundPercent: payload.refundPercent,
          reason: payload.reason,
        }),
        payload.clientName,
      ),
      this.notificationService.sendWhatsApp(
        payload.clientPhone,
        `MJN Healthcare: Your consultation has been cancelled. ${refundMsg}`,
      ),
    ]);
  }

  @OnEvent('consultation.payment_failed')
  async onConsultationPaymentFailed(payload: {
    bookingId: string; clientName: string; clientEmail: string; clientPhone: string;
    consultantName: string; amountUsd: number; failReason: string; sessionStart: string;
  }) {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'hello@mjnhealthcare.com';
    await this.notificationService.sendEmail(
      adminEmail,
      `Payment Failed — ${payload.clientName} ($${payload.amountUsd.toFixed(2)})`,
      T.tplConsultationPaymentFailed({
        clientName: payload.clientName,
        clientEmail: payload.clientEmail,
        clientPhone: payload.clientPhone,
        consultantName: payload.consultantName,
        amountUsd: payload.amountUsd,
        failReason: payload.failReason,
        sessionStart: payload.sessionStart,
        bookingId: payload.bookingId,
      }),
      'MJN Admin',
    );
  }

  @OnEvent('consultant.application.reviewed')
  async onApplicationReviewed(payload: {
    applicationId: string; decision: string;
    applicantEmail: string; applicantName: string; reviewNote?: string;
  }) {
    const approved = payload.decision === 'APPROVED';
    await this.notificationService.sendEmail(
      payload.applicantEmail,
      approved
        ? 'Your MJN Healthcare Consultant Application — Approved'
        : 'Your MJN Healthcare Consultant Application — Update',
      T.tplApplicationReviewed({ applicantName: payload.applicantName, approved, reviewNote: payload.reviewNote }),
      payload.applicantName,
    );
  }

  // ── Processing Officer events ─────────────────────────────────────────────

  @OnEvent('officer.client_update_sent')
  async onOfficerClientUpdate(payload: {
    engagementId: string; authorId: string;
    clientName: string; clientEmail?: string | null; clientPhone?: string | null;
    content: string;
  }) {
    if (payload.clientEmail) {
      await this.notificationService.sendEmail(
        payload.clientEmail,
        'Case Update from MJN Healthcare',
        T.shell(
          T.h1('Update on Your Case') +
          T.p(`Hello ${payload.clientName},`) +
          T.p(payload.content) +
          T.btn('View Your Case', `${process.env.PORTAL_URL ?? 'http://localhost:3002'}/case`),
        ),
        payload.clientName,
      );
    }
    if (payload.clientPhone) {
      await this.notificationService.sendWhatsApp(
        payload.clientPhone,
        `MJN Healthcare case update: ${payload.content.slice(0, 200)}${payload.content.length > 200 ? '…' : ''} — Log in for details: ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/case`,
      );
    }
    this.logger.log(`Officer client update sent for engagement ${payload.engagementId}`);
  }

  @OnEvent('officer.assigned')
  async onOfficerAssigned(payload: {
    engagementId: string; officerId: string;
    officerEmail?: string | null; officerName?: string | null; officerPhone?: string | null;
    clientName: string;
  }) {
    if (!payload.officerEmail) return;
    await this.notificationService.sendEmail(
      payload.officerEmail,
      'New Case Assigned to You — MJN Healthcare',
      T.shell(
        T.h1('New Case Assigned') +
        T.p(`Hello ${payload.officerName ?? 'Officer'},`) +
        T.p(`A new case for <strong>${payload.clientName}</strong> has been assigned to you for processing.`) +
        T.btn('View Case in Admin Console', `${process.env.ADMIN_URL ?? 'http://localhost:3004'}/officer/caseload`),
      ),
      payload.officerName ?? undefined,
    );
    if (payload.officerPhone) {
      await this.notificationService.sendWhatsApp(
        payload.officerPhone,
        `MJN Healthcare: A new case (${payload.clientName}) has been assigned to you. Log in to review: ${process.env.ADMIN_URL ?? 'http://localhost:3004'}/officer/caseload`,
      );
    }
    this.logger.log(`Officer ${payload.officerEmail} notified of case assignment for ${payload.clientName}`);
  }

  @OnEvent('case.escalated')
  async onCaseEscalated(payload: {
    escalationId: string; engagementId: string;
    officerId: string; consultantId: string; reason: string;
  }) {
    const [consultant, officer] = await Promise.all([
      this.db.person.findUnique({ where: { id: payload.consultantId }, select: { name: true, email: true, phone: true } }),
      this.db.person.findUnique({ where: { id: payload.officerId }, select: { name: true } }),
    ]);
    if (!consultant?.email) return;

    await this.notificationService.sendEmail(
      consultant.email,
      'Case Escalated to You — Action Required — MJN Healthcare',
      T.shell(
        T.h1('Case Escalated to You') +
        T.p(`Hello ${consultant.name ?? 'Consultant'},`) +
        T.p(`Processing officer <strong>${officer?.name ?? 'an officer'}</strong> has escalated a case to you.`) +
        T.infoTable([
          T.row('Reason', payload.reason),
          T.row('Escalation ID', payload.escalationId),
        ]) +
        T.btn('Review in Admin Console', `${process.env.ADMIN_URL ?? 'http://localhost:3004'}/escalations`),
      ),
      consultant.name ?? undefined,
    );
    if (consultant.phone) {
      await this.notificationService.sendWhatsApp(
        consultant.phone,
        `MJN Healthcare: A case has been escalated to you by ${officer?.name ?? 'an officer'}. Reason: ${payload.reason}. Review: ${process.env.ADMIN_URL ?? 'http://localhost:3004'}/escalations`,
      );
    }
    this.logger.log(`Consultant ${consultant.email} notified of escalation ${payload.escalationId}`);
  }

  @OnEvent('case.escalation_resolved')
  async onEscalationResolved(payload: {
    escalationId: string;
    officerEmail?: string | null; officerName?: string | null; officerPhone?: string | null;
    clientName: string; resolution: string;
  }) {
    if (!payload.officerEmail) return;
    await this.notificationService.sendEmail(
      payload.officerEmail,
      'Escalation Resolved — MJN Healthcare',
      T.shell(
        T.h1('Your Escalation Has Been Resolved') +
        T.p(`Hello ${payload.officerName ?? 'Officer'},`) +
        T.p(`The escalation for case <strong>${payload.clientName}</strong> has been resolved by the consultant.`) +
        T.infoTable([T.row('Resolution', payload.resolution)]) +
        T.btn('View Escalations', `${process.env.ADMIN_URL ?? 'http://localhost:3004'}/officer/escalations`),
      ),
      payload.officerName ?? undefined,
    );
    if (payload.officerPhone) {
      await this.notificationService.sendWhatsApp(
        payload.officerPhone,
        `MJN Healthcare: Your escalation for ${payload.clientName} has been resolved. Resolution: ${payload.resolution}`,
      );
    }
    this.logger.log(`Officer ${payload.officerEmail} notified of escalation resolution ${payload.escalationId}`);
  }

  // ── Engagement ────────────────────────────────────────────────────────────

  // ── Staffing / Job applications ───────────────────────────────────────────

  @OnEvent('application.submitted')
  async onApplicationSubmitted(payload: {
    applicationId: string; personId: string; opportunityId: string;
  }) {
    try {
      const [person, opportunity] = await Promise.all([
        this.db.person.findUnique({ where: { id: payload.personId } }),
        this.db.opportunity.findUnique({ where: { id: payload.opportunityId }, include: { partner: { select: { name: true } } } }),
      ]);
      if (!person || !opportunity) return;

      const adminEmail = process.env.ADMIN_EMAIL ?? 'hello@mjnhealthcare.com';
      await this.notificationService.sendEmail(
        adminEmail,
        `New Application — ${person.name} for ${opportunity.title}`,
        T.tplApplicationSubmittedAdmin({
          applicantName: person.name ?? 'Candidate',
          applicantEmail: person.email ?? '',
          applicantPhone: person.phone,
          opportunityTitle: opportunity.title,
          opportunityCountry: opportunity.country ?? '',
          applicationId: payload.applicationId,
        }),
      );
      this.logger.log(`Application submitted notification sent for application ${payload.applicationId}`);
    } catch (err) {
      this.logger.error(`Failed to send application.submitted notification: ${err}`);
    }
  }

  @OnEvent('application.status_changed')
  async onApplicationStatusChanged(payload: {
    applicationId: string; status: string; notes?: string;
    personId: string; personName?: string | null; personEmail?: string | null; personPhone?: string | null;
    opportunityTitle?: string; opportunityCountry?: string;
  }) {
    // Only notify candidate on meaningful status changes (not SUBMITTED — they already know)
    const notifyStatuses = ['SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED', 'WITHDRAWN'];
    if (!notifyStatuses.includes(payload.status)) return;

    try {
      if (payload.personEmail) {
        await this.notificationService.sendEmail(
          payload.personEmail,
          `Application Update: ${payload.status.charAt(0) + payload.status.slice(1).toLowerCase()} — MJN Healthcare`,
          T.tplApplicationStatusChanged({
            applicantName: payload.personName ?? 'Candidate',
            status: payload.status,
            opportunityTitle: payload.opportunityTitle ?? 'Job Opportunity',
            opportunityCountry: payload.opportunityCountry ?? '',
            notes: payload.notes,
          }),
          payload.personName ?? undefined,
        );
      }
      if (payload.personPhone && ['OFFERED', 'SHORTLISTED'].includes(payload.status)) {
        const msgMap: Record<string, string> = {
          SHORTLISTED: `MJN Healthcare: Great news — you have been shortlisted for ${payload.opportunityTitle ?? 'a job opportunity'}. Log in for details: ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/opportunities`,
          OFFERED: `MJN Healthcare: 🎉 An offer has been extended for ${payload.opportunityTitle ?? 'a position'}. Log in to your portal to review it: ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/opportunities`,
        };
        await this.notificationService.sendWhatsApp(payload.personPhone, msgMap[payload.status]);
      }
      this.logger.log(`Application status_changed (${payload.status}) notification sent for application ${payload.applicationId}`);
    } catch (err) {
      this.logger.error(`Failed to send application.status_changed notification: ${err}`);
    }
  }

  // ── Engagement ────────────────────────────────────────────────────────────

  @OnEvent('engagement.checklist_sent')
  async onChecklistSent(payload: {
    personName: string; personEmail: string | null;
    pathway: string; regulatoryBody: string; country: string;
    items: { label: string; note?: string }[];
  }) {
    if (!payload.personEmail) return;
    await this.notificationService.sendEmail(
      payload.personEmail,
      `Your Document Checklist — ${payload.pathway} — MJN Healthcare`,
      T.tplDocumentChecklist({
        name: payload.personName,
        pathway: payload.pathway,
        regulatoryBody: payload.regulatoryBody,
        country: payload.country,
        items: payload.items,
      }),
      payload.personName,
    );
    this.logger.log(`Document checklist email sent to ${payload.personEmail} — ${payload.pathway}`);
  }

  @OnEvent('engagement.sign_requested')
  async onSignRequested(payload: {
    engagementId: string;
    personName: string;
    personEmail: string;
    personPhone: string;
    signUrl: string;
  }) {
    if (payload.personEmail) {
      await this.notificationService.sendEmail(
        payload.personEmail,
        'Action Required — Sign Your Engagement Letter | MJN Healthcare',
        T.tplEngagementSignRequest({ name: payload.personName ?? 'Client', signUrl: payload.signUrl }),
        payload.personName,
      );
    }
    if (payload.personPhone) {
      await this.notificationService.sendWhatsApp(
        payload.personPhone,
        `MJN Healthcare: Your engagement letter is ready to sign. Please sign it to activate your case: ${payload.signUrl}`,
      );
    }
  }

  @OnEvent('engagement.letter_signed')
  async onLetterSigned(payload: { engagementId: string; personId: string }) {
    const person = await this.db.person.findUnique({ where: { id: payload.personId } });
    if (!person) return;

    if (person.email) {
      await this.notificationService.sendEmail(
        person.email,
        'Engagement Confirmed — MJN Healthcare',
        T.tplEngagementLetterSigned({ name: person.name ?? 'Client' }),
        person.name,
      );
    }
    if (person.phone) {
      await this.notificationService.sendWhatsApp(
        person.phone,
        `MJN Healthcare: Your engagement letter is signed and your case is now active. A consultant will be in touch shortly. Log in: ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/case`,
      );
    }
  }

  // ── Officer update pending approval ───────────────────────────────────────

  @OnEvent('officer.update_pending_approval')
  async onUpdatePendingApproval(payload: {
    noteId: string;
    engagementId: string;
    authorId: string;
    content: string;
    clientName: string;
    consultantId?: string | null;
  }) {
    if (!payload.consultantId) return;

    const consultant = await this.db.person.findUnique({
      where: { id: payload.consultantId },
      select: { name: true, email: true, phone: true },
    });
    if (!consultant) return;

    const adminUrl = process.env.ADMIN_URL ?? 'http://localhost:3004';

    if (consultant.email) {
      await this.notificationService.sendEmail(
        consultant.email,
        `Action required: Officer update needs your approval`,
        `<p>Hi ${consultant.name ?? 'Consultant'},</p>
<p>A processing officer has drafted a sensitive client update for <strong>${payload.clientName}</strong> that requires your approval before it is sent.</p>
<blockquote style="border-left:4px solid #0F4C81;padding:8px 16px;background:#f5f5f5;">${payload.content}</blockquote>
<p><a href="${adminUrl}/approvals" style="background:#0F4C81;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Review &amp; Approve</a></p>`,
      );
    }

    this.logger.log(`Pending approval notification sent to consultant ${payload.consultantId} for note ${payload.noteId}`);
  }
}
