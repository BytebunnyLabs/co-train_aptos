import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Logger,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CotrainCoreService } from './services/cotrain-core.service';
import { TrainingExecutorService, TrainingSession } from './services/training-executor.service';
import { ModelManagerService } from './services/model-manager.service';
import { ProcessManagerService } from './services/process-manager.service';
import { ConfigGenerator } from './utils/config-generator';
import { TrainingSessionConfigDto } from './dto/training-session-config.dto';
import { ModelMetadata } from './services/model-manager.service';

@ApiTags('cotrain-core')
@Controller('cotrain-core')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CotrainCoreController {
  private readonly logger = new Logger(CotrainCoreController.name);

  constructor(
    private readonly cotrainCoreService: CotrainCoreService,
    private readonly trainingExecutorService: TrainingExecutorService,
    private readonly modelManagerService: ModelManagerService,
    private readonly processManagerService: ProcessManagerService,
    private readonly configGenerator: ConfigGenerator,
  ) {}

  // ==================== 配置文件生成器 ====================

  @Post('config/generate')
  @ApiOperation({ summary: '生成训练配置文件' })
  @ApiResponse({ status: 201, description: '配置文件生成成功' })
  async generateConfig(
    @Body() config: TrainingSessionConfigDto,
  ): Promise<{ configPath: string; content: string }> {
    try {
      const configPath = await this.configGenerator.generateTomlConfig(config);
      const content = await this.readConfigFile(configPath);
      
      this.logger.log(`Generated config for session: ${config.sessionName}`);
      return { configPath, content };
    } catch (error) {
      this.logger.error('Failed to generate config:', error);
      throw new HttpException(
        `Failed to generate config: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('config/templates')
  @ApiOperation({ summary: '获取配置模板列表' })
  @ApiResponse({ status: 200, description: '模板列表获取成功' })
  async getConfigTemplates() {
    try {
      const templates = this.configGenerator.getAllTemplates();
      return { templates };
    } catch (error) {
      this.logger.error('Failed to get templates:', error);
      throw new HttpException(
        'Failed to get templates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('config/templates/:name')
  @ApiOperation({ summary: '获取指定配置模板' })
  @ApiResponse({ status: 200, description: '模板获取成功' })
  async getConfigTemplate(@Param('name') name: string) {
    try {
      const template = this.configGenerator.getTemplate(name);
      if (!template) {
        throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
      }
      return { template };
    } catch (error) {
      this.logger.error(`Failed to get template ${name}:`, error);
      throw new HttpException(
        error.message || 'Failed to get template',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('config/from-template')
  @ApiOperation({ summary: '基于模板生成配置' })
  @ApiResponse({ status: 201, description: '基于模板的配置生成成功' })
  async generateFromTemplate(
    @Body() body: { templateName: string; overrides: Partial<TrainingSessionConfigDto> },
  ): Promise<{ config: TrainingSessionConfigDto; configPath: string }> {
    try {
      const config = this.configGenerator.generateFromTemplate(
        body.templateName,
        body.overrides,
      );
      const configPath = await this.configGenerator.generateTomlConfig(config);
      
      this.logger.log(`Generated config from template: ${body.templateName}`);
      return { config, configPath };
    } catch (error) {
      this.logger.error('Failed to generate config from template:', error);
      throw new HttpException(
        `Failed to generate config from template: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 训练会话管理 ====================

  @Post('training/start')
  @ApiOperation({ summary: '启动训练会话' })
  @ApiResponse({ status: 201, description: '训练会话启动成功' })
  async startTraining(
    @Body() config: TrainingSessionConfigDto,
  ): Promise<{ sessionId: string; status: string }> {
    try {
      // 转换DTO为TrainingConfig
      const trainingConfig = {
        modelName: config.model?.name || 'default',
        datasetPath: config.data?.datasetPath || '',
        outputPath: config.output?.outputPath || '',
        epochs: config.training?.epochs || 1,
        batchSize: config.training?.batchSize || 32,
        learningRate: config.training?.learningRate || 0.001,
        distributed: config.distributed?.enabled || false,
        nodes: config.distributed?.nodes,
        gpuIds: config.hardware?.gpuIds,
        checkpointInterval: config.training?.checkpointInterval,
        logLevel: config.logging?.level as any,
        customArgs: config.customArgs,
      };
      const sessionId = await this.trainingExecutorService.startTraining(trainingConfig);
      const session = await this.trainingExecutorService.getTrainingSession(sessionId);
      
      this.logger.log(`Started training session: ${sessionId}`);
      return { sessionId, status: session.status };
    } catch (error) {
      this.logger.error('Failed to start training:', error);
      throw new HttpException(
        `Failed to start training: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('training/:sessionId/stop')
  @ApiOperation({ summary: '停止训练会话' })
  @ApiResponse({ status: 200, description: '训练会话停止成功' })
  async stopTraining(@Param('sessionId') sessionId: string): Promise<{ success: boolean }> {
    try {
      await this.trainingExecutorService.stopTraining(sessionId);
      this.logger.log(`Stopped training session: ${sessionId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to stop training ${sessionId}:`, error);
      throw new HttpException(
        `Failed to stop training: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('training/:sessionId/pause')
  @ApiOperation({ summary: '暂停训练会话' })
  @ApiResponse({ status: 200, description: '训练会话暂停成功' })
  async pauseTraining(@Param('sessionId') sessionId: string): Promise<{ success: boolean }> {
    try {
      await this.trainingExecutorService.pauseTraining(sessionId);
      this.logger.log(`Paused training session: ${sessionId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to pause training ${sessionId}:`, error);
      throw new HttpException(
        `Failed to pause training: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('training/:sessionId/resume')
  @ApiOperation({ summary: '恢复训练会话' })
  @ApiResponse({ status: 200, description: '训练会话恢复成功' })
  async resumeTraining(@Param('sessionId') sessionId: string): Promise<{ success: boolean }> {
    try {
      await this.trainingExecutorService.resumeTraining(sessionId);
      this.logger.log(`Resumed training session: ${sessionId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to resume training ${sessionId}:`, error);
      throw new HttpException(
        `Failed to resume training: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('training/:sessionId')
  @ApiOperation({ summary: '获取训练会话信息' })
  @ApiResponse({ status: 200, description: '训练会话信息获取成功' })
  async getTrainingSession(@Param('sessionId') sessionId: string): Promise<TrainingSession> {
    try {
      const session = await this.trainingExecutorService.getTrainingSession(sessionId);
      if (!session) {
        throw new HttpException('Training session not found', HttpStatus.NOT_FOUND);
      }
      return session;
    } catch (error) {
      this.logger.error(`Failed to get training session ${sessionId}:`, error);
      throw new HttpException(
        error.message || 'Failed to get training session',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('training')
  @ApiOperation({ summary: '获取所有训练会话' })
  @ApiResponse({ status: 200, description: '训练会话列表获取成功' })
  async getAllTrainingSessions(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ sessions: TrainingSession[]; total: number }> {
    try {
      const sessions = await this.trainingExecutorService.getAllSessions({
        limit: limit || 50,
        offset: offset || 0,
      });
      return sessions;
    } catch (error) {
      this.logger.error('Failed to get training sessions:', error);
      throw new HttpException(
        'Failed to get training sessions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('training/:sessionId/logs')
  @ApiOperation({ summary: '获取训练日志' })
  @ApiResponse({ status: 200, description: '训练日志获取成功' })
  async getTrainingLogs(
    @Param('sessionId') sessionId: string,
    @Query('lines') lines?: number,
    @Query('follow') follow?: boolean,
  ): Promise<{ logs: string[]; isComplete: boolean }> {
    try {
      // TODO: Implement log retrieval
      const logs = { logs: [], isComplete: true };
      return logs;
    } catch (error) {
      this.logger.error(`Failed to get logs for session ${sessionId}:`, error);
      throw new HttpException(
        'Failed to get training logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('training/:sessionId/metrics')
  @ApiOperation({ summary: '获取训练指标' })
  @ApiResponse({ status: 200, description: '训练指标获取成功' })
  async getTrainingMetrics(
    @Param('sessionId') sessionId: string,
  ): Promise<{ metrics: Record<string, any>; lastUpdated: Date }> {
    try {
      // TODO: Implement metrics retrieval
      const metrics = { metrics: {}, lastUpdated: new Date() };
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get metrics for session ${sessionId}:`, error);
      throw new HttpException(
        'Failed to get training metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 模型管理 ====================

  @Post('models/register')
  @ApiOperation({ summary: '注册模型' })
  @ApiResponse({ status: 201, description: '模型注册成功' })
  async registerModel(
    @Body() modelInfo: Omit<ModelMetadata, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<{ modelId: string }> {
    try {
      const modelId = await this.modelManagerService.registerModel(
        modelInfo.name,
        modelInfo.filePath || '',
        modelInfo
      );
      this.logger.log(`Registered model: ${modelId}`);
      return { modelId };
    } catch (error) {
      this.logger.error('Failed to register model:', error);
      throw new HttpException(
        `Failed to register model: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('models')
  @ApiOperation({ summary: '获取模型列表' })
  @ApiResponse({ status: 200, description: '模型列表获取成功' })
  async getModels(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('tags') tags?: string,
  ): Promise<{ models: ModelMetadata[]; total: number }> {
    try {
      const allModels = this.modelManagerService.getAllModels();
      
      // 应用过滤
      let filteredModels = allModels;
      if (search) {
        filteredModels = filteredModels.filter(m => m.name.includes(search) || m.description?.includes(search));
      }
      if (tags) {
        const tagArray = tags.split(',').map(t => t.trim());
        filteredModels = filteredModels.filter(m => 
          m.tags && tagArray.some(tag => m.tags.includes(tag))
        );
      }
      
      // 分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const models = filteredModels.slice(startIndex, endIndex);
      
      return {
        models,
        total: filteredModels.length,
      };
    } catch (error) {
      this.logger.error('Failed to get models:', error);
      throw new HttpException(
        `Failed to get models: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('models/:modelId')
  @ApiOperation({ summary: '获取模型详情' })
  @ApiResponse({ status: 200, description: '模型详情获取成功' })
  async getModel(@Param('modelId') modelId: string): Promise<ModelMetadata> {
    try {
      const model = await this.modelManagerService.getModel(modelId);
      if (!model) {
        throw new HttpException('Model not found', HttpStatus.NOT_FOUND);
      }
      return model;
    } catch (error) {
      this.logger.error(`Failed to get model ${modelId}:`, error);
      throw new HttpException(
        error.message || 'Failed to get model',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('models/:modelId')
  @ApiOperation({ summary: '更新模型信息' })
  @ApiResponse({ status: 200, description: '模型更新成功' })
  async updateModel(
    @Param('modelId') modelId: string,
    @Body() updates: Partial<ModelMetadata>,
  ): Promise<{ success: boolean }> {
    try {
      await this.modelManagerService.updateModel(modelId, updates);
      this.logger.log(`Updated model: ${modelId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to update model ${modelId}:`, error);
      throw new HttpException(
        `Failed to update model: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('models/:modelId')
  @ApiOperation({ summary: '删除模型' })
  @ApiResponse({ status: 200, description: '模型删除成功' })
  async deleteModel(@Param('modelId') modelId: string): Promise<{ success: boolean }> {
    try {
      await this.modelManagerService.deleteModel(modelId);
      this.logger.log(`Deleted model: ${modelId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete model ${modelId}:`, error);
      throw new HttpException(
        `Failed to delete model: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('models/:modelId/export')
  @ApiOperation({ summary: '导出模型' })
  @ApiResponse({ status: 200, description: '模型导出成功' })
  async exportModel(
    @Param('modelId') modelId: string,
    @Body() options: { format?: 'original' | 'onnx' | 'tensorrt'; outputPath: string },
  ): Promise<{ exportPath: string }> {
    try {
      const format = options.format || 'original';
      await this.modelManagerService.exportModel(
        modelId,
        options.outputPath,
        format,
      );
      this.logger.log(`Exported model ${modelId} to: ${options.outputPath}`);
      return { exportPath: options.outputPath };
    } catch (error) {
      this.logger.error(`Failed to export model ${modelId}:`, error);
      throw new HttpException(
        `Failed to export model: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('models/upload')
  @ApiOperation({ summary: '上传模型文件' })
  @ApiResponse({ status: 201, description: '模型文件上传成功' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadModel(
    @UploadedFile() file: any,
    @Body() metadata: { name: string; description?: string; architecture: string },
  ): Promise<{ modelId: string; message: string }> {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      const result = await this.modelManagerService.uploadModel(file, metadata);
      this.logger.log(`Uploaded model file: ${result.modelId}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to upload model:', error);
      throw new HttpException(
        `Failed to upload model: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 进程管理 ====================

  @Get('processes')
  @ApiOperation({ summary: '获取所有进程状态' })
  @ApiResponse({ status: 200, description: '进程状态获取成功' })
  async getProcesses(): Promise<{ processes: any[] }> {
    try {
      const processes = this.processManagerService.getAllProcesses();
      return { processes };
    } catch (error) {
      this.logger.error('Failed to get processes:', error);
      throw new HttpException(
        'Failed to get processes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('processes/:processId')
  @ApiOperation({ summary: '获取进程状态' })
  @ApiResponse({ status: 200, description: '进程状态获取成功' })
  async getProcess(@Param('processId') processId: string): Promise<any> {
    try {
      const process = this.processManagerService.getProcessInfo(processId);
      if (!process) {
        throw new HttpException('Process not found', HttpStatus.NOT_FOUND);
      }
      return process;
    } catch (error) {
      this.logger.error(`Failed to get process ${processId}:`, error);
      throw new HttpException(
        error.message || 'Failed to get process',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('processes/:processId/stop')
  @ApiOperation({ summary: '停止进程' })
  @ApiResponse({ status: 200, description: '进程停止成功' })
  async stopProcess(@Param('processId') processId: string): Promise<{ success: boolean }> {
    try {
      await this.processManagerService.stopPythonProcess(processId);
      this.logger.log(`Stopped process: ${processId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to stop process ${processId}:`, error);
      throw new HttpException(
        `Failed to stop process: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('processes/cleanup')
  @ApiOperation({ summary: '清理所有进程' })
  @ApiResponse({ status: 200, description: '进程清理成功' })
  async cleanupProcesses(): Promise<{ cleaned: number }> {
    try {
      const beforeCount = this.processManagerService.getAllProcesses().length;
      this.processManagerService.cleanupProcesses();
      const afterCount = this.processManagerService.getAllProcesses().length;
      const cleaned = beforeCount - afterCount;
      this.logger.log(`Cleaned up ${cleaned} processes`);
      return { cleaned };
    } catch (error) {
      this.logger.error('Failed to cleanup processes:', error);
      throw new HttpException(
        'Failed to cleanup processes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 系统状态 ====================

  @Get('status')
  @ApiOperation({ summary: '获取系统状态' })
  @ApiResponse({ status: 200, description: '系统状态获取成功' })
  async getSystemStatus(): Promise<{
    status: string;
    activeProcesses: number;
    activeSessions: number;
    systemResources: any;
  }> {
    try {
      const processes = this.processManagerService.getAllProcesses();
      const sessions = await this.trainingExecutorService.getAllSessions({ limit: 1000 });
      
      const activeProcesses = processes.filter(p => p.status === 'running').length;
      const activeSessions = sessions.sessions.filter(
        s => s.status === 'running'
      ).length;

      return {
        status: 'healthy',
        activeProcesses,
        activeSessions,
        systemResources: await this.getSystemResources(),
      };
    } catch (error) {
      this.logger.error('Failed to get system status:', error);
      throw new HttpException(
        'Failed to get system status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 辅助方法 ====================

  private async readConfigFile(configPath: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(configPath, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to read config file ${configPath}:`, error);
      throw new Error(`Failed to read config file: ${error.message}`);
    }
  }

  private async getSystemResources(): Promise<any> {
    try {
      const os = await import('os');
      return {
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
      };
    } catch (error) {
      this.logger.error('Failed to get system resources:', error);
      return {};
    }
  }
}