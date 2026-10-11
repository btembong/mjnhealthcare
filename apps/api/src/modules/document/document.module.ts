import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DocumentExpiryJob } from './jobs/document-expiry.job';
import { ComplianceModule } from '../compliance/compliance.module';
import { DocumentNoticeScheduler, DocumentNoticeProcessor, DOCUMENT_NOTICE_QUEUE } from './document-notice.scheduler';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'document-expiry' }),
    BullModule.registerQueue({ name: DOCUMENT_NOTICE_QUEUE }),
    ComplianceModule,
  ],
  providers: [DocumentService, DocumentExpiryJob, DocumentNoticeScheduler, DocumentNoticeProcessor],
  controllers: [DocumentController],
  exports: [DocumentService],
})
export class DocumentModule {}
