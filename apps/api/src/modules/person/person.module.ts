import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { LeadsController } from './leads.controller';
import { ConsultationModule } from '../consultation/consultation.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'booking-reminders' }),
    ConsultationModule, // for DailyCoService (free-consult video rooms)
  ],
  providers: [PersonService],
  controllers: [PersonController, LeadsController],
  exports: [PersonService],
})
export class PersonModule {}
