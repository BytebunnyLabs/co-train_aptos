import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HivemindProxyService } from './hivemind-proxy.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Hivemind ML')
@Controller('api/v1/hivemind-ml')
export class HivemindProxyController {
  constructor(private readonly hivemindProxyService: HivemindProxyService) {}

  @Post('start')
  @ApiOperation({ summary: '启动 Hivemind 服务器' })
  @ApiResponse({ status: 200, description: '服务器启动成功' })
  async startHivemindServer() {
    try {
      return await this.hivemindProxyService.startServer();
    } catch (error) {
      throw new HttpException(
        `Failed to start Hivemind server: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  @ApiOperation({ summary: '获取 Hivemind 状态' })
  async getHivemindStatus() {
    try {
      return await this.hivemindProxyService.getStatus();
    } catch (error) {
      throw new HttpException(
        `Failed to get Hivemind status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('train')
  @ApiOperation({ summary: '提交训练任务' })
  async submitTrainingTask(@Body() trainingData: any) {
    try {
      return await this.hivemindProxyService.submitTrainingTask(trainingData);
    } catch (error) {
      throw new HttpException(
        `Failed to submit training task: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('training/:taskId')
  @ApiOperation({ summary: '获取训练任务状态' })
  async getTrainingStatus(@Param('taskId') taskId: string) {
    try {
      return await this.hivemindProxyService.getTrainingStatus(taskId);
    } catch (error) {
      throw new HttpException(
        `Failed to get training status: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('peers')
  @ApiOperation({ summary: '获取连接的节点' })
  async getConnectedPeers() {
    try {
      return await this.hivemindProxyService.getConnectedPeers();
    } catch (error) {
      throw new HttpException(
        `Failed to get connected peers: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}