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
}
