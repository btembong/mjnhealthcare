import { Module } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyController, PublicSurveyController, PortalSurveyController } from './survey.controller';

@Module({
  providers: [SurveyService],
  controllers: [SurveyController, PublicSurveyController, PortalSurveyController],
})
export class SurveyModule {}
