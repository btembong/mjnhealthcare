import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentAdminService } from './payment-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard)
export class PaymentAdminController {
  constructor(private readonly service: PaymentAdminService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('export')
  async exportCsv(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.service.exportCsv({ search, status, type, dateFrom, dateTo });
    res!.set('Content-Type', 'text/csv');
    res!.set(
      'Content-Disposition',
      `attachment; filename="mjn-payments-${Date.now()}.csv"`,
    );
    res!.send(csv);
  }

  @Get()
  listPayments(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.listPayments({ search, status, type, dateFrom, dateTo });
  }

  @Get(':ref')
  findOne(@Param('ref') ref: string) {
    return this.service.findByRef(ref);
  }

  @Post(':ref/verify-tranzak')
  verifyTranzak(@Param('ref') ref: string) {
    return this.service.verifyWithTranzak(ref);
  }

  @Post(':ref/validate')
  validate(
    @Param('ref') ref: string,
    @Body() body: { adminNote?: string },
  ) {
    return this.service.validatePayment(ref, body.adminNote);
  }

  @Post(':ref/cancel')
  cancel(
    @Param('ref') ref: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.service.cancelPayment(ref, body.reason, req.user?.sub ?? 'admin');
  }
}
