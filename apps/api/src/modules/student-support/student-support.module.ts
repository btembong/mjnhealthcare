import { Module } from '@nestjs/common';
import { StudentSupportService } from './student-support.service';
import { StudentSupportController } from './student-support.controller';

@Module({
  providers: [StudentSupportService],
  controllers: [StudentSupportController],
  exports: [StudentSupportService],
})
export class StudentSupportModule {}
