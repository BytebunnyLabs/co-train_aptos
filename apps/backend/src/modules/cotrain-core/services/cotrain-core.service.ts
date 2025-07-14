import { Injectable, Logger } from '@nestjs/common';
import { ModelManagerService } from './model-manager.service';
import { ConfigGenerator } from '../utils/config-generator';

@Injectable()
export class CotrainCoreService {
  private readonly logger = new Logger(CotrainCoreService.name);

  constructor(
    private readonly modelManagerService: ModelManagerService,
    private readonly configGenerator: ConfigGenerator,
  ) {}

  async getSystemStatus() {
    try {
      const allModels = this.modelManagerService.getAllModels();
      const modelStats = {
        total: allModels.length,
        active: allModels.filter(m => m.isActive).length,
      };
      
      return {
        training: {
          totalSessions: 0,
          activeSessions: 0,
          completedSessions: 0,
        },
        models: modelStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get system status:', error);
      throw error;
    }
  }

  async generateConfig(template: string, params: any) {
    try {
      return await this.configGenerator.generateFromTemplate(template, params);
    } catch (error) {
      this.logger.error('Failed to generate config:', error);
      throw error;
    }
  }

  async getConfigTemplates() {
    try {
      return this.configGenerator.getAllTemplates();
    } catch (error) {
      this.logger.error('Failed to get config templates:', error);
      throw error;
    }
  }
}