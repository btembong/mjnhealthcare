import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PartnerService } from './partner.service';

@ApiTags('partners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('partners')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Get()
  getPartners(@Query('status') status?: string) {
    return this.partnerService.getPartners(status);
  }

  @Post()
  create(@Body() body: { name: string; type: string; contactEmail: string }) {
    return this.partnerService.createPartner(body);
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body() body: { verifiedBy: string }) {
    return this.partnerService.verify(id, body.verifiedBy);
  }

  @Post(':id/opportunities')
  postOpportunity(
    @Param('id') id: string,
    @Body() body: { title: string; country: string; profession: string; details: string },
  ) {
    return this.partnerService.postOpportunity(id, body);
  }
}
