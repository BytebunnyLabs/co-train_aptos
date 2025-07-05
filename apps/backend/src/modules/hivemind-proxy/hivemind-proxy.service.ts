import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HivemindSyncService } from './hivemind-sync.service';

@Injectable()
export class HivemindProxyService {
  private readonly logger = new Logger(HivemindProxyService.name);
  private readonly hivemindServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly hivemindSyncService: HivemindSyncService,
  ) {
    this.hivemindServiceUrl = this.configService.get<string>(
      'HIVEMIND_SERVICE_URL',
      'http://hivemind-service:8000',
    );
  }

  async startServer() {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.hivemindServiceUrl}/api/v1/hivemind/start`),
      );
      
      this.logger.log('Hivemind server started successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start Hivemind server', error.message);
      throw error;
    }
  }

  async getStatus() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.hivemindServiceUrl}/api/v1/hivemind/status`),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Hivemind status', error.message);
      throw error;
    }
  }

  async submitTrainingTask(trainingData: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.hivemindServiceUrl}/api/v1/hivemind/train`,
          trainingData,
        ),
      );
      
      // 同步训练任务到本地数据库
      await this.hivemindSyncService.syncTrainingTask(
        response.data.task_id,
        trainingData,
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to submit training task', error.message);
      throw error;
    }
  }

  async getTrainingStatus(taskId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.hivemindServiceUrl}/api/v1/hivemind/training/${taskId}`,
        ),
      );
      
      // 同步训练状态到本地数据库
      await this.hivemindSyncService.syncTrainingStatus(taskId, response.data.data);
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get training status', error.message);
      throw error;
    }
  }

  async getConnectedPeers() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.hivemindServiceUrl}/api/v1/hivemind/peers`),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get connected peers', error.message);
      throw error;
    }
  }
}