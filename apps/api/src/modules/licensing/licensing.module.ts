import { Module, forwardRef } from '@nestjs/common';
import { LicensingService } from './licensing.service';
import { LicensingController } from './licensing.controller';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [forwardRef(() => OrderModule)],
  providers: [LicensingService],
  controllers: [LicensingController],
  exports: [LicensingService],
})
export class LicensingModule {}
