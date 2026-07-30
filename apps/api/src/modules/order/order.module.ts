import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PdfService } from './pdf.service';
import { CatalogModule } from '../catalog/catalog.module';
import { LicensingModule } from '../licensing/licensing.module';

@Module({
  imports: [CatalogModule, forwardRef(() => LicensingModule)],
  providers: [OrderService, PdfService],
  controllers: [OrderController],
  exports: [OrderService, PdfService],
})
export class OrderModule {}
