import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HivemindProxyController } from './hivemind-proxy.controller';
import { HivemindProxyService } from './hivemind-proxy.service';
import { HivemindSyncService } from './hivemind-sync.service';

@Module({
  imports: [HttpModule],
  controllers: [HivemindProxyController],
  providers: [HivemindProxyService, HivemindSyncService],
  exports: [HivemindProxyService],
})
export class HivemindProxyModule {}