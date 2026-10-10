import { StaffOnly, FinanceOnly, CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
import { Controller, Get, Post, Param, Body, UseGuards, Request, Ip, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderService, CartLineInput, PaymentModeType } from './order.service';
import { PdfService } from './pdf.service';

class CartLineDto implements CartLineInput {
  @IsString()
  serviceItemId!: string;

  @IsOptional()
  @IsString()
  variantKey?: string;
}

class InstallmentConfigDto {
  @IsNumber()
  @Min(1)
  @Max(99)
  firstPercent!: number;

  @IsOptional()
  @IsString()
  triggerStageId?: string;

  @IsOptional()
  dueDate?: Date;
}

class CreateOrderDto {
  @IsString()
  engagementId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  lines!: CartLineDto[];

  @IsOptional()
  @IsEnum(['FULL', 'INSTALLMENT'])
  paymentMode?: 'FULL' | 'INSTALLMENT';

  @IsOptional()
  @ValidateNested()
  @Type(() => InstallmentConfigDto)
  installmentConfig?: InstallmentConfigDto;

  @IsOptional()
  @IsBoolean()
  waiveEngagementFee?: boolean;
}

class StagePlanDto {
  @IsString()
  stageId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  lines!: CartLineDto[];
}

class CreateServicePlanDto {
  @IsString()
  engagementId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StagePlanDto)
  stages!: StagePlanDto[];
}

class CreateStandaloneOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  lines!: CartLineDto[];

  @IsBoolean()
  tosAccepted!: boolean;
}

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly pdfService: PdfService,
    private readonly access: AccessService,
  ) {}

  @ApiOperation({ summary: 'Create pipeline order — FULL or INSTALLMENT payment mode' })
  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    await this.access.assertEngagement(user, dto.engagementId);
    return this.orderService.createOrder(
      dto.engagementId,
      dto.lines,
      (dto.paymentMode as PaymentModeType) ?? 'FULL',
      dto.installmentConfig,
      dto.waiveEngagementFee ?? false,
    );
  }

  @ApiOperation({ summary: 'Set up PAY_PER_STAGE service plan — maps services to stages' })
  @StaffOnly()
  @Post('service-plan')
  async createServicePlan(@CurrentUser() user: AuthUser, @Body() dto: CreateServicePlanDto) {
    await this.access.assertEngagement(user, dto.engagementId);
    return this.orderService.createServicePlan(dto.engagementId, dto.stages);
  }

  @ApiOperation({ summary: 'Get the PAY_PER_STAGE service plan breakdown for an engagement' })
  @Get('service-plan/:engagementId')
  async getServicePlan(@CurrentUser() user: AuthUser, @Param('engagementId') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.orderService.getServicePlan(engagementId);
  }

  @ApiOperation({ summary: 'Create standalone à la carte order (TOS accepted, no engagement needed)' })
  @Post('standalone')
  createStandalone(
    @Body() dto: CreateStandaloneOrderDto,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    if (!dto.tosAccepted) {
      return { error: 'You must accept the Terms of Service to continue' };
    }
    return this.orderService.createStandaloneOrder({
      personId: req.user.id,
      lines: dto.lines,
      tosAcceptedAt: new Date(),
      tosIpAddress: ip,
    });
  }

  @ApiOperation({ summary: 'Get all orders (admin)' })
  @StaffOnly()
  @Get('admin')
  async findAll(@CurrentUser() user: AuthUser) {
    const orders = await this.orderService.getAllOrders();
    const scope = await this.access.consultantScope(user);
    if (!scope) return orders;
    return orders.filter((o: any) =>
      o.engagementId ? scope.canSeeEngagementId(o.engagementId) : scope.canSeePerson(o.personId),
    );
  }

  @ApiOperation({ summary: 'Get order by ID' })
  @Get(':id')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertOrder(user, id);
    return this.orderService.getOrder(id);
  }

  @ApiOperation({ summary: 'Mark order as paid (called by payment webhook handler)' })
  @FinanceOnly()
  @Post(':id/mark-paid')
  markPaid(@Param('id') id: string) {
    return this.orderService.markPaid(id);
  }

  @ApiOperation({ summary: 'Get all orders for an engagement' })
  @Get('engagement/:engagementId')
  async findByEngagement(@CurrentUser() user: AuthUser, @Param('engagementId') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.orderService.getOrdersByEngagement(engagementId);
  }

  @ApiOperation({ summary: 'Get all orders for a person (pipeline + standalone)' })
  @Get('person/:personId')
  async findByPerson(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.orderService.getOrdersByPerson(personId);
  }

  @ApiOperation({ summary: 'Download receipt PDF for an order' })
  @Get(':id/receipt/pdf')
  async downloadReceiptPdf(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res() res: Response) {
    await this.access.assertOrder(user, id);
    const order = await this.orderService.getOrder(id);
    if (!order) throw new NotFoundException('Order not found');
    const receipt = order.receipts?.[0];
    if (!receipt) throw new NotFoundException('Receipt not yet available for this order');

    const snap = receipt.snapshot as any;
    const pdfBuffer = await this.pdfService.generateReceiptPdf({
      orderId: snap.orderId ?? id,
      receiptId: receipt.id,
      issuedAt: snap.issuedAt ?? receipt.issuedAt,
      person: snap.person,
      lineItems: snap.lineItems ?? [],
      subtotal: Number(snap.subtotal ?? 0),
      taxRate: Number(snap.taxRate ?? 0),
      taxAmount: Number(snap.taxAmount ?? 0),
      total: Number(snap.total ?? 0),
      amountDueNow: snap.amountDueNow ?? null,
      paymentMode: snap.paymentMode,
    });

    const filename = `mjn-receipt-${id.slice(-8)}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
