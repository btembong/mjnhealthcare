import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { OrderService } from '../order/order.service';

@Injectable()
export class LicensingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
  ) {}

  // ── Pathway management (admin/consultant) ───────────────────────────────────

  async getPathways(country?: string, profession?: string) {
    return this.db.licensingPathway.findMany({
      where: {
        ...(country ? { country } : {}),
        ...(profession ? { profession } : {}),
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  async createPathway(data: {
    country: string;
    regulatoryBody: string;
    profession?: string;
    stages: { label: string; description?: string; order: number; requiredDocs: string[] }[];
  }) {
    return this.db.licensingPathway.create({
      data: {
        country: data.country,
        regulatoryBody: data.regulatoryBody,
        profession: data.profession,
        stages: {
          create: data.stages.map((s) => ({
            label: s.label,
            description: s.description,
            order: s.order,
            requiredDocs: s.requiredDocs,
          })),
        },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  async deletePathway(id: string) {
    await this.db.licensingStage.deleteMany({ where: { pathwayId: id } });
    return this.db.licensingPathway.delete({ where: { id } });
  }

  // ── Client progress ─────────────────────────────────────────────────────────

  async getClientProgress(personId: string, engagementId: string) {
    return this.db.licensingProgress.findFirst({
      where: { personId, engagementId },
      include: { currentStage: { include: { pathway: true } } },
    });
  }

  async initProgress(personId: string, engagementId: string, pathwayId: string) {
    const firstStage = await this.db.licensingStage.findFirst({
      where: { pathwayId },
      orderBy: { order: 'asc' },
    });
    if (!firstStage) throw new Error('Pathway has no stages');

    return this.db.licensingProgress.create({
      data: { personId, engagementId, currentStageId: firstStage.id },
      include: { currentStage: true },
    });
  }

  async advanceStage(progressId: string, nextStageId: string, notes?: string) {
    const progress = await this.db.licensingProgress.update({
      where: { id: progressId },
      data: { currentStageId: nextStageId },
      include: {
        currentStage: true,
        engagement: true,
      },
    });

    this.events.emit('licensing_stage.changed', {
      progressId,
      stage: progress.currentStage,
      personId: progress.personId,
      notes,
    });

    // If the engagement uses PAY_PER_STAGE, auto-create invoice for this stage's services
    const engagement: any = progress.engagement;
    if (engagement?.paymentMode === 'PAY_PER_STAGE') {
      await this.orderService.createStageOrder(progress.engagementId, nextStageId);
    }

    return progress;
  }
}
