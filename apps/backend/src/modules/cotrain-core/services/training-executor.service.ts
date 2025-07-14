import { Injectable, Logger } from '@nestjs/common';
import { ProcessManagerService, PythonProcessConfig } from './process-manager.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export interface TrainingConfig {
  modelName: string;
  datasetPath: string;
  outputPath: string;
  epochs: number;
  batchSize: number;
  learningRate: number;
  distributed: boolean;
  nodes?: string[];
  gpuIds?: number[];
  checkpointInterval?: number;
  logLevel?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  customArgs?: Record<string, any>;
}

export interface TrainingSession {
  id: string;
  config: TrainingConfig;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  progress?: number;
  currentEpoch?: number;
  loss?: number;
  accuracy?: number;
  error?: string;
  logPath?: string;
  checkpointPath?: string;
}

@Injectable()
export class TrainingExecutorService {
  private readonly logger = new Logger(TrainingExecutorService.name);
  private trainingSessions: Map<string, TrainingSession> = new Map();
  private readonly cotrainCorePath = process.env.COTRAIN_CORE_PATH || '/app/CotrainCore';
  private readonly sharedPath = process.env.SHARED_PATH || '/app/shared';

  constructor(private readonly processManagerService: ProcessManagerService) {
    // 监听进程事件
    this.processManagerService.on('processOutput', this.handleProcessOutput.bind(this));
    this.processManagerService.on('processExit', this.handleProcessExit.bind(this));
    this.processManagerService.on('processError', this.handleProcessError.bind(this));
  }

  /**
   * 开始训练任务
   */
  async startTraining(config: TrainingConfig): Promise<string> {
    const sessionId = uuidv4();
    
    const session: TrainingSession = {
      id: sessionId,
      config,
      status: 'pending',
      startTime: new Date(),
      progress: 0,
    };

    this.trainingSessions.set(sessionId, session);

    try {
      // 创建训练配置文件
      const configPath = await this.generateTrainingConfig(sessionId, config);
      
      // 创建日志目录
      const logPath = path.join(this.sharedPath, 'logs', sessionId);
      await fs.mkdir(logPath, { recursive: true });
      session.logPath = logPath;

      // 创建检查点目录
      const checkpointPath = path.join(this.sharedPath, 'checkpoints', sessionId);
      await fs.mkdir(checkpointPath, { recursive: true });
      session.checkpointPath = checkpointPath;

      // 准备Python进程配置
      const pythonConfig: PythonProcessConfig = {
        scriptPath: path.join(this.cotrainCorePath, 'src/cotrain_core/main.py'),
        args: [
          '--config', configPath,
          '--session-id', sessionId,
          '--log-dir', logPath,
          '--checkpoint-dir', checkpointPath,
        ],
        cwd: this.cotrainCorePath,
        env: {
          PYTHONPATH: path.join(this.cotrainCorePath, 'src'),
          CUDA_VISIBLE_DEVICES: config.gpuIds?.join(',') || '0',
          OMP_NUM_THREADS: '4',
        },
        timeout: 24 * 60 * 60 * 1000, // 24小时超时
      };

      // 启动训练进程
      await this.processManagerService.startPythonProcess(sessionId, pythonConfig);
      
      session.status = 'running';
      this.trainingSessions.set(sessionId, session);

      this.logger.log(`Started training session ${sessionId}`);
      return sessionId;
    } catch (error) {
      this.logger.error(`Failed to start training session ${sessionId}:`, error);
      session.status = 'failed';
      session.error = error.message;
      session.endTime = new Date();
      this.trainingSessions.set(sessionId, session);
      throw error;
    }
  }

