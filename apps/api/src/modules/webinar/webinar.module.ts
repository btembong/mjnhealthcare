import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationModule } from '../notification/notification.module';
import { DailyCoService } from '../consultation/daily-co.service';
import { WEBINAR_QUEUE, WebinarService } from './webinar.service';
import { WebinarAdminController, WebinarPublicController } from './webinar.controller';
import { WebinarProcessor } from './webinar.processor';
import { WebinarListener } from './webinar.listener';
import { WebinarLiveService } from './webinar-live.service';

@Module({
  imports: [BullModule.registerQueue({ name: WEBINAR_QUEUE }), NotificationModule],
  // The admin routes are declared first so "webinars/admin" is never read as a public page.
  controllers: [WebinarAdminController, WebinarPublicController],
  providers: [WebinarService, WebinarLiveService, WebinarProcessor, WebinarListener, DailyCoService],
  exports: [WebinarService],
})
export class WebinarModule {}
