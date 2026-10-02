import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { LeadsController } from './leads.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'booking-reminders' })],
  providers: [PersonService],
  controllers: [PersonController, LeadsController],
  exports: [PersonService],
})
export class PersonModule {}