  /**
   * 停止训练任务
   */
  async stopTraining(sessionId: string, force = false): Promise<void> {
    const session = this.trainingSessions.get(sessionId);
    if (!session) {
      throw new Error(`Training session ${sessionId} not found`);
    }

    if (session.status !== 'running') {
      throw new Error(`Training session ${sessionId} is not running`);
    }

    try {
      await this.processManagerService.stopPythonProcess(sessionId, force);
      
      session.status = 'cancelled';
      session.endTime = new Date();
      this.trainingSessions.set(sessionId, session);

      this.logger.log(`Stopped training session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to stop training session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 获取训练会话信息
   */
  getTrainingSession(sessionId: string): TrainingSession | undefined {
    return this.trainingSessions.get(sessionId);
  }

  /**
   * 获取所有训练会话
   */
  getAllTrainingSessions(): TrainingSession[] {
    return Array.from(this.trainingSessions.values());
  }

  /**
   * 获取活跃的训练会话
   */
  getActiveTrainingSessions(): TrainingSession[] {
    return Array.from(this.trainingSessions.values()).filter(
      session => session.status === 'running'
    );
  }

  /**
   * 获取所有会话（带分页）
   */
  getAllSessions(options: { limit?: number; offset?: number } = {}): {
    sessions: TrainingSession[];
    total: number;
  } {
    const allSessions = Array.from(this.trainingSessions.values());
    const total = allSessions.length;
    
    let sessions = allSessions;
    
    if (options.offset) {
      sessions = sessions.slice(options.offset);
    }
    
    if (options.limit) {
      sessions = sessions.slice(0, options.limit);
    }
    
    return {
      sessions,
      total,
    };
  }

  /**
   * 暂停训练（发送暂停信号）
   */
  async pauseTraining(sessionId: string): Promise<void> {
    const session = this.trainingSessions.get(sessionId);
    if (!session || session.status !== 'running') {
      throw new Error(`Training session ${sessionId} is not running`);
    }

    try {
      // TODO: 实现暂停功能 - 需要进程间通信
      this.logger.log(`Paused training session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to pause training session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 恢复训练
   */
  async resumeTraining(sessionId: string): Promise<void> {
    const session = this.trainingSessions.get(sessionId);
    if (!session || session.status !== 'running') {
      throw new Error(`Training session ${sessionId} is not running`);
    }

    try {
      // TODO: 实现恢复功能 - 需要进程间通信
      this.logger.log(`Resumed training session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to resume training session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 生成训练配置文件
   */
  private async generateTrainingConfig(
    sessionId: string,
    config: TrainingConfig,
  ): Promise<string> {
    const configDir = path.join(this.sharedPath, 'configs', sessionId);
    await fs.mkdir(configDir, { recursive: true });
    
    const configPath = path.join(configDir, 'training_config.toml');
    
    // 生成TOML配置内容
    const tomlContent = this.generateTomlConfig(config);
    
    await fs.writeFile(configPath, tomlContent, 'utf-8');
    
    this.logger.debug(`Generated config file: ${configPath}`);
    return configPath;
  }

  /**
   * 生成TOML配置内容
   */
  private generateTomlConfig(config: TrainingConfig): string {
    return `
# Training Configuration for ${config.modelName}
# Generated at ${new Date().toISOString()}

[model]
name = "${config.modelName}"
architecture = "transformer"

[training]
epochs = ${config.epochs}
batch_size = ${config.batchSize}
learning_rate = ${config.learningRate}
checkpoint_interval = ${config.checkpointInterval || 100}

[data]
dataset_path = "${config.datasetPath}"
output_path = "${config.outputPath}"

[distributed]
enabled = ${config.distributed}
${config.nodes ? `nodes = [${config.nodes.map(node => `"${node}"`).join(', ')}]` : ''}

[hardware]
${config.gpuIds ? `gpu_ids = [${config.gpuIds.join(', ')}]` : 'gpu_ids = [0]'}

[logging]
level = "${config.logLevel || 'INFO'}"

${config.customArgs ? Object.entries(config.customArgs)
  .map(([key, value]) => `[custom.${key}]\nvalue = ${JSON.stringify(value)}`)
  .join('\n\n') : ''}
`;
  }

  /**
   * 处理进程输出
   */
  private handleProcessOutput(event: any): void {
    const { processId, type, data } = event;
    const session = this.trainingSessions.get(processId);
    
    if (!session) return;

    // 解析训练进度信息
    try {
      const lines = data.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        // 解析进度信息
        if (line.includes('Epoch:')) {
          const epochMatch = line.match(/Epoch:\s*(\d+)\/(\d+)/);
          if (epochMatch) {
            const currentEpoch = parseInt(epochMatch[1]);
            const totalEpochs = parseInt(epochMatch[2]);
            session.currentEpoch = currentEpoch;
            session.progress = (currentEpoch / totalEpochs) * 100;
          }
        }
        
        // 解析损失值
        if (line.includes('Loss:')) {
          const lossMatch = line.match(/Loss:\s*([\d\.]+)/);
          if (lossMatch) {
            session.loss = parseFloat(lossMatch[1]);
          }
        }
        
        // 解析准确率
        if (line.includes('Accuracy:')) {
          const accMatch = line.match(/Accuracy:\s*([\d\.]+)/);
          if (accMatch) {
            session.accuracy = parseFloat(accMatch[1]);
          }
        }
      }
      
      this.trainingSessions.set(processId, session);
    } catch (error) {
      this.logger.debug(`Failed to parse training output: ${error.message}`);
    }
  }

  /**
   * 处理进程退出
   */
  private handleProcessExit(event: any): void {
    const { processId, code } = event;
    const session = this.trainingSessions.get(processId);
    
    if (!session) return;

    session.endTime = new Date();
    
    if (code === 0) {
      session.status = 'completed';
      session.progress = 100;
      this.logger.log(`Training session ${processId} completed successfully`);
    } else {
      session.status = 'failed';
      session.error = `Process exited with code ${code}`;
      this.logger.error(`Training session ${processId} failed with exit code ${code}`);
    }
    
    this.trainingSessions.set(processId, session);
  }

  /**
   * 处理进程错误
   */
  private handleProcessError(event: any): void {
    const { processId, error } = event;
    const session = this.trainingSessions.get(processId);
    
    if (!session) return;

    session.status = 'failed';
    session.error = error.message;
    session.endTime = new Date();
    
    this.trainingSessions.set(processId, session);
    
    this.logger.error(`Training session ${processId} encountered error:`, error);
  }
}