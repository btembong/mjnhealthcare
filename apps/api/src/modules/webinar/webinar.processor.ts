import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bull';
import { DatabaseService } from '@mjn/database';
import { WEBINAR_QUEUE, WebinarService } from './webinar.service';

@Processor(WEBINAR_QUEUE)
export class WebinarProcessor {
  private readonly logger = new Logger(WebinarProcessor.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    private readonly webinars: WebinarService,
  ) {}

  /** Sent only if the webinar is still on, at the time this reminder was queued for. */
  @Process('reminder')
  async reminder(job: Job<{ webinarId: string; when: '24h' | '1h'; startAt: string }>) {
    const w = await this.db.webinar.findUnique({ where: { id: job.data.webinarId }, select: { status: true, startAt: true } });
    if (!w || w.status !== 'PUBLISHED' || w.startAt.getTime() !== new Date(job.data.startAt).getTime()) {
      this.logger.log(`Webinar ${job.data.webinarId} ${job.data.when} reminder skipped: moved, cancelled or already running`);
      return;
    }
    this.events.emit('webinar.reminder', { webinarId: job.data.webinarId, when: job.data.when });
  }

  @Process('recording')
  async recording(job: Job<{ webinarId: string; attempt: number }>) {
    try {
      const result = await this.webinars.checkRecording(job.data.webinarId, job.data.attempt);
      this.logger.log(`Webinar ${job.data.webinarId} recording check ${job.data.attempt}: ${result.status}`);
    } catch (err: any) {
      this.logger.error(`Webinar ${job.data.webinarId} recording check failed: ${err?.message ?? err}`);
    }
  }
}
