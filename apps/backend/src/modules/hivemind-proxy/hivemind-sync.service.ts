import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class HivemindSyncService {
  private readonly logger = new Logger(HivemindSyncService.name);

  constructor(
    // TODO: 添加实际的实体注入
    // @InjectRepository(TrainingTask)
    // private readonly trainingTaskRepository: Repository<TrainingTask>,
  ) {}

  async syncTrainingTask(hivemindTaskId: string, trainingData: any) {
    try {
      // 将 Hivemind 训练任务信息同步到本地数据库
      // const task = this.trainingTaskRepository.create({
      //   hivemindTaskId,
      //   userId: trainingData.user_id,
      //   modelConfig: trainingData.model_config,
      //   trainingParams: trainingData.training_params,
      //   status: 'submitted',
      //   createdAt: new Date(),
      // });
      // 
      // await this.trainingTaskRepository.save(task);
      
      this.logger.log(`Training task ${hivemindTaskId} synced to local database`);
    } catch (error) {
      this.logger.error('Failed to sync training task', error.message);
      throw error;
    }
  }

  async syncTrainingStatus(hivemindTaskId: string, statusData: any) {
    try {
      // 更新本地数据库中的训练任务状态
      // await this.trainingTaskRepository.update(
      //   { hivemindTaskId },
      //   {
      //     status: statusData.status,
      //     progress: statusData.progress,
      //     logs: statusData.logs,
      //     updatedAt: new Date(),
      //   },
      // );
      
      // 如果训练完成，触发奖励分配
      if (statusData.status === 'completed') {
        await this.handleTrainingCompletion(hivemindTaskId, statusData);
      }
      
      this.logger.log(`Training status for ${hivemindTaskId} synced`);
    } catch (error) {
      this.logger.error('Failed to sync training status', error.message);
      throw error;
    }
  }

  private async handleTrainingCompletion(hivemindTaskId: string, statusData: any) {
    try {
      // 处理训练完成后的逻辑
      // 1. 更新区块链状态
      // 2. 分配奖励
      // 3. 通知相关用户
      
      this.logger.log(`Training ${hivemindTaskId} completed, processing rewards`);
    } catch (error) {
      this.logger.error('Failed to handle training completion', error.message);
    }
  }
}