import { Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { LeadsController } from './leads.controller';

@Module({
  providers: [PersonService],
  controllers: [PersonController, LeadsController],
  exports: [PersonService],
})
export class PersonModule {}
