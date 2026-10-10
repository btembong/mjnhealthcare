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
import { SurveyModule } from './modules/survey/survey.module';
import { PaymentAdminModule } from './modules/payment-admin/payment-admin.module';
import { OfficerModule } from './modules/officer/officer.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReferralModule } from './modules/referral/referral.module';
import { BlogModule } from './modules/blog/blog.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),

    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      useFactory: () => {
        const useLocal = !!process.env.REDIS_HOST;
        return {
          redis: useLocal
            ? {
                // Self-hosted Redis (VPS Docker container — no TLS, localhost only)
                host: process.env.REDIS_HOST ?? '127.0.0.1',
                port: Number(process.env.REDIS_PORT ?? 6379),
                password: process.env.REDIS_PASSWORD || undefined,
              }
            : {
                // Upstash fallback (cloud — TLS required, strip https:// scheme)
                host: (process.env.UPSTASH_REDIS_URL ?? '').replace(/^[a-z]+:\/\//i, '').replace(/[:/].*$/, ''),
                port: Number(process.env.UPSTASH_REDIS_PORT ?? 6379),
                password: process.env.UPSTASH_REDIS_TOKEN,
                tls: {},
              },
        };
      },
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
    SurveyModule,
    PaymentAdminModule,
    OfficerModule,
    ReportsModule,
    ReferralModule,
    BlogModule,
    PartnerModule,
    NotificationModule,
    ComplianceModule,
    AIModule,
  ],
})
export class AppModule {}
