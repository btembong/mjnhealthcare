import { Module } from '@nestjs/common';
import { OfficerController } from './officer.controller';
import { OfficerService } from './officer.service';
import { EngagementModule } from '../engagement/engagement.module';

@Module({
  imports: [EngagementModule],
  controllers: [OfficerController],
  providers: [OfficerService],
  exports: [OfficerService],
})
export class OfficerModule {}
