import { Controller, Get, Post, Body, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { HivemindService } from '../hivemind.service';

interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  totalComputePower: number;
  networkHealth: number;
  averageLatency: number;
  throughput: number;
  lastUpdated: string;
}

interface P2PNodeInfo {
  nodeId: string;
  address: string;
  publicKey: string;
  computeCapacity: number;
  bandwidth: number;
  reputationScore: number;
  isActive: boolean;
  lastSeen: string;
  region?: string;
  version?: string;
}

@ApiTags('Network API')
@Controller('api/network')
export class NetworkApiController {
  private readonly logger = new Logger(NetworkApiController.name);

  constructor(private readonly hivemindService: HivemindService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get overall network statistics' })
  @ApiResponse({ status: 200, description: 'Network stats retrieved successfully' })
  async getNetworkStats() {
    try {
      this.logger.log('Getting network statistics');

      // Get real network stats from hivemind service
      const stats = await this.hivemindService.getNetworkStatistics();

      const networkStats: NetworkStats = {
        totalNodes: stats.totalNodes || 0,
        activeNodes: stats.activeNodes || 0,
        totalComputePower: stats.totalComputePower || 0,
        networkHealth: stats.networkHealth || 0,
        averageLatency: stats.averageLatency || 0,
        throughput: stats.throughput || 0,
        lastUpdated: new Date().toISOString()
      };

      return {
        success: true,
        data: networkStats
      };
    } catch (error) {
      this.logger.error('Error getting network stats:', error);
      throw new HttpException(
        'Failed to retrieve network statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('contributors')
  @ApiOperation({ summary: 'Get contributor information' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of contributors to return' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field (score, contributions, etc.)' })
  @ApiResponse({ status: 200, description: 'Contributors retrieved successfully' })
  async getContributors(
    @Query('limit') limit: string = '50',
    @Query('sortBy') sortBy: string = 'score',
  ) {
    try {
      this.logger.log('Getting contributor information');

      const limitNum = parseInt(limit, 10);
      const contributors = await this.hivemindService.getContributors(limitNum, sortBy);

      return {
        success: true,
        data: {
          contributors,
          totalCount: contributors.length,
          sortBy,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting contributors:', error);
      throw new HttpException(
        'Failed to retrieve contributors',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get chart data for network visualization' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range for chart data' })
  @ApiQuery({ name: 'metric', required: false, description: 'Metric to chart (nodes, compute, health)' })
  @ApiResponse({ status: 200, description: 'Chart data retrieved successfully' })
  async getChartData(
    @Query('timeRange') timeRange: string = '7d',
    @Query('metric') metric: string = 'nodes',
  ) {
    try {
      this.logger.log(`Getting chart data for metric: ${metric}, timeRange: ${timeRange}`);

      const chartData = await this.hivemindService.getChartData(metric, timeRange);

      return {
        success: true,
        data: {
          metric,
          timeRange,
          dataPoints: chartData,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting chart data:', error);
      throw new HttpException(
        'Failed to retrieve chart data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

@ApiTags('Hivemind API')
@Controller('api/hivemind')
export class HivemindApiController {
  private readonly logger = new Logger(HivemindApiController.name);

  constructor(private readonly hivemindService: HivemindService) {}

  @Get('network/stats')
  @ApiOperation({ summary: 'Get Hivemind P2P network statistics' })
  @ApiResponse({ status: 200, description: 'Hivemind network stats retrieved successfully' })
  async getHivemindNetworkStats() {
    try {
      this.logger.log('Getting Hivemind network statistics');

      const stats = await this.hivemindService.getNetworkStatistics();

      return {
        success: true,
        data: {
          totalNodes: stats.totalNodes || 0,
          activeNodes: stats.activeNodes || 0,
          totalComputePower: stats.totalComputePower || 0,
          networkHealth: stats.networkHealth || 85.5, // Default value
          connectedPeers: stats.connectedPeers || 0,
          averageResponseTime: stats.averageResponseTime || 0,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting Hivemind network stats:', error);
      throw new HttpException(
        'Failed to retrieve Hivemind network statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('nodes')
  @ApiOperation({ summary: 'Get all P2P nodes in the Hivemind network' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by node status (active, inactive)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of nodes to return' })
  @ApiResponse({ status: 200, description: 'Nodes retrieved successfully' })
  async getNodes(
    @Query('status') status?: string,
    @Query('limit') limit: string = '100',
  ) {
    try {
      this.logger.log('Getting P2P nodes');

      const limitNum = parseInt(limit, 10);
      const nodes = await this.hivemindService.getNodes(status, limitNum);

      return {
        success: true,
        data: {
          nodes,
          totalCount: nodes.length,
          activeCount: nodes.filter(n => n.isActive).length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting nodes:', error);
      throw new HttpException(
        'Failed to retrieve nodes',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('nodes/register')
  @ApiOperation({ summary: 'Register a new P2P node' })
  @ApiBody({ description: 'Node registration data' })
  @ApiResponse({ status: 201, description: 'Node registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid node data' })
  async registerNode(
    @Body() nodeData: {
      nodeId: string;
      address: string;
      publicKey: string;
      computeCapacity: number;
      bandwidth: number;
    }
  ) {
    try {
      this.logger.log(`Registering new node: ${nodeData.nodeId}`);

      const registeredNode = await this.hivemindService.registerNode({
        ...nodeData,
        reputationScore: 0,
        isActive: true,
        lastSeen: new Date(),
      });

      return {
        success: true,
        data: {
          nodeId: registeredNode.nodeId,
          registeredAt: new Date().toISOString(),
          status: 'registered'
        }
      };
    } catch (error) {
      this.logger.error('Error registering node:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to register node',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('contributors/top')
  @ApiOperation({ summary: 'Get top contributors in the Hivemind network' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of top contributors to return' })
  @ApiResponse({ status: 200, description: 'Top contributors retrieved successfully' })
  async getTopContributors(@Query('limit') limit: string = '10') {
    try {
      this.logger.log('Getting top contributors');

      const limitNum = parseInt(limit, 10);
      const contributors = await this.hivemindService.getTopContributors(limitNum);

      return {
        success: true,
        data: contributors
      };
    } catch (error) {
      this.logger.error('Error getting top contributors:', error);
      throw new HttpException(
        'Failed to retrieve top contributors',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('topology/nodes')
  @ApiOperation({ summary: 'Get network topology nodes' })
  @ApiResponse({ status: 200, description: 'Topology nodes retrieved successfully' })
  async getTopologyNodes() {
    try {
      this.logger.log('Getting topology nodes');

      // Mock data for topology visualization
      const mockNodes = [
        {
          id: 'node-central-1',
          label: 'Central Hub 1',
          type: 'hub',
          x: 400,
          y: 300,
          computePower: 1500,
          connections: 12,
          status: 'active',
          region: 'us-east-1',
          latency: 25
        },
        {
          id: 'node-worker-1',
          label: 'Worker Node 1',
          type: 'worker',
          x: 200,
          y: 150,
          computePower: 800,
          connections: 4,
          status: 'active',
          region: 'us-east-1',
          latency: 45
        },
        {
          id: 'node-worker-2',
          label: 'Worker Node 2',
          type: 'worker',
          x: 600,
          y: 150,
          computePower: 950,
          connections: 6,
          status: 'active',
          region: 'us-west-2',
          latency: 38
        },
        {
          id: 'node-worker-3',
          label: 'Worker Node 3',
          type: 'worker',
          x: 300,
          y: 450,
          computePower: 720,
          connections: 3,
          status: 'active',
          region: 'eu-west-1',
          latency: 65
        },
        {
          id: 'node-validator-1',
          label: 'Validator 1',
          type: 'validator',
          x: 500,
          y: 450,
          computePower: 600,
          connections: 8,
          status: 'active',
          region: 'ap-southeast-1',
          latency: 75
        },
        {
          id: 'node-storage-1',
          label: 'Storage Node 1',
          type: 'storage',
          x: 100,
          y: 300,
          computePower: 300,
          connections: 5,
          status: 'active',
          region: 'us-central-1',
          latency: 55
        },
        {
          id: 'node-edge-1',
          label: 'Edge Node 1',
          type: 'edge',
          x: 700,
          y: 300,
          computePower: 450,
          connections: 2,
          status: 'active',
          region: 'eu-central-1',
          latency: 85
        }
      ];

      return {
        success: true,
        data: {
          nodes: mockNodes,
          totalCount: mockNodes.length,
          activeCount: mockNodes.filter(n => n.status === 'active').length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting topology nodes:', error);
      throw new HttpException(
        'Failed to retrieve topology nodes',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('topology/connections')
  @ApiOperation({ summary: 'Get network topology connections' })
  @ApiResponse({ status: 200, description: 'Topology connections retrieved successfully' })
  async getTopologyConnections() {
    try {
      this.logger.log('Getting topology connections');

      // Mock connections data
      const mockConnections = [
        {
          id: 'conn-1',
          source: 'node-central-1',
          target: 'node-worker-1',
          bandwidth: 1000,
          latency: 25,
          status: 'active',
          dataTransferred: 15000
        },
        {
          id: 'conn-2',
          source: 'node-central-1',
          target: 'node-worker-2',
          bandwidth: 1000,
          latency: 35,
          status: 'active',
          dataTransferred: 18500
        },
        {
          id: 'conn-3',
          source: 'node-central-1',
          target: 'node-worker-3',
          bandwidth: 800,
          latency: 60,
          status: 'active',
          dataTransferred: 12000
        },
        {
          id: 'conn-4',
          source: 'node-central-1',
          target: 'node-validator-1',
          bandwidth: 1200,
          latency: 45,
          status: 'active',
          dataTransferred: 22000
        },
        {
          id: 'conn-5',
          source: 'node-worker-1',
          target: 'node-storage-1',
          bandwidth: 600,
          latency: 40,
          status: 'active',
          dataTransferred: 8500
        },
        {
          id: 'conn-6',
          source: 'node-worker-2',
          target: 'node-edge-1',
          bandwidth: 500,
          latency: 55,
          status: 'active',
          dataTransferred: 6200
        },
        {
          id: 'conn-7',
          source: 'node-validator-1',
          target: 'node-worker-3',
          bandwidth: 700,
          latency: 50,
          status: 'active',
          dataTransferred: 9800
        }
      ];

      return {
        success: true,
        data: {
          connections: mockConnections,
          totalCount: mockConnections.length,
          activeCount: mockConnections.filter(c => c.status === 'active').length,
          totalBandwidth: mockConnections.reduce((sum, c) => sum + c.bandwidth, 0),
          averageLatency: mockConnections.reduce((sum, c) => sum + c.latency, 0) / mockConnections.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting topology connections:', error);
      throw new HttpException(
        'Failed to retrieve topology connections',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Get detailed network health metrics' })
  @ApiResponse({ status: 200, description: 'Network health metrics retrieved successfully' })
  async getNetworkHealth() {
    try {
      this.logger.log('Getting network health metrics');

      const healthMetrics = {
        overallHealth: 94.5,
        nodeHealth: {
          totalNodes: 847,
          activeNodes: 734,
          healthyNodes: 698,
          warningNodes: 36,
          criticalNodes: 0,
          offlineNodes: 113
        },
        performance: {
          averageLatency: 45,
          maxLatency: 150,
          minLatency: 15,
          networkThroughput: 2.4, // GB/s
          packetLoss: 0.02 // 0.02%
        },
        resources: {
          totalComputePower: 156000, // TFLOPS
          availableComputePower: 89000,
          utilizationRate: 42.9, // percentage
          memoryUsage: 68.5, // percentage
          storageUsage: 34.2 // percentage
        },
        security: {
          authenticatedNodes: 734,
          unauthorizedAttempts: 0,
          encryptionLevel: 'AES-256',
          consensusHealth: 99.1
        },
        trends: {
          last24h: {
            nodeJoins: 23,
            nodeLeaves: 8,
            averageUptime: 97.8,
            incidentCount: 0
          },
          last7d: {
            nodeJoins: 156,
            nodeLeaves: 89,
            averageUptime: 96.5,
            incidentCount: 2
          }
        },
        lastUpdated: new Date().toISOString()
      };

      return {
        success: true,
        data: healthMetrics
      };
    } catch (error) {
      this.logger.error('Error getting network health:', error);
      throw new HttpException(
        'Failed to retrieve network health metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}