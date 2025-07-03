import { Module } from '@nestjs/common';
import { HivemindService } from './hivemind.service';
import { HivemindController } from './hivemind.controller';
import { NetworkApiController, HivemindApiController } from './controllers/network-api.controller';
import { HivemindWebSocketGateway } from './gateways/hivemind-websocket.gateway';
import { P2PNetworkService } from './services/p2p-network.service';
import { ContributionTrackerService } from './services/contribution-tracker.service';
import { DHTManagerService } from './services/dht-manager.service';
import { RewardDistributorService } from './services/reward-distributor.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [HivemindController, NetworkApiController, HivemindApiController],
  providers: [
    HivemindService,
    HivemindWebSocketGateway,
    P2PNetworkService,
    ContributionTrackerService,
    DHTManagerService,
    RewardDistributorService,
  ],
  exports: [HivemindService, P2PNetworkService, ContributionTrackerService, RewardDistributorService],
})
export class HivemindModule {}