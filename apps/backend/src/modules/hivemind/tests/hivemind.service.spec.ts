import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HivemindService } from '../hivemind.service';
import { P2PNetworkService } from '../services/p2p-network.service';
import { ContributionTrackerService } from '../services/contribution-tracker.service';
import { DHTManagerService } from '../services/dht-manager.service';
import { BlockchainService } from '../../blockchain/blockchain.service';

describe('HivemindService', () => {
  let service: HivemindService;
  let p2pNetworkService: jest.Mocked<P2PNetworkService>;
  let contributionTracker: jest.Mocked<ContributionTrackerService>;
  let dhtManager: jest.Mocked<DHTManagerService>;
  let blockchainService: jest.Mocked<BlockchainService>;

  beforeEach(async () => {
    const mockP2PNetworkService = {
      initialize: jest.fn(),
      registerNode: jest.fn(),
      notifyNode: jest.fn(),
      getActiveNodes: jest.fn(),
    };

    const mockContributionTracker = {
      recordContribution: jest.fn(),
    };

    const mockDHTManager = {
      initialize: jest.fn(),
    };

    const mockBlockchainService = {
      registerP2PNode: jest.fn(),
      submitDetailedContribution: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HivemindService,
        { provide: P2PNetworkService, useValue: mockP2PNetworkService },
        { provide: ContributionTrackerService, useValue: mockContributionTracker },
        { provide: DHTManagerService, useValue: mockDHTManager },
        { provide: BlockchainService, useValue: mockBlockchainService },
        EventEmitter2,
      ],
    }).compile();

    service = module.get<HivemindService>(HivemindService);
    p2pNetworkService = module.get(P2PNetworkService);
    contributionTracker = module.get(ContributionTrackerService);
    dhtManager = module.get(DHTManagerService);
    blockchainService = module.get(BlockchainService);
  });

  describe('initializeP2PNetwork', () => {
    it('should initialize P2P network and DHT successfully', async () => {
      p2pNetworkService.initialize.mockResolvedValue(undefined);
      dhtManager.initialize.mockResolvedValue(undefined);

      await service.initializeP2PNetwork(8080);

      expect(p2pNetworkService.initialize).toHaveBeenCalledWith(8080);
      expect(dhtManager.initialize).toHaveBeenCalled();
    });

    it('should throw error if P2P network initialization fails', async () => {
      const error = new Error('Network initialization failed');
      p2pNetworkService.initialize.mockRejectedValue(error);

      await expect(service.initializeP2PNetwork(8080)).rejects.toThrow(error);
    });
  });

  describe('registerNode', () => {
    it('should register node in P2P network and blockchain', async () => {
      const nodeData = {
        nodeId: 'test-node-1',
        address: '0x123',
        publicKey: 'public-key-123',
        computeCapacity: 1000,
        bandwidth: 100,
      };

      p2pNetworkService.registerNode.mockResolvedValue(undefined);
      blockchainService.registerP2PNode.mockResolvedValue({
        success: true,
        transactionHash: 'tx-hash',
        message: 'Success',
        data: {},
      });

      await service.registerNode(nodeData);

      expect(p2pNetworkService.registerNode).toHaveBeenCalledWith(nodeData);
      expect(blockchainService.registerP2PNode).toHaveBeenCalledWith(
        nodeData.nodeId,
        nodeData.publicKey,
        nodeData.computeCapacity,
        nodeData.bandwidth,
      );
    });

    it('should throw error if blockchain registration fails', async () => {
      const nodeData = {
        nodeId: 'test-node-1',
        address: '0x123',
        publicKey: 'public-key-123',
        computeCapacity: 1000,
        bandwidth: 100,
      };

      p2pNetworkService.registerNode.mockResolvedValue(undefined);
      const error = new Error('Blockchain registration failed');
      blockchainService.registerP2PNode.mockRejectedValue(error);

      await expect(service.registerNode(nodeData)).rejects.toThrow(error);
    });
  });

  describe('submitContribution', () => {
    it('should track contribution locally and submit to blockchain', async () => {
      const contribution = {
        sessionId: 1,
        participant: '0x123',
        computeTime: 3600,
        gradientQuality: 85,
        dataTransmitted: 1024,
        uptimeRatio: 95,
        timestamp: new Date(),
      };

      contributionTracker.recordContribution.mockResolvedValue(undefined);
      blockchainService.submitDetailedContribution.mockResolvedValue({
        success: true,
        transactionHash: 'tx-hash',
        message: 'Success',
        data: {},
      });

      await service.submitContribution(contribution);

      expect(contributionTracker.recordContribution).toHaveBeenCalledWith(contribution);
      expect(blockchainService.submitDetailedContribution).toHaveBeenCalledWith(
        contribution.sessionId,
        contribution.participant,
        contribution.computeTime,
        contribution.gradientQuality,
        contribution.dataTransmitted,
        contribution.uptimeRatio,
      );
    });
  });

  describe('getNetworkStats', () => {
    it('should return network statistics', async () => {
      const mockNodes = [
        {
          nodeId: 'node-1',
          address: '0x123',
          publicKey: 'key-1',
          computeCapacity: 1000,
          bandwidth: 100,
          reputationScore: 95,
          isActive: true,
          lastSeen: new Date(),
        },
        {
          nodeId: 'node-2',
          address: '0x456',
          publicKey: 'key-2',
          computeCapacity: 1500,
          bandwidth: 150,
          reputationScore: 88,
          isActive: true,
          lastSeen: new Date(),
        },
      ];

      p2pNetworkService.getActiveNodes.mockResolvedValue(mockNodes);

      const stats = await service.getNetworkStats();

      expect(stats).toEqual({
        totalNodes: 2,
        activeNodes: 2,
        totalComputePower: 2500,
        networkHealth: 100,
      });
    });

    it('should handle empty network', async () => {
      p2pNetworkService.getActiveNodes.mockResolvedValue([]);

      const stats = await service.getNetworkStats();

      expect(stats).toEqual({
        totalNodes: 0,
        activeNodes: 0,
        totalComputePower: 0,
        networkHealth: 0,
      });
    });
  });

  describe('startTrainingSession', () => {
    it('should notify all active nodes about training session', async () => {
      const sessionId = 1;
      const modelConfig = { type: 'bert', layers: 12 };
      const mockNodes = [
        { nodeId: 'node-1', address: '0x123' },
        { nodeId: 'node-2', address: '0x456' },
      ];

      p2pNetworkService.getActiveNodes.mockResolvedValue(mockNodes as any);
      p2pNetworkService.notifyNode.mockResolvedValue(undefined);

      await service.startTrainingSession(sessionId, modelConfig);

      expect(p2pNetworkService.notifyNode).toHaveBeenCalledTimes(2);
      expect(p2pNetworkService.notifyNode).toHaveBeenCalledWith('node-1', {
        type: 'TRAINING_SESSION_START',
        sessionId,
        modelConfig,
      });
      expect(p2pNetworkService.notifyNode).toHaveBeenCalledWith('node-2', {
        type: 'TRAINING_SESSION_START',
        sessionId,
        modelConfig,
      });
    });
  });

  describe('stopTrainingSession', () => {
    it('should notify all active nodes to stop training', async () => {
      const sessionId = 1;
      const mockNodes = [
        { nodeId: 'node-1', address: '0x123' },
        { nodeId: 'node-2', address: '0x456' },
      ];

      p2pNetworkService.getActiveNodes.mockResolvedValue(mockNodes as any);
      p2pNetworkService.notifyNode.mockResolvedValue(undefined);

      await service.stopTrainingSession(sessionId);

      expect(p2pNetworkService.notifyNode).toHaveBeenCalledTimes(2);
      expect(p2pNetworkService.notifyNode).toHaveBeenCalledWith('node-1', {
        type: 'TRAINING_SESSION_STOP',
        sessionId,
      });
      expect(p2pNetworkService.notifyNode).toHaveBeenCalledWith('node-2', {
        type: 'TRAINING_SESSION_STOP',
        sessionId,
      });
    });
  });
});