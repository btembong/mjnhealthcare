import { Module } from '@nestjs/common';
import { StaffingService } from './staffing.service';
import { StaffingController } from './staffing.controller';

@Module({
  providers: [StaffingService],
  controllers: [StaffingController],
  exports: [StaffingService],
})
export class StaffingModule {}
