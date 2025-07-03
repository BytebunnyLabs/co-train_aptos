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
}