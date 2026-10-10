import { CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
import { Controller, Post, Param, Body, Headers, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService, PaymentProvider } from './payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly access: AccessService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('initiate/:orderId')
  async initiate(@CurrentUser() user: AuthUser, 
    @Param('orderId') orderId: string,
    @Body() body: { phone?: string; email?: string; provider?: PaymentProvider },
  ) {
    await this.access.assertOrder(user, orderId);
    return this.paymentService.initiatePayment(
      orderId,
      body.phone,
      body.email,
      body.provider ?? 'tranzak',
    );
  }

  @Post('webhook/tranzak')
  tranzakWebhook(
    @Req() req: Request,
    @Body() payload: unknown,
    @Headers('x-tranzak-signature') sig: string,
  ) {
    const rawBody: Buffer = (req as any).rawBody ?? Buffer.from(JSON.stringify(payload));
    return this.paymentService.handleWebhook('tranzak', rawBody, payload, sig);
  }

  @Post('webhook/stripe')
  stripeWebhook(
    @Req() req: Request,
    @Body() payload: unknown,
    @Headers('stripe-signature') sig: string,
  ) {
    const rawBody: Buffer = (req as any).rawBody ?? Buffer.from(JSON.stringify(payload));
    return this.paymentService.handleWebhook('stripe', rawBody, payload, sig);
  }
}
