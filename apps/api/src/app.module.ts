import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from './database.module';

import { PersonModule } from './modules/person/person.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { LicensingModule } from './modules/licensing/licensing.module';
import { StaffingModule } from './modules/staffing/staffing.module';
import { AcademyModule } from './modules/academy/academy.module';
import { StudentSupportModule } from './modules/student-support/student-support.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { DocumentModule } from './modules/document/document.module';
import { BookingModule } from './modules/booking/booking.module';
import { PartnerModule } from './modules/partner/partner.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AIModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { LeadModule } from './modules/lead/lead.module';
import { ConsultationModule } from './modules/consultation/consultation.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { CampaignModule } from './modules/campaign/campaign.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),

    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.UPSTASH_REDIS_URL,
          port: 6380,
          password: process.env.UPSTASH_REDIS_TOKEN,
          tls: {},
        },
      }),
    }),

    // Global providers
    DatabaseModule,

    // Domain modules
    AuthModule,
    PersonModule,
    EngagementModule,
    LicensingModule,
    StaffingModule,
    AcademyModule,
    StudentSupportModule,
    CatalogModule,
    OrderModule,
    PaymentModule,
    DocumentModule,
    BookingModule,
    LeadModule,
    ConsultationModule,
    MessagingModule,
    TicketModule,
    CampaignModule,
    PartnerModule,
    NotificationModule,
    ComplianceModule,
    AIModule,
  ],
})
export class AppModule {}
