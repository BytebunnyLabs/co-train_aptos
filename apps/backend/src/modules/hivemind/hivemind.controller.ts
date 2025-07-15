import { Controller, Get, Post, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HivemindService, P2PNode, TrainingContribution } from './hivemind.service';
import { ContributionTrackerService } from './services/contribution-tracker.service';
import { RewardDistributorService } from './services/reward-distributor.service';

export class RegisterNodeDto {
  nodeId: string;
  address: string;
  publicKey: string;
  computeCapacity: number;
  bandwidth: number;
}

export class SubmitContributionDto {
  sessionId: number;
  participant: string;
  computeTime: number;
  gradientQuality: number;
  dataTransmitted: number;
  uptimeRatio: number;
}

export class StartTrainingSessionDto {
  sessionId: number;
  modelConfig: any;
}

export class StartDistributedTrainingDto {
  sessionId: string;
  modelConfig: any;
  trainingConfig: any;
  participants: string[];
}

export class DistributeRewardsDto {
  sessionId: number;
  totalRewardPool: number;
  includeBonus?: boolean;
}

@ApiTags('Hivemind P2P Network')
@Controller('hivemind')
export class HivemindController {
  constructor(
    private readonly hivemindService: HivemindService,
    private readonly contributionTracker: ContributionTrackerService,
    private readonly rewardDistributor: RewardDistributorService,
  ) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize P2P network' })
  @ApiResponse({ status: 200, description: 'P2P network initialized successfully' })
  async initializeNetwork(@Body() body: { port?: number }) {
    try {
      await this.hivemindService.initializeP2PNetwork(body.port || 8080);
      return { message: 'P2P network initialized successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to initialize P2P network: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('nodes/register')
  @ApiOperation({ summary: 'Register a new P2P node' })
  @ApiResponse({ status: 201, description: 'Node registered successfully' })
  async registerNode(@Body() registerNodeDto: RegisterNodeDto) {
    try {
      const p2pNode: P2PNode = {
        ...registerNodeDto,
        reputationScore: 0,
        isActive: true,
        lastSeen: new Date(),
      };
      await this.hivemindService.registerNode(p2pNode);
      return { message: 'Node registered successfully', nodeId: registerNodeDto.nodeId };
    } catch (error) {
      throw new HttpException(
        `Failed to register node: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('nodes')
  @ApiOperation({ summary: 'Get all active nodes' })
  @ApiResponse({ status: 200, description: 'List of active nodes' })
  async getActiveNodes(): Promise<P2PNode[]> {
    try {
      return await this.hivemindService.getActiveNodes();
    } catch (error) {
      throw new HttpException(
        `Failed to get active nodes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('network/stats')
  @ApiOperation({ summary: 'Get network statistics' })
  @ApiResponse({ status: 200, description: 'Network statistics' })
  async getNetworkStats() {
    try {
      return await this.hivemindService.getNetworkStats();
    } catch (error) {
      throw new HttpException(
        `Failed to get network stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('contributions/submit')
  @ApiOperation({ summary: 'Submit training contribution' })
  @ApiResponse({ status: 201, description: 'Contribution submitted successfully' })
  async submitContribution(@Body() contributionDto: SubmitContributionDto) {
    try {
      const contribution: TrainingContribution = {
        ...contributionDto,
        timestamp: new Date(),
      };
      
      await this.hivemindService.submitContribution(contribution);
      return { message: 'Contribution submitted successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to submit contribution: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('contributions/node/:nodeId')
  @ApiOperation({ summary: 'Get node contributions' })
  @ApiParam({ name: 'nodeId', description: 'Node ID' })
  @ApiResponse({ status: 200, description: 'Node contributions' })
  async getNodeContributions(@Param('nodeId') nodeId: string) {
    try {
      return await this.contributionTracker.getNodeContributions(nodeId);
    } catch (error) {
      throw new HttpException(
        `Failed to get node contributions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('contributions/session/:sessionId')
  @ApiOperation({ summary: 'Get session contributions' })
  @ApiParam({ name: 'sessionId', description: 'Training session ID' })
  @ApiResponse({ status: 200, description: 'Session contributions' })
  async getSessionContributions(@Param('sessionId') sessionId: number) {
    try {
      return await this.contributionTracker.getSessionContributions(sessionId);
    } catch (error) {
      throw new HttpException(
        `Failed to get session contributions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('contributors/top')
  @ApiOperation({ summary: 'Get top contributors' })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Filter by session ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of contributors to return' })
  @ApiResponse({ status: 200, description: 'Top contributors list' })
  async getTopContributors(
    @Query('sessionId') sessionId?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      return await this.contributionTracker.getTopContributors(sessionId, limit || 10);
    } catch (error) {
      throw new HttpException(
        `Failed to get top contributors: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rewards/calculate/:sessionId')
  @ApiOperation({ summary: 'Calculate session rewards' })
  @ApiParam({ name: 'sessionId', description: 'Training session ID' })
  @ApiQuery({ name: 'totalReward', description: 'Total reward pool' })
  @ApiResponse({ status: 200, description: 'Calculated rewards' })
  async calculateSessionRewards(
    @Param('sessionId') sessionId: number,
    @Query('totalReward') totalReward: number,
  ) {
    try {
      const rewards = await this.contributionTracker.calculateSessionRewards(sessionId, totalReward);
      return Object.fromEntries(rewards);
    } catch (error) {
      throw new HttpException(
        `Failed to calculate rewards: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('training/start')
  @ApiOperation({ summary: 'Start training session' })
  @ApiResponse({ status: 200, description: 'Training session started' })
  async startTrainingSession(@Body() startSessionDto: StartTrainingSessionDto) {
    // Legacy method - kept for backward compatibility
    try {
      // Convert to new distributed training format
      await this.hivemindService.startDistributedTraining({
        sessionId: startSessionDto.sessionId.toString(),
        modelConfig: startSessionDto.modelConfig,
        trainingConfig: {},
        participants: [],
      });
      return { message: 'Training session started successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to start training session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('training/distributed/start')
  @ApiOperation({ summary: 'Start distributed training session with CotrainCore' })
  @ApiResponse({ status: 200, description: 'Distributed training session started' })
  async startDistributedTraining(@Body() startDistributedDto: StartDistributedTrainingDto) {
    try {
      await this.hivemindService.startDistributedTraining(startDistributedDto);
      return { 
        message: 'Distributed training session started successfully',
        sessionId: startDistributedDto.sessionId 
      };
    } catch (error) {
      throw new HttpException(
        `Failed to start distributed training: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('training/distributed/stop/:sessionId')
  @ApiOperation({ summary: 'Stop distributed training session' })
  @ApiParam({ name: 'sessionId', description: 'Training session ID' })
  @ApiResponse({ status: 200, description: 'Distributed training session stopped' })
  async stopDistributedTraining(@Param('sessionId') sessionId: string) {
    try {
      await this.hivemindService.stopDistributedTraining(sessionId);
      return { message: 'Distributed training session stopped successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to stop distributed training: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('training/distributed/status/:sessionId')
  @ApiOperation({ summary: 'Get distributed training session status' })
  @ApiParam({ name: 'sessionId', description: 'Training session ID' })
  @ApiResponse({ status: 200, description: 'Training session status' })
  async getDistributedTrainingStatus(@Param('sessionId') sessionId: string) {
    try {
      const status = await this.hivemindService.getTrainingSessionStatus(sessionId);
      return { sessionId, status };
    } catch (error) {
      throw new HttpException(
        `Failed to get training session status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('training/legacy/start')
  @ApiOperation({ summary: 'Start legacy training session (deprecated)' })
  @ApiResponse({ status: 200, description: 'Legacy training session started' })
  async startLegacyTrainingSession(@Body() startSessionDto: StartTrainingSessionDto) {
    try {
      await this.hivemindService.startTrainingSession(
        startSessionDto.sessionId,
        startSessionDto.modelConfig
      );
      return { message: 'Legacy training session started successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to start legacy training session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('training/stop/:sessionId')
  @ApiOperation({ summary: 'Stop training session' })
  @ApiParam({ name: 'sessionId', description: 'Training session ID' })
  @ApiResponse({ status: 200, description: 'Training session stopped' })
  async stopTrainingSession(@Param('sessionId') sessionId: number) {
    try {
      await this.hivemindService.stopTrainingSession(sessionId);
      return { message: 'Training session stopped successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to stop training session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('nodes/:nodeId/reliability')
  @ApiOperation({ summary: 'Get node reliability score' })
  @ApiParam({ name: 'nodeId', description: 'Node ID' })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Filter by session ID' })
  @ApiResponse({ status: 200, description: 'Node reliability score' })
  async getNodeReliability(
    @Param('nodeId') nodeId: string,
    @Query('sessionId') sessionId?: number,
  ) {
    try {
      const reliabilityScore = await this.contributionTracker.getNodeReliabilityScore(nodeId, sessionId);
      return { nodeId, reliabilityScore };
    } catch (error) {
      throw new HttpException(
        `Failed to get node reliability: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('metrics/gradient-quality')
  @ApiOperation({ summary: 'Get average gradient quality' })
  @ApiQuery({ name: 'nodeId', required: false, description: 'Filter by node ID' })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Filter by session ID' })
  @ApiResponse({ status: 200, description: 'Average gradient quality' })
  async getAverageGradientQuality(
    @Query('nodeId') nodeId?: string,
    @Query('sessionId') sessionId?: number,
  ) {
    try {
      const averageQuality = await this.contributionTracker.getAverageGradientQuality(nodeId, sessionId);
      return { averageGradientQuality: averageQuality };
    } catch (error) {
      throw new HttpException(
        `Failed to get gradient quality: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('rewards/distribute')
  @ApiOperation({ summary: 'Distribute rewards for a training session' })
  @ApiResponse({ status: 200, description: 'Rewards distributed successfully' })
  async distributeRewards(@Body() distributeRewardsDto: DistributeRewardsDto) {
    try {
      const distribution = await this.rewardDistributor.distributeSessionRewards(
        distributeRewardsDto.sessionId,
        distributeRewardsDto.totalRewardPool,
        distributeRewardsDto.includeBonus || false,
      );
      return { 
        message: 'Rewards distributed successfully',
        distribution: {
          sessionId: distribution.sessionId,
          totalRewardPool: distribution.totalRewardPool,
          recipientsCount: distribution.distributions.size,
          timestamp: distribution.timestamp,
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to distribute rewards: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rewards/session/:sessionId')
  @ApiOperation({ summary: 'Get reward distribution for a session' })
  @ApiParam({ name: 'sessionId', description: 'Training session ID' })
  @ApiResponse({ status: 200, description: 'Session reward distribution' })
  async getSessionRewardDistribution(@Param('sessionId') sessionId: number) {
    try {
      const distribution = await this.rewardDistributor.getSessionRewardDistribution(sessionId);
      if (!distribution) {
        throw new HttpException('Session reward distribution not found', HttpStatus.NOT_FOUND);
      }
      return distribution;
    } catch (error) {
      throw new HttpException(
        `Failed to get session reward distribution: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rewards/node/:nodeId/metrics')
  @ApiOperation({ summary: 'Get node reward metrics' })
  @ApiParam({ name: 'nodeId', description: 'Node ID' })
  @ApiResponse({ status: 200, description: 'Node reward metrics' })
  async getNodeRewardMetrics(@Param('nodeId') nodeId: string) {
    try {
      const metrics = await this.rewardDistributor.getNodeRewardMetrics(nodeId);
      if (!metrics) {
        throw new HttpException('Node reward metrics not found', HttpStatus.NOT_FOUND);
      }
      return metrics;
    } catch (error) {
      throw new HttpException(
        `Failed to get node reward metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rewards/history')
  @ApiOperation({ summary: 'Get reward distribution history' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of distributions to return' })
  @ApiResponse({ status: 200, description: 'Reward distribution history' })
  async getRewardDistributionHistory(@Query('limit') limit?: number) {
    try {
      return await this.rewardDistributor.getRewardDistributionHistory(limit || 10);
    } catch (error) {
      throw new HttpException(
        `Failed to get reward distribution history: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rewards/projected/:nodeId/:sessionId')
  @ApiOperation({ summary: 'Calculate projected rewards for a node' })
  @ApiParam({ name: 'nodeId', description: 'Node ID' })
  @ApiParam({ name: 'sessionId', description: 'Training session ID' })
  @ApiQuery({ name: 'estimatedTotalReward', description: 'Estimated total reward pool' })
  @ApiResponse({ status: 200, description: 'Projected rewards calculation' })
  async getProjectedRewards(
    @Param('nodeId') nodeId: string,
    @Param('sessionId') sessionId: number,
    @Query('estimatedTotalReward') estimatedTotalReward: number,
  ) {
    try {
      const projectedRewards = await this.rewardDistributor.calculateProjectedRewards(
        nodeId,
        sessionId,
        estimatedTotalReward,
      );
      return projectedRewards;
    } catch (error) {
      throw new HttpException(
        `Failed to calculate projected rewards: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rewards/all-metrics')
  @ApiOperation({ summary: 'Get reward metrics for all nodes' })
  @ApiResponse({ status: 200, description: 'All node reward metrics' })
  async getAllNodeRewardMetrics() {
    try {
      return await this.rewardDistributor.getAllNodeRewardMetrics();
    } catch (error) {
      throw new HttpException(
        `Failed to get all node reward metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}