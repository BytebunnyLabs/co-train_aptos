import { Controller, Get, Post, Body, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TrainingService } from '../training.service';

interface TrainingOption {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  rewardRange: {
    min: number;
    max: number;
  };
  requirements: string[];
  category: string;
}

@ApiTags('Training API')
@Controller('api/training')
export class TrainingApiController {
  private readonly logger = new Logger(TrainingApiController.name);

  constructor(private readonly trainingService: TrainingService) {}

  @Get('options')
  @ApiOperation({ summary: 'Get available training options' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'difficulty', required: false, description: 'Filter by difficulty level' })
  @ApiResponse({ status: 200, description: 'Training options retrieved successfully' })
  async getTrainingOptions(
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    try {
      this.logger.log('Getting training options');

      const options: TrainingOption[] = [
        {
          id: 'nlp-sentiment',
          name: 'NLP Sentiment Analysis',
          description: 'Train models to analyze sentiment in text data using distributed learning',
          difficulty: 'beginner',
          estimatedDuration: '2-4 hours',
          rewardRange: { min: 10, max: 50 },
          requirements: ['Basic Python knowledge', 'Text data'],
          category: 'nlp'
        },
        {
          id: 'computer-vision',
          name: 'Computer Vision Classification',
          description: 'Collaborative training for image classification models',
          difficulty: 'intermediate',
          estimatedDuration: '4-8 hours',
          rewardRange: { min: 25, max: 100 },
          requirements: ['GPU recommended', 'Image datasets'],
          category: 'vision'
        },
        {
          id: 'federated-learning',
          name: 'Federated Learning Framework',
          description: 'Advanced federated learning with privacy preservation',
          difficulty: 'advanced',
          estimatedDuration: '8-12 hours',
          rewardRange: { min: 50, max: 200 },
          requirements: ['Advanced ML knowledge', 'High-performance hardware'],
          category: 'federated'
        },
        {
          id: 'time-series',
          name: 'Time Series Forecasting',
          description: 'Collaborative training for time series prediction models',
          difficulty: 'intermediate',
          estimatedDuration: '3-6 hours',
          rewardRange: { min: 20, max: 80 },
          requirements: ['Time series data', 'Statistical knowledge'],
          category: 'forecasting'
        }
      ];

      // Apply filters
      let filteredOptions = options;
      
      if (category) {
        filteredOptions = filteredOptions.filter(option => 
          option.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      if (difficulty) {
        filteredOptions = filteredOptions.filter(option => 
          option.difficulty.toLowerCase() === difficulty.toLowerCase()
        );
      }

      return {
        success: true,
        data: {
          options: filteredOptions,
          totalCount: filteredOptions.length,
          categories: [...new Set(options.map(o => o.category))],
          difficulties: ['beginner', 'intermediate', 'advanced'],
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting training options:', error);
      throw new HttpException(
        'Failed to retrieve training options',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('history')
  @ApiOperation({ summary: 'Get training history for current user' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip' })
  @ApiResponse({ status: 200, description: 'Training history retrieved successfully' })
  async getTrainingHistory(
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    try {
      this.logger.log('Getting training history');
      
      const limitNum = parseInt(limit, 10);
      const page = Math.floor(parseInt(offset, 10) / limitNum) + 1;

      // Get training history from service - using a dummy userId for now
      const history = await this.trainingService.getTrainingHistory('dummy-user-id', page, limitNum);

      return {
        success: true,
        data: {
          sessions: history.data,
          totalCount: history.total,
          hasMore: history.page < history.totalPages,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting training history:', error);
      throw new HttpException(
        'Failed to retrieve training history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a training session' })
  @ApiBody({ description: 'Training session join request' })
  @ApiResponse({ status: 200, description: 'Successfully joined training session' })
  @ApiResponse({ status: 400, description: 'Invalid request or session full' })
  async joinTrainingSession(
    @Body() joinRequest: { sessionId: string; participantAddress: string }
  ) {
    try {
      this.logger.log(`Joining training session: ${joinRequest.sessionId}`);

      const result = await this.trainingService.joinSession(
        joinRequest.sessionId,
        joinRequest.participantAddress
      );

      // Calculate position and estimated start time based on current participants
      const position = result.participants ? result.participants.length : 1;
      const estimatedStartTime = new Date(Date.now() + (position * 60000)).toISOString(); // Estimate 1 minute per position

      return {
        success: true,
        data: {
          sessionId: joinRequest.sessionId,
          participantAddress: joinRequest.participantAddress,
          joinedAt: new Date().toISOString(),
          position: position,
          estimatedStartTime: estimatedStartTime
        }
      };
    } catch (error) {
      this.logger.error('Error joining training session:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to join training session',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}