import { Controller, Get, Param, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { BlockchainService } from '../blockchain.service';
import { isValidAptosAddress } from '../utils/address-validator';

@ApiTags('Blockchain Balance')
@Controller('api/blockchain')
export class BalanceController {
  private readonly logger = new Logger(BalanceController.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('balance/:address')
  @ApiOperation({ summary: 'Get APT balance for an address' })
  @ApiParam({ name: 'address', description: 'Aptos wallet address' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid address format' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async getBalance(@Param('address') address: string) {
    try {
      // Validate address format
      if (!isValidAptosAddress(address)) {
        throw new HttpException('Invalid Aptos address format', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Getting balance for address: ${address}`);

      // Get balance from blockchain service
      const balance = await this.blockchainService.getAccountBalance(address);
      
      return {
        success: true,
        data: {
          address,
          balance: balance.toString(),
          balanceFormatted: (Number(balance) / 100000000).toFixed(8), // Convert from Octas to APT
          currency: 'APT',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error(`Error getting balance for ${address}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to retrieve balance', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('rewards/:address/stats')
  @ApiOperation({ summary: 'Get reward statistics for an address' })
  @ApiParam({ name: 'address', description: 'Aptos wallet address' })
  @ApiResponse({ status: 200, description: 'Reward stats retrieved successfully' })
  async getRewardStats(@Param('address') address: string) {
    try {
      if (!isValidAptosAddress(address)) {
        throw new HttpException('Invalid Aptos address format', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Getting reward stats for address: ${address}`);

      // Get reward statistics from blockchain service
      const stats = await this.blockchainService.getRewardStats(address);
      
      return {
        success: true,
        data: {
          address,
          totalRewards: stats.totalRewards,
          pendingRewards: stats.pendingRewards,
          claimedRewards: stats.claimedRewards,
          participationCount: stats.participationCount,
          averageScore: stats.averageScore,
          lastClaimDate: stats.lastClaimDate,
          rewardHistory: stats.rewardHistory,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error(`Error getting reward stats for ${address}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to retrieve reward statistics', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}