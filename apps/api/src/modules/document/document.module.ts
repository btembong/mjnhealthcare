import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DocumentExpiryJob } from './jobs/document-expiry.job';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'document-expiry' }), ComplianceModule],
  providers: [DocumentService, DocumentExpiryJob],
  controllers: [DocumentController],
  exports: [DocumentService],
})
export class DocumentModule {}
