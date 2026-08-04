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
  ) {}

  @ApiOperation({ summary: 'Create pipeline order — FULL or INSTALLMENT payment mode' })
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(
      dto.engagementId,
      dto.lines,
      (dto.paymentMode as PaymentModeType) ?? 'FULL',
      dto.installmentConfig,
      dto.waiveEngagementFee ?? false,
    );
  }

  @ApiOperation({ summary: 'Set up PAY_PER_STAGE service plan — maps services to stages' })
  @Post('service-plan')
  createServicePlan(@Body() dto: CreateServicePlanDto) {
    return this.orderService.createServicePlan(dto.engagementId, dto.stages);
  }

  @ApiOperation({ summary: 'Get the PAY_PER_STAGE service plan breakdown for an engagement' })
  @Get('service-plan/:engagementId')
  getServicePlan(@Param('engagementId') engagementId: string) {
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
  @Get('admin')
  findAll() {
    return this.orderService.getAllOrders();
  }

  @ApiOperation({ summary: 'Get order by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.getOrder(id);
  }

  @ApiOperation({ summary: 'Mark order as paid (called by payment webhook handler)' })
  @Post(':id/mark-paid')
  markPaid(@Param('id') id: string) {
    return this.orderService.markPaid(id);
  }

  @ApiOperation({ summary: 'Get all orders for an engagement' })
  @Get('engagement/:engagementId')
  findByEngagement(@Param('engagementId') engagementId: string) {
    return this.orderService.getOrdersByEngagement(engagementId);
  }

  @ApiOperation({ summary: 'Get all orders for a person (pipeline + standalone)' })
  @Get('person/:personId')
  findByPerson(@Param('personId') personId: string) {
    return this.orderService.getOrdersByPerson(personId);
  }

  @ApiOperation({ summary: 'Download receipt PDF for an order' })
  @Get(':id/receipt/pdf')
  async downloadReceiptPdf(@Param('id') id: string, @Res() res: Response) {
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
