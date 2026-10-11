import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Job, Queue } from 'bull';

export const DOCUMENT_NOTICE_QUEUE = 'document-notices';

// Wait before telling the client, so a reviewer clearing several documents (or pressing Undo)
// produces one accurate email rather than one per click.
const DIGEST_DELAY_MS = 2 * 60 * 1000;
const QUEUE_TIMEOUT_MS = 5000;

type DigestJob = { personId: string; since: number };

/** Schedules one "your documents were reviewed" notice per client after a review session. */
@Injectable()
export class DocumentNoticeScheduler {
  private readonly logger = new Logger(DocumentNoticeScheduler.name);

  constructor(
    @InjectQueue(DOCUMENT_NOTICE_QUEUE) private readonly queue: Queue<DigestJob>,
    private readonly events: EventEmitter2,
  ) {}

  @OnEvent('document.reviewed')
  onDocumentReviewed(payload: { documentId: string; personId: string; status: string }) {
    const data: DigestJob = { personId: payload.personId, since: Date.now() - 5000 };
    let sentDirectly = false;

    // A job id per client: decisions made while one is already waiting join that same notice.
    const adding = this.queue.add('review-digest', data, {
      delay: DIGEST_DELAY_MS,
      jobId: `review-digest-${payload.personId}`,
      removeOnComplete: true,
      removeOnFail: true,
    });

    // If the queue cannot be reached, send now rather than lose the notice.
    const timer = setTimeout(() => {
      sentDirectly = true;
      this.logger.warn(`Queue slow for ${payload.personId}; sending document notice immediately`);
      this.events.emit('document.review_digest', data);
    }, QUEUE_TIMEOUT_MS);

    adding
      // If the queue answers late, the job is left in place: it may belong to earlier decisions,
      // and a repeated notice is better than a lost one.
      .then(() => clearTimeout(timer))
      .catch((err) => {
        clearTimeout(timer);
        if (sentDirectly) return;
        this.logger.error(`Could not queue document notice for ${payload.personId}: ${err?.message ?? err}`);
        this.events.emit('document.review_digest', data);
      });
  }
}

@Processor(DOCUMENT_NOTICE_QUEUE)
export class DocumentNoticeProcessor {
  constructor(private readonly events: EventEmitter2) {}

  @Process('review-digest')
  async handleDigest(job: Job<DigestJob>) {
    this.events.emit('document.review_digest', job.data);
  }
}
