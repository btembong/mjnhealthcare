import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { CatalogService } from '../catalog/catalog.service';
import { ReferralService } from '../referral/referral.service';
import { CreditService } from '../referral/credit.service';

const ENGAGEMENT_FEE_ITEM_ID = 'engagement-fee';
const TAX_RATE = 0.0325; // 3.25%

export type CartLineInput = { serviceItemId: string; variantKey?: string };
export type PaymentModeType = 'FULL' | 'INSTALLMENT' | 'PAY_PER_STAGE';

export type InstallmentConfig = {
  firstPercent: number;           // e.g. 50 → pay 50% now
  triggerStageId?: string;        // stage completion triggers 2nd payment
  dueDate?: Date;                 // or fixed date for 2nd payment
};

@Injectable()
export class OrderService {
  constructor(
    private readonly db: DatabaseService,
    private readonly catalogService: CatalogService,
    private readonly events: EventEmitter2,
    @Optional() private readonly referralService?: ReferralService,
    @Optional() private readonly creditService?: CreditService,
  ) {}

  // ── Pipeline order ────────────────────────────────────────────────────────

  async createOrder(
    engagementId: string,
    lines: CartLineInput[],
    paymentMode: PaymentModeType = 'FULL',
    installmentConfig?: InstallmentConfig,
    waiveEngagementFee = false,
  ): Promise<any> {
    const engagement: any = await this.db.engagement.findUniqueOrThrow({
      where: { id: engagementId },
    });
    if (engagement.status === 'PENDING_SIGNATURE') {
      throw new BadRequestException('Engagement letter must be signed before checkout');
    }

    // Auto-waive $50 engagement fee if client came via paid consultation route
    if (!waiveEngagementFee) {
      const hasPaidConsultation = await (this.db as any).consultationBooking.count({
        where: { personId: engagement.personId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      });
      if (hasPaidConsultation > 0) waiveEngagementFee = true;
    }
    if (paymentMode === 'PAY_PER_STAGE') {
      throw new BadRequestException(
        'Use createServicePlan() to set up PAY_PER_STAGE — stage orders are created automatically as stages advance',
      );
    }

    // ── Duplicate payment guard ────────────────────────────────────────────
    // Reject if any requested serviceItemId already exists on a PAID order
    // for this engagement, or if a PENDING order is still in flight.
    const existingOrders: any[] = await (this.db.order as any).findMany({
      where: { engagementId, status: { in: ['PAID', 'PENDING'] } },
      include: { lineItems: { select: { serviceItemId: true } } },
    });

    const pendingOrder = existingOrders.find((o) => o.status === 'PENDING');
    if (pendingOrder) {
      throw new BadRequestException(
        'A payment is already in progress for this engagement. Complete or cancel it before starting a new order.',
      );
    }

    const paidItemIds = new Set<string>(
      existingOrders
        .filter((o) => o.status === 'PAID')
        .flatMap((o) => o.lineItems.map((li: any) => li.serviceItemId as string)),
    );

    // Engagement fee is charged once — remove from new order if already paid
    const hasPaidEngagementFee = paidItemIds.has(ENGAGEMENT_FEE_ITEM_ID);
    const deduplicatedLines = lines.filter((l) => {
      if (paidItemIds.has(l.serviceItemId)) return false;
      return true;
    });

    if (deduplicatedLines.length === 0) {
      throw new BadRequestException(
        'All selected services have already been paid for on this engagement.',
      );
    }

    const baseLines = (hasPaidEngagementFee || waiveEngagementFee)
      ? deduplicatedLines
      : [{ serviceItemId: ENGAGEMENT_FEE_ITEM_ID }, ...deduplicatedLines];

    const allLines = baseLines;
    const { resolvedLines, subtotal } = await this.resolveLines(allLines);
    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount;

    const amountDueNow =
      paymentMode === 'INSTALLMENT' && installmentConfig
        ? parseFloat(((installmentConfig.firstPercent / 100) * total).toFixed(2))
        : null;

    const order: any = await (this.db.order as any).create({
      data: {
        orderType: 'pipeline',
        paymentMode,
        engagementId,
        amountDueNow,
        taxRate: TAX_RATE,
        taxAmount,
        subtotal,
        total,
        status: 'PENDING',
        lineItems: { create: resolvedLines },
      },
      include: { lineItems: { include: { serviceItem: true } } },
    });

    if (paymentMode === 'INSTALLMENT' && installmentConfig && amountDueNow !== null) {
      const secondAmount = parseFloat((total - amountDueNow).toFixed(2));
      await (this.db.installmentSchedule as any).create({
        data: {
          orderId: order.id,
          installmentNo: 2,
          amount: secondAmount,
          dueDate: installmentConfig.dueDate ?? null,
          triggerStageId: installmentConfig.triggerStageId ?? null,
          status: 'PENDING',
        },
      });
    }

    return order;
  }

  // ── Service plan setup (PAY_PER_STAGE) ───────────────────────────────────

  async createServicePlan(
    engagementId: string,
    stages: { stageId: string; lines: CartLineInput[] }[],
  ): Promise<any> {
    const engagement: any = await this.db.engagement.findUniqueOrThrow({
      where: { id: engagementId },
    });
    if (engagement.status === 'PENDING_SIGNATURE') {
      throw new BadRequestException('Engagement letter must be signed first');
    }

    // Resolve prices for every stage line upfront so client sees full breakdown
    const planEntries: any[] = [];
    for (const stage of stages) {
      for (const line of stage.lines) {
        const price = await this.catalogService.resolvePrice(line.serviceItemId, line.variantKey);
        planEntries.push({
          engagementId,
          stageId: stage.stageId,
          serviceItemId: line.serviceItemId,
          variantKey: line.variantKey ?? null,
          priceUsd: price,
          status: 'PENDING',
        });
      }
    }

    // Delete any existing plan and recreate
    await (this.db.engagementServicePlan as any).deleteMany({ where: { engagementId } });
    await (this.db.engagementServicePlan as any).createMany({ data: planEntries });

    // Update engagement paymentMode
    await (this.db.engagement as any).update({
      where: { id: engagementId },
      data: { paymentMode: 'PAY_PER_STAGE' },
    });

    // Create and charge the initiation fee immediately (stage 1 trigger creates the real stage order)
    const feePrice = await this.catalogService.resolvePrice(ENGAGEMENT_FEE_ITEM_ID);
    const feeOrder: any = await (this.db.order as any).create({
      data: {
        orderType: 'pipeline',
        paymentMode: 'PAY_PER_STAGE',
        engagementId,
        taxRate: TAX_RATE,
        taxAmount: 0,
        subtotal: feePrice,
        total: feePrice,
        status: 'PENDING',
        lineItems: { create: [{ serviceItemId: ENGAGEMENT_FEE_ITEM_ID, priceCharged: feePrice }] },
      },
      include: { lineItems: { include: { serviceItem: true } } },
    });

    return {
      plan: planEntries,
      feeOrder,
      totalAgreed: planEntries.reduce((sum: number, e: any) => sum + Number(e.priceUsd), 0) + feePrice,
    };
  }

  // ── Stage order (called by LicensingService on stage advance) ────────────

  async createStageOrder(engagementId: string, stageId: string): Promise<any> {
    const planItems: any[] = await (this.db.engagementServicePlan as any).findMany({
      where: { engagementId, stageId, status: 'PENDING' },
    });

    if (!planItems.length) return null; // stage has no associated services

    const resolvedLines = planItems.map((item: any) => ({
      serviceItemId: item.serviceItemId,
      variantId: null,
      priceCharged: Number(item.priceUsd),
    }));

    const subtotal = resolvedLines.reduce((s, l) => s + Number(l.priceCharged), 0);
    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount;

    const order: any = await (this.db.order as any).create({
      data: {
        orderType: 'pipeline',
        paymentMode: 'PAY_PER_STAGE',
        engagementId,
        stageId,
        taxRate: TAX_RATE,
        taxAmount,
        subtotal,
        total,
        status: 'PENDING',
        lineItems: { create: resolvedLines },
      },
      include: { lineItems: { include: { serviceItem: true } } },
    });

    // Mark plan items as invoiced
    await (this.db.engagementServicePlan as any).updateMany({
      where: { engagementId, stageId, status: 'PENDING' },
      data: { status: 'INVOICED' },
    });

    // Get person details for notification
    const engagement: any = await this.db.engagement.findUnique({
      where: { id: engagementId },
      include: { person: true },
    });

    this.events.emit('payment.installment_due', {
      orderId: order.id,
      email: engagement?.person?.email,
      phone: engagement?.person?.phone,
      personName: engagement?.person?.name,
      amount: total,
      stageName: stageId,
    });

    return order;
  }

  // ── Standalone order (à la carte) ────────────────────────────────────────

  async createStandaloneOrder(data: {
    personId: string;
    lines: CartLineInput[];
    tosAcceptedAt: Date;
    tosIpAddress: string;
  }): Promise<any> {
    for (const line of data.lines) {
      const item: any = await this.db.serviceItem.findUniqueOrThrow({ where: { id: line.serviceItemId } });
      if (!item.isAvailableStandalone) {
        throw new BadRequestException(`"${item.name}" is not available for standalone purchase`);
      }
    }

    const allLines = [{ serviceItemId: ENGAGEMENT_FEE_ITEM_ID }, ...data.lines];
    const { resolvedLines, subtotal } = await this.resolveLines(allLines);
    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount;

    const order: any = await (this.db.order as any).create({
      data: {
        orderType: 'standalone',
        paymentMode: 'FULL',
        personId: data.personId,
        tosAcceptedAt: data.tosAcceptedAt,
        tosIpAddress: data.tosIpAddress,
        taxRate: TAX_RATE,
        taxAmount,
        subtotal,
        total,
        status: 'PENDING',
        lineItems: { create: resolvedLines },
      },
      include: { lineItems: { include: { serviceItem: true } } },
    });

    this.events.emit('order.standalone_created', { orderId: order.id, personId: data.personId });
    return order;
  }

  // ── Mark paid ─────────────────────────────────────────────────────────────

  async markPaid(orderId: string): Promise<any> {
    const order: any = await (this.db.order as any).update({
      where: { id: orderId },
      data: { status: 'PAID' },
      include: {
        lineItems: { include: { serviceItem: { include: { category: true } } } },
        person: true,
        engagement: { include: { person: true } },
      },
    });

    const person = order.person ?? order.engagement?.person;
    if (!person) throw new BadRequestException('No person linked to this order');

    const snapshot = {
      orderId: order.id,
      orderType: order.orderType,
      paymentMode: order.paymentMode,
      engagementId: order.engagementId ?? null,
      stageId: order.stageId ?? null,
      issuedAt: new Date().toISOString(),
      person: { id: person.id, name: person.name, email: person.email },
      lineItems: order.lineItems.map((li: any) => ({
        name: li.serviceItem.name,
        category: li.serviceItem.category?.name ?? '',
        priceCharged: Number(li.priceCharged),
      })),
      amountDueNow: order.amountDueNow ? Number(order.amountDueNow) : null,
      subtotal: Number(order.subtotal),
      taxRate: Number(order.taxRate),
      taxAmount: Number(order.taxAmount),
      total: Number(order.total),
    };

    const receipt = await this.db.receipt.create({ data: { orderId, snapshot } });

    this.events.emit('payment.completed', {
      orderId,
      receiptId: receipt.id,
      orderType: order.orderType,
      paymentMode: order.paymentMode,
      person: { name: person.name, email: person.email, phone: person.phone },
      engagement: order.engagement,
    });

    // Trigger referral reward on first payment by this person
    if (this.referralService && person.id) {
      this.referralService.rewardOnFirstPayment(person.id, orderId).catch(() => {});
    }

    // For PAY_PER_STAGE — mark plan items as paid
    if (order.orderType === 'pipeline' && order.paymentMode === 'PAY_PER_STAGE' && order.stageId) {
      await (this.db.engagementServicePlan as any).updateMany({
        where: { engagementId: order.engagementId, stageId: order.stageId, status: 'INVOICED' },
        data: { status: 'PAID' },
      });
    }

    // Flag standalone clients for consultant follow-up
    if (order.orderType === 'standalone') {
      this.events.emit('order.standalone_paid', {
        orderId,
        personId: person.id,
        personName: person.name,
        email: person.email,
        services: order.lineItems.map((li: any) => li.serviceItem.name),
      });
    }

    return { order, receipt };
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  async getOrder(id: string): Promise<any> {
    return this.db.order.findUnique({
      where: { id },
      include: {
        lineItems: { include: { serviceItem: true } },
        receipts: true,
        installmentSchedules: true,
      },
    });
  }

  async getOrdersByEngagement(engagementId: string): Promise<any> {
    return this.db.order.findMany({
      where: { engagementId },
      include: {
        lineItems: { include: { serviceItem: true } },
        receipts: true,
        installmentSchedules: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrdersByPerson(personId: string): Promise<any> {
    return (this.db.order as any).findMany({
      where: { OR: [{ personId }, { engagement: { personId } }] },
      include: { lineItems: { include: { serviceItem: true } }, receipts: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllOrders(): Promise<any> {
    return (this.db.order as any).findMany({
      include: {
        lineItems: { include: { serviceItem: true } },
        receipts: { select: { id: true, issuedAt: true } },
        engagement: { include: { person: { select: { id: true, name: true, email: true } } } },
        person: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getServicePlan(engagementId: string): Promise<any> {
    const plan: any[] = await (this.db.engagementServicePlan as any).findMany({
      where: { engagementId },
      include: { stage: { select: { id: true, label: true, order: true } } },
      orderBy: { stage: { order: 'asc' } },
    });

    // Group by stage and compute totals
    const byStage: Record<string, any> = {};
    for (const item of plan) {
      const key = item.stageId;
      if (!byStage[key]) {
        byStage[key] = { stage: item.stage, items: [], stageTotal: 0, status: item.status };
      }
      byStage[key].items.push(item);
      byStage[key].stageTotal += Number(item.priceUsd);
    }

    const stages = Object.values(byStage);
    const grandTotal = stages.reduce((s: number, st: any) => s + st.stageTotal, 0);
    return { stages, grandTotal };
  }

  // ── Cron: dunning — escalate overdue installments ────────────────────────

  // Thresholds (in days from invoicedAt): 7 → reminder, 14 → warning, 21 → hold
  private readonly DUNNING_STEPS = [
    { step: 1, days: 7 },
    { step: 2, days: 14 },
    { step: 3, days: 21 },
  ];

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async runDunning() {
    const invoiced: any[] = await (this.db.installmentSchedule as any).findMany({
      where: { status: 'INVOICED' },
      include: {
        order: {
          include: {
            engagement: { include: { person: true } },
            person: true,
          },
        },
      },
    });

    for (const schedule of invoiced) {
      if (!schedule.invoicedAt) continue;
      const person = schedule.order.person ?? schedule.order.engagement?.person;
      if (!person) continue;

      const daysSinceInvoiced = Math.floor(
        (Date.now() - new Date(schedule.invoicedAt).getTime()) / 86400000,
      );

      for (const { step, days } of this.DUNNING_STEPS) {
        if (daysSinceInvoiced >= days && schedule.dunningStep < step) {
          // Update dunning step
          await (this.db.installmentSchedule as any).update({
            where: { id: schedule.id },
            data: { dunningStep: step },
          });

          if (step < 3) {
            // Reminder (step 1) or warning (step 2)
            this.events.emit('payment.installment_overdue', {
              orderId: schedule.orderId,
              installmentScheduleId: schedule.id,
              installmentNo: schedule.installmentNo,
              amount: Number(schedule.amount),
              daysPastDue: daysSinceInvoiced,
              step,
              email: person.email,
              phone: person.phone,
              personName: person.name,
            });
          } else {
            // step 3: hold engagement
            const engagementId = schedule.order.engagementId;
            if (engagementId) {
              await this.db.engagement.update({
                where: { id: engagementId },
                data: { status: 'ON_HOLD' },
              });
              this.events.emit('engagement.on_hold', {
                engagementId,
                personId: person.id,
                email: person.email,
                phone: person.phone,
                personName: person.name,
                orderId: schedule.orderId,
                amount: Number(schedule.amount),
                daysPastDue: daysSinceInvoiced,
              });
            }
          }
          break; // Process one step at a time per schedule
        }
      }
    }
  }

  // ── Cron: check due installments daily ───────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkDueInstallments() {
    const due: any[] = await (this.db.installmentSchedule as any).findMany({
      where: { status: 'PENDING', dueDate: { lte: new Date() } },
      include: {
        order: {
          include: {
            engagement: { include: { person: true } },
            person: true,
          },
        },
      },
    });

    for (const schedule of due) {
      const person =
        schedule.order.person ?? schedule.order.engagement?.person;
      if (!person) continue;

      await (this.db.installmentSchedule as any).update({
        where: { id: schedule.id },
        data: { status: 'INVOICED', invoicedAt: new Date() },
      });

      this.events.emit('payment.installment_due', {
        orderId: schedule.orderId,
        installmentScheduleId: schedule.id,
        amount: Number(schedule.amount),
        installmentNo: schedule.installmentNo,
        email: person.email,
        phone: person.phone,
        personName: person.name,
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async resolveLines(lines: CartLineInput[]) {
    let subtotal = 0;
    const resolvedLines = await Promise.all(
      lines.map(async (line) => {
        const price = await this.catalogService.resolvePrice(line.serviceItemId, line.variantKey);
        subtotal += price;

        let variantId: string | null = null;
        if (line.variantKey) {
          const variant = await this.db.serviceItemVariant.findFirst({
            where: { serviceItemId: line.serviceItemId, variantKey: line.variantKey },
          });
          variantId = variant?.id ?? null;
        }

        return { serviceItemId: line.serviceItemId, variantId, priceCharged: price };
      }),
    );
    return { resolvedLines, subtotal };
  }
}
