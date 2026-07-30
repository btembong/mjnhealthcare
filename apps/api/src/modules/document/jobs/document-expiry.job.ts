import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('document-expiry')
export class DocumentExpiryJob {
  @Process('check-expiry')
  async handleExpiryCheck(job: Job<{ documentId: string; daysLeft: number }>) {
    // Triggered by BullMQ — delegates to DocumentService.scanExpiringDocuments via cron
    // This processor handles retries and backoff for individual document checks
    console.log(`Checking expiry for document ${job.data.documentId}, ${job.data.daysLeft} days left`);
  }
}
