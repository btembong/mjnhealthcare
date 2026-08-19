import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('admin')
  getAdminReports() {
    return this.reportsService.getAdminReports();
  }

  @Get('finance')
  getFinanceDashboard() {
    return this.reportsService.getFinanceDashboard();
  }

  @Get('finance/receipts')
  async getBulkReceipts(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.getBulkReceipts({ dateFrom, dateTo });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="receipts.csv"');
    return res.send(csv);
  }

  @Get('finance/tax-export')
  async getTaxExport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.getTaxExport({ dateFrom, dateTo });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tax-export.csv"');
    return res.send(csv);
  }

  @Get('finance/payroll')
  getPayrollSummary(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.reportsService.getPayrollSummary({ dateFrom, dateTo });
  }
}
