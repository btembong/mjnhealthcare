import { FinanceOnly, AdminOnly, CurrentUser, AuthUser, isAdmin } from '../auth/access';
import {
  Controller, Get, Post, Param, Body, Query, Res, HttpCode, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentAdminService, PaymentKind } from './payment-admin.service';
import { PaymentSweepService } from './payment-sweep.service';
import { ManualPaymentService, ManualPaymentInput } from './manual-payment.service';

function kindOf(value: string): PaymentKind {
  if (value !== 'order' && value !== 'consultation') throw new BadRequestException('Unknown payment type.');
  return value;
}

/** Finance staff can look, check and export. Changing a payment is for admins. */
function adminOnly(user: AuthUser) {
  if (!isAdmin(user)) throw new ForbiddenException('Only an admin can change a payment.');
}

@Controller('admin/payments')
@FinanceOnly()
export class PaymentAdminController {
  constructor(
    private readonly service: PaymentAdminService,
    private readonly sweep: PaymentSweepService,
    private readonly manual: ManualPaymentService,
  ) {}

  @Get('stats')
  async getStats() {
    // With the totals: when the automatic check last ran, so the page can say it is working.
    return { ...(await this.service.summary()), autoCheck: this.sweep.status() };
  }

  @Get('export')
  async exportCsv(
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('kind') kind?: string,
    @Query('state') state?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const csv = await this.service.exportCsv({ search, kind, state, dateFrom, dateTo });
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="mjn-payments-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(`﻿${csv}`);
  }

  @Get()
  list(
    @Query('search') search?: string,
    @Query('kind') kind?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.list({ search, kind, dateFrom, dateTo });
  }

  // ── Money received by hand (orders) ──
  // Finance and admins record; only an admin confirms, which is when the client is told.

  @Post('order/:id/manual/proof-upload-url')
  @HttpCode(200)
  proofUploadUrl(@Param('id') id: string, @Body() body: { fileName: string }) {
    return this.manual.proofUploadUrl(id, String(body?.fileName ?? ''));
  }

  @Post('order/:id/manual')
  @HttpCode(200)
  recordManual(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: ManualPaymentInput) {
    return this.manual.record(user, id, body ?? ({} as ManualPaymentInput));
  }

  @AdminOnly()
  @Post('manual/:id/confirm')
  @HttpCode(200)
  confirmManual(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.manual.confirm(user, id);
  }

  @Post('manual/:id/void')
  @HttpCode(200)
  voidManual(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.manual.void(user, id, String(body?.reason ?? ''));
  }

  @Get('manual/:id/proof-url')
  proofUrl(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.manual.proofUrl(user, id);
  }

  @Get(':kind/:id')
  detail(@Param('kind') kind: string, @Param('id') id: string) {
    return this.service.detail(kindOf(kind), id);
  }

  @Post(':kind/:id/check')
  @HttpCode(200)
  check(@Param('kind') kind: string, @Param('id') id: string, @Body() body: { ref?: string }) {
    return this.service.check(kindOf(kind), id, body?.ref);
  }

  @AdminOnly()
  @Post(':kind/:id/record-paid')
  @HttpCode(200)
  recordPaid(@CurrentUser() user: AuthUser, @Param('kind') kind: string, @Param('id') id: string, @Body() body: { ref?: string; note?: string }) {
    adminOnly(user);
    return this.service.recordPaid(user, kindOf(kind), id, body ?? {});
  }

  @AdminOnly()
  @Post(':kind/:id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('kind') kind: string, @Param('id') id: string, @Body() body: { reason: string }) {
    adminOnly(user);
    return this.service.cancel(user, kindOf(kind), id, String(body?.reason ?? ''));
  }

  @AdminOnly()
  @Post('order/:id/refund')
  @HttpCode(200)
  refund(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { amount: number; reason: string; method: string }) {
    adminOnly(user);
    return this.service.recordRefund(user, id, body ?? ({} as any));
  }
}
