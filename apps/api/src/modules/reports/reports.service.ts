import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async getAdminReports() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Revenue from paid order line items
    const allReceipts = await this.db.receipt.findMany({
      include: { order: true },
      orderBy: { issuedAt: 'asc' },
    });

    const totalRevenue = allReceipts.reduce((s, r) => s + Number((r.order as any)?.total ?? 0), 0);
    const thisMonthRevenue = allReceipts
      .filter((r) => new Date(r.issuedAt) >= startOfMonth)
      .reduce((s, r) => s + Number((r.order as any)?.total ?? 0), 0);
    const lastMonthRevenue = allReceipts
      .filter((r) => new Date(r.issuedAt) >= startOfLastMonth && new Date(r.issuedAt) <= endOfLastMonth)
      .reduce((s, r) => s + Number((r.order as any)?.total ?? 0), 0);

    // Monthly revenue for last 6 months
    const monthly: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = d.toLocaleString('en-GB', { month: 'short' });
      const amount = allReceipts
        .filter((r) => new Date(r.issuedAt) >= d && new Date(r.issuedAt) <= end)
        .reduce((s, r) => s + Number((r.order as any)?.total ?? 0), 0);
      monthly.push({ month: label, amount });
    }

    // Pipeline
    const [leads, engagements, persons, practiceResults, completedEngagements] = await Promise.all([
      this.db.lead.count(),
      this.db.engagement.groupBy({ by: ['status'], _count: true }),
      this.db.person.count({ where: { role: 'CANDIDATE' } }),
      this.db.practiceResult.findMany({ select: { score: true, total: true } }),
      this.db.engagement.count({ where: { status: 'COMPLETED' } }),
    ]);

    const engMap: Record<string, number> = {};
    for (const e of engagements) engMap[e.status] = e._count;
    const activeCount = engMap['ACTIVE'] ?? 0;
    const onHoldCount = engMap['ON_HOLD'] ?? 0;
    const completedCount = engMap['COMPLETED'] ?? 0;
    const pendingSig = engMap['PENDING_SIGNATURE'] ?? 0;

    const totalEng = activeCount + onHoldCount + completedCount + pendingSig + (engMap['CANCELLED'] ?? 0);
    const conversionRate = totalEng > 0 ? Math.round((completedCount / totalEng) * 100) : 0;

    // Exam pass rate from practice results
    const totalAttempts = practiceResults.length;
    const passCount = practiceResults.filter((r) => r.total > 0 && r.score / r.total >= 0.6).length;
    const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

    // Clients by profession
    const profGroups = await this.db.person.groupBy({
      by: ['profession'],
      where: { role: 'CANDIDATE' },
      _count: true,
    });

    const byProfession = profGroups.map((g) => ({
      profession: g.profession ?? 'Unknown',
      count: g._count,
    }));

    // New clients this month
    const newThisMonth = await this.db.person.count({
      where: { role: 'CANDIDATE', createdAt: { gte: startOfMonth } },
    });

    // Placements by destination country (from completed engagements via licensing progress)
    const pathwayProgress = await this.db.licensingProgress.findMany({
      include: {
        currentStage: {
          include: { pathway: { select: { country: true } } },
        },
      },
    });

    const destMap: Record<string, number> = {};
    for (const p of pathwayProgress) {
      const c = (p as any).currentStage?.pathway?.country ?? 'Other';
      destMap[c] = (destMap[c] ?? 0) + 1;
    }
    const byDestination = Object.entries(destMap).map(([country, count]) => ({ country, count }));

    return {
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        thisMonth: Math.round(thisMonthRevenue * 100) / 100,
        lastMonth: Math.round(lastMonthRevenue * 100) / 100,
        monthly,
        byCategory: [],
      },
      placements: {
        total: completedCount,
        thisMonth: pathwayProgress.filter((p) => new Date(p.updatedAt) >= startOfMonth).length,
        byDestination,
        avgTimeToPlacementDays: 0,
      },
      exams: {
        passRate,
        byExam: [],
      },
      pipeline: {
        leads,
        pendingSignature: pendingSig,
        active: activeCount,
        onHold: onHoldCount,
        completed: completedCount,
        conversionRate,
      },
      clients: {
        total: persons,
        newThisMonth,
        byProfession,
      },
    };
  }

  async getFinanceDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // All orders + consultation bookings
    const [allOrders, pendingOrders, receipts, consultantPayouts, creditWallets, consultationBookings] = await Promise.all([
      this.db.order.findMany({
        include: {
          lineItems: { include: { serviceItem: { include: { category: true } } } },
          person: { select: { name: true, email: true } },
          engagement: { include: { person: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.order.findMany({
        where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
        include: {
          person: { select: { name: true, email: true } },
          engagement: { include: { person: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.db.receipt.findMany({ include: { order: true }, orderBy: { issuedAt: 'desc' } }),
      (this.db as any).consultantPayout?.findMany({
        where: { paidAt: null },
        include: { consultant: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
      this.db.creditWallet.findMany({ select: { balanceCents: true } }),
      this.db.consultationBooking.findMany({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        select: { amountPaid: true, createdAt: true },
      }),
    ]);

    const paidOrders = allOrders.filter((o) => o.status === 'PAID' || o.status === 'PARTIALLY_PAID');
    const orderRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
    const consultationRevenue = consultationBookings.reduce((s, b) => s + Number(b.amountPaid ?? 0), 0);
    const totalRevenue = orderRevenue + consultationRevenue;

    const orderRevenueThisMonth = paidOrders
      .filter((o) => new Date(o.createdAt) >= startOfMonth)
      .reduce((s, o) => s + Number(o.total), 0);
    const consultRevenueThisMonth = consultationBookings
      .filter((b) => new Date(b.createdAt) >= startOfMonth)
      .reduce((s, b) => s + Number(b.amountPaid ?? 0), 0);
    const thisMonthRevenue = orderRevenueThisMonth + consultRevenueThisMonth;

    const orderRevenueLastMonth = paidOrders
      .filter((o) => new Date(o.createdAt) >= startOfLastMonth && new Date(o.createdAt) <= endOfLastMonth)
      .reduce((s, o) => s + Number(o.total), 0);
    const consultRevenueLastMonth = consultationBookings
      .filter((b) => new Date(b.createdAt) >= startOfLastMonth && new Date(b.createdAt) <= endOfLastMonth)
      .reduce((s, b) => s + Number(b.amountPaid ?? 0), 0);
    const lastMonthRevenue = orderRevenueLastMonth + consultRevenueLastMonth;

    const totalOutstanding = pendingOrders.reduce((s, o) => s + Number(o.total), 0);

    // Overdue installments
    const overdueInstallments = await (this.db as any).installmentSchedule?.findMany({
      where: { paidAt: null, dueDate: { lt: now } },
      include: { order: { include: { person: true, engagement: { include: { person: true } } } } },
    }).catch(() => []);

    // Tax collected (sum of taxAmount on paid orders)
    const taxCollected = paidOrders.reduce((s, o) => s + Number((o as any).taxAmount ?? 0), 0);
    const taxThisMonth = paidOrders
      .filter((o) => new Date(o.createdAt) >= startOfMonth)
      .reduce((s, o) => s + Number((o as any).taxAmount ?? 0), 0);

    // Revenue by category
    const categoryMap: Record<string, number> = {};
    for (const order of paidOrders) {
      for (const li of order.lineItems as any[]) {
        const cat = li.serviceItem?.category?.name ?? 'Other';
        categoryMap[cat] = (categoryMap[cat] ?? 0) + Number(li.priceCharged);
      }
    }
    const byCategory = Object.entries(categoryMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly trend (12 months)
    const monthly: { month: string; revenue: number; tax: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const monthOrders = paidOrders.filter((o) => new Date(o.createdAt) >= d && new Date(o.createdAt) <= end);
      const monthConsults = consultationBookings.filter((b) => new Date(b.createdAt) >= d && new Date(b.createdAt) <= end);
      monthly.push({
        month: label,
        revenue: monthOrders.reduce((s, o) => s + Number(o.total), 0) + monthConsults.reduce((s, b) => s + Number(b.amountPaid ?? 0), 0),
        tax: monthOrders.reduce((s, o) => s + Number((o as any).taxAmount ?? 0), 0),
      });
    }

    // Credit liability
    const totalCreditLiabilityCents = creditWallets.reduce((s, w) => s + w.balanceCents, 0);

    // Unpaid consultant payouts
    const payoutQueueTotal = (consultantPayouts as any[]).reduce((s: number, p: any) => s + Number(p.netAmount ?? 0), 0);

    // Recent receipts
    const recentReceipts = receipts.slice(0, 20).map((r) => ({
      id: r.id,
      orderId: r.orderId,
      issuedAt: r.issuedAt,
      total: Number((r.order as any)?.total ?? 0),
    }));

    // Client ledger: per-person summary
    const personLedger: Record<string, { name: string; email: string; totalBilled: number; totalPaid: number; outstanding: number }> = {};
    for (const order of allOrders) {
      const person = order.person ?? order.engagement?.person;
      if (!person) continue;
      const key = (person as any).email ?? order.id;
      if (!personLedger[key]) {
        personLedger[key] = { name: (person as any).name ?? '—', email: (person as any).email ?? '—', totalBilled: 0, totalPaid: 0, outstanding: 0 };
      }
      const total = Number(order.total);
      personLedger[key].totalBilled += total;
      if (order.status === 'PAID') personLedger[key].totalPaid += total;
      if (order.status === 'PENDING' || order.status === 'PARTIALLY_PAID') personLedger[key].outstanding += total;
    }
    const clientLedger = Object.values(personLedger).sort((a, b) => b.totalBilled - a.totalBilled).slice(0, 50);

    return {
      summary: {
        totalRevenue,
        orderRevenue,
        consultationRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        totalOutstanding,
        taxCollected,
        taxThisMonth,
        totalCreditLiabilityCents,
        payoutQueueTotal,
      },
      byCategory,
      monthly,
      pendingOrders: pendingOrders.slice(0, 50).map((o) => ({
        id: o.id,
        total: Number(o.total),
        status: o.status,
        createdAt: o.createdAt,
        person: o.person ?? (o.engagement as any)?.person,
      })),
      overdueInstallments: (overdueInstallments as any[]).slice(0, 50),
      payoutQueue: (consultantPayouts as any[]).slice(0, 50),
      recentReceipts,
      clientLedger,
    };
  }
}
