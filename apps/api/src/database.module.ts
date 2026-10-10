import { Global, Module } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';
import { AccessService } from './modules/auth/access.service';

@Global()
@Module({
  providers: [DatabaseService, AccessService],
  exports: [DatabaseService, AccessService],
})
export class DatabaseModule {}
