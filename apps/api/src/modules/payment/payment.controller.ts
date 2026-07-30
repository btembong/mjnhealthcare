import { Controller, Post, Param, Body, Headers, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('initiate/:orderId')
  initiate(
    @Param('orderId') orderId: string,
    @Body() body: { phone?: string; email?: string },
  ) {
    return this.paymentService.initiatePayment(orderId, body.phone, body.email);
  }

  @Post('webhook/tranzak')
  tranzakWebhook(@Req() req: Request, @Body() payload: unknown, @Headers('x-tranzak-signature') sig: string) {
    const rawBody: Buffer = (req as any).rawBody ?? Buffer.from(JSON.stringify(payload));
    return this.paymentService.handleWebhook('tranzak', rawBody, payload, sig);
  }
}
