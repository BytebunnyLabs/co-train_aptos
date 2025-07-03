import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RegisterParticipantDto } from './dto/register-participant.dto';
import { SubmitContributionDto } from './dto/submit-contribution.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@ApiTags('blockchain')
@Controller('blockchain')
export class BlockchainController {
  private readonly logger = new Logger(BlockchainController.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new training session on blockchain' })
  @ApiResponse({ status: 201, description: 'Session created successfully', type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createSession(@Body() createSessionDto: CreateSessionDto): Promise<TransactionResponseDto> {
    try {
      this.logger.log(`Creating session: ${createSessionDto.name}`);
      // TODO: Get userId from authenticated user context
      const userId = 'admin'; // Temporary hardcoded value
      const result = await this.blockchainService.createSession({ ...createSessionDto, userId });
      return result;
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`);
      throw new HttpException(
        `Failed to create session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('participants')
  @ApiOperation({ summary: 'Register participant for training session' })
  @ApiResponse({ status: 201, description: 'Participant registered successfully', type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async registerParticipant(
    @Body() registerParticipantDto: RegisterParticipantDto,
  ): Promise<TransactionResponseDto> {
    try {
      const result = await this.blockchainService.registerParticipant(
        registerParticipantDto,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to register participant: ${error.message}`);
      throw new HttpException(
        `Failed to register participant: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('contributions')
  @ApiOperation({ summary: 'Submit contribution for training session' })
  @ApiResponse({ status: 201, description: 'Contribution submitted successfully', type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async submitContribution(
    @Body() submitContributionDto: SubmitContributionDto,
  ): Promise<TransactionResponseDto> {
    try {
      const result = await this.blockchainService.submitContribution(
        submitContributionDto,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to submit contribution: ${error.message}`);
      throw new HttpException(
        `Failed to submit contribution: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sessions/:sessionId/complete')
  @ApiOperation({ summary: 'Complete a training session and distribute rewards' })
  @ApiParam({ name: 'sessionId', description: 'Training session ID' })
  @ApiResponse({
    status: 200,
    description: 'Session completed successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async completeSession(@Param('sessionId') sessionId: string): Promise<TransactionResponseDto> {
    try {
      this.logger.log(`Completing session: ${sessionId}`);
      const result = await this.blockchainService.completeSession(sessionId);
      return result;
    } catch (error) {
      this.logger.error(`Failed to complete session: ${error.message}`);
      throw new HttpException(
        `Failed to complete session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get training session details' })
  @ApiParam({ name: 'sessionId', description: 'Training session ID' })
  @ApiResponse({
    status: 200,
    description: 'Session details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSessionDetails(@Param('sessionId') sessionId: string) {
    try {
      this.logger.log(`Getting session details: ${sessionId}`);
      const result = await this.blockchainService.getSessionDetails(sessionId);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get session details: ${error.message}`);
      throw new HttpException(
        `Failed to get session details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sessions/:sessionId/participants/:participantAddress/score')
  @ApiOperation({ summary: 'Get participant score in a session' })
  @ApiParam({ name: 'sessionId', description: 'Training session ID' })
  @ApiParam({ name: 'participantAddress', description: 'Participant wallet address' })
  @ApiResponse({
    status: 200,
    description: 'Participant score retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Session or participant not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getParticipantScore(
    @Param('sessionId') sessionId: string,
    @Param('participantAddress') participantAddress: string,
  ) {
    try {
      this.logger.log(`Getting participant score: ${participantAddress} in session: ${sessionId}`);
      const score = await this.blockchainService.getParticipantScore(sessionId, participantAddress);
      return { participantAddress, sessionId, score };
    } catch (error) {
      this.logger.error(`Failed to get participant score: ${error.message}`);
      throw new HttpException(
        `Failed to get participant score: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/total-rewards')
  @ApiOperation({ summary: 'Get total rewards distributed across all sessions' })
  @ApiResponse({
    status: 200,
    description: 'Total rewards retrieved successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTotalRewardsDistributed() {
    try {
      this.logger.log('Getting total rewards distributed');
      const totalRewards = await this.blockchainService.getTotalRewardsDistributed();
      return { totalRewards };
    } catch (error) {
      this.logger.error(`Failed to get total rewards: ${error.message}`);
      throw new HttpException(
        `Failed to get total rewards: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check blockchain service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async healthCheck(): Promise<{ healthy: boolean }> {
    try {
      const healthy = await this.blockchainService.isHealthy();
      return { healthy };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      throw new HttpException(
        'Health check failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('network')
  @ApiOperation({ summary: 'Get network information' })
  @ApiResponse({ status: 200, description: 'Network information retrieved successfully' })
  async getNetworkInfo(): Promise<any> {
    try {
      const networkInfo = await this.blockchainService.getNetworkInfo();
      return networkInfo;
    } catch (error) {
      this.logger.error(`Failed to get network info: ${error.message}`);
      throw new HttpException(
        `Failed to get network info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('accounts/:address/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiParam({ name: 'address', description: 'Aptos account address' })
  @ApiResponse({ status: 200, description: 'Account balance retrieved successfully' })
  async getAccountBalance(@Param('address') address: string): Promise<{ balance: number }> {
    try {
      const balance = await this.blockchainService.getAccountBalance(address);
      return { balance };
    } catch (error) {
      this.logger.error(`Failed to get account balance: ${error.message}`);
      throw new HttpException(
        `Failed to get account balance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}