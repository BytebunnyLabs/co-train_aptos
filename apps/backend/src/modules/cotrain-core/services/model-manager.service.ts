import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  architecture: string;
  parameters: number;
  size: number; // 文件大小（字节）
  checksum: string;
  createdAt: Date;
  updatedAt: Date;
  trainingSessionId?: string;
  tags: string[];
  metrics?: {
    accuracy?: number;
    loss?: number;
    f1Score?: number;
    [key: string]: any;
  };
  filePath: string;
  configPath?: string;
  isActive: boolean;
}

export interface ModelVersion {
  version: string;
  modelId: string;
  checksum: string;
  size: number;
  createdAt: Date;
  metrics?: Record<string, any>;
  notes?: string;
}

@Injectable()
export class ModelManagerService {
  private readonly logger = new Logger(ModelManagerService.name);
  private readonly modelsPath = path.join(process.env.SHARED_PATH || '/app/shared', 'models');
  private readonly metadataPath = path.join(this.modelsPath, 'metadata.json');
  private models: Map<string, ModelMetadata> = new Map();
  private modelVersions: Map<string, ModelVersion[]> = new Map();

  constructor() {
    this.initializeStorage();
  }

  /**
   * 初始化存储
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.modelsPath, { recursive: true });
      await this.loadMetadata();
      this.logger.log('Model storage initialized');
    } catch (error) {
      this.logger.error('Failed to initialize model storage:', error);
    }
  }

  /**
   * 加载模型元数据
   */
  private async loadMetadata(): Promise<void> {
    try {
      const data = await fs.readFile(this.metadataPath, 'utf-8');
      const metadata = JSON.parse(data);
      
      if (metadata.models) {
        for (const model of metadata.models) {
          this.models.set(model.id, {
            ...model,
            createdAt: new Date(model.createdAt),
            updatedAt: new Date(model.updatedAt),
          });
        }
      }
      
      if (metadata.versions) {
        for (const [modelId, versions] of Object.entries(metadata.versions)) {
          this.modelVersions.set(modelId, (versions as any[]).map(v => ({
            ...v,
            createdAt: new Date(v.createdAt),
          })));
        }
      }
      
      this.logger.log(`Loaded ${this.models.size} models from metadata`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error('Failed to load metadata:', error);
      }
    }
  }

  /**
   * 保存模型元数据
   */
  private async saveMetadata(): Promise<void> {
    try {
      const metadata = {
        models: Array.from(this.models.values()),
        versions: Object.fromEntries(this.modelVersions.entries()),
        lastUpdated: new Date().toISOString(),
      };
      
      await fs.writeFile(this.metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      this.logger.error('Failed to save metadata:', error);
      throw error;
    }
  }

  /**
   * 注册新模型
   */
  async registerModel(
    name: string,
    filePath: string,
    metadata: Partial<ModelMetadata>,
  ): Promise<string> {
    const modelId = uuidv4();
    
    try {
      // 验证文件存在
      await fs.access(filePath);
      
      // 计算文件大小和校验和
      const stats = await fs.stat(filePath);
      const checksum = await this.calculateChecksum(filePath);
      
      // 创建模型目录
      const modelDir = path.join(this.modelsPath, modelId);
      await fs.mkdir(modelDir, { recursive: true });
      
      // 复制模型文件到管理目录
      const targetPath = path.join(modelDir, `${name}.model`);
      await this.copyFile(filePath, targetPath);
      
      const model: ModelMetadata = {
        id: modelId,
        name,
        version: metadata.version || '1.0.0',
        description: metadata.description,
        architecture: metadata.architecture || 'unknown',
        parameters: metadata.parameters || 0,
        size: stats.size,
        checksum,
        createdAt: new Date(),
        updatedAt: new Date(),
        trainingSessionId: metadata.trainingSessionId,
        tags: metadata.tags || [],
        metrics: metadata.metrics,
        filePath: targetPath,
        configPath: metadata.configPath,
        isActive: true,
      };
      
      this.models.set(modelId, model);
      
      // 添加版本记录
      const version: ModelVersion = {
        version: model.version,
        modelId,
        checksum,
        size: stats.size,
        createdAt: new Date(),
        metrics: metadata.metrics,
      };
      
      const versions = this.modelVersions.get(modelId) || [];
      versions.push(version);
      this.modelVersions.set(modelId, versions);
      
      await this.saveMetadata();
      
      this.logger.log(`Registered model ${name} with ID ${modelId}`);
      return modelId;
    } catch (error) {
      this.logger.error(`Failed to register model ${name}:`, error);
      throw error;
    }
  }

  /**
   * 获取模型信息
   */
  getModel(modelId: string): ModelMetadata | undefined {
    return this.models.get(modelId);
  }

  /**
   * 获取所有模型
   */
  getAllModels(): ModelMetadata[] {
    return Array.from(this.models.values());
  }

  /**
   * 按名称搜索模型
   */
  searchModels(query: string): ModelMetadata[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.models.values()).filter(
      model => 
        model.name.toLowerCase().includes(lowerQuery) ||
        model.description?.toLowerCase().includes(lowerQuery) ||
        model.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 按标签过滤模型
   */
  getModelsByTags(tags: string[]): ModelMetadata[] {
    return Array.from(this.models.values()).filter(
      model => tags.some(tag => model.tags.includes(tag))
    );
  }

  /**
   * 获取活跃模型
   */
  getActiveModels(): ModelMetadata[] {
    return Array.from(this.models.values()).filter(model => model.isActive);
  }

  /**
   * 更新模型元数据
   */
  async updateModel(
    modelId: string,
    updates: Partial<ModelMetadata>,
  ): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const updatedModel = {
      ...model,
      ...updates,
      id: modelId, // 确保ID不被修改
      updatedAt: new Date(),
    };

    this.models.set(modelId, updatedModel);
    await this.saveMetadata();
    
    this.logger.log(`Updated model ${modelId}`);
  }

  /**
   * 删除模型
   */
  async deleteModel(modelId: string, deleteFiles = true): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    try {
      if (deleteFiles) {
        // 删除模型文件
        const modelDir = path.dirname(model.filePath);
        await fs.rm(modelDir, { recursive: true, force: true });
      }
      
      // 从内存中移除
      this.models.delete(modelId);
      this.modelVersions.delete(modelId);
      
      await this.saveMetadata();
      
      this.logger.log(`Deleted model ${modelId}`);
    } catch (error) {
      this.logger.error(`Failed to delete model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * 创建模型版本
   */
  async createModelVersion(
    modelId: string,
    version: string,
    filePath: string,
    metrics?: Record<string, any>,
    notes?: string,
  ): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    try {
      // 验证文件存在
      await fs.access(filePath);
      
      const stats = await fs.stat(filePath);
      const checksum = await this.calculateChecksum(filePath);
      
      // 创建版本目录
      const versionDir = path.join(path.dirname(model.filePath), 'versions', version);
      await fs.mkdir(versionDir, { recursive: true });
      
      // 复制文件
      const targetPath = path.join(versionDir, `${model.name}_v${version}.model`);
      await this.copyFile(filePath, targetPath);
      
      const modelVersion: ModelVersion = {
        version,
        modelId,
        checksum,
        size: stats.size,
        createdAt: new Date(),
        metrics,
        notes,
      };
      
      const versions = this.modelVersions.get(modelId) || [];
      versions.push(modelVersion);
      this.modelVersions.set(modelId, versions);
      
      // 更新模型的当前版本
      await this.updateModel(modelId, { version });
      
      this.logger.log(`Created version ${version} for model ${modelId}`);
    } catch (error) {
      this.logger.error(`Failed to create model version:`, error);
      throw error;
    }
  }

  /**
   * 获取模型版本列表
   */
  getModelVersions(modelId: string): ModelVersion[] {
    return this.modelVersions.get(modelId) || [];
  }

  /**
   * 比较模型性能
   */
  compareModels(modelIds: string[]): any {
    const models = modelIds.map(id => this.models.get(id)).filter(Boolean);
    
    if (models.length === 0) {
      throw new Error('No valid models found for comparison');
    }

    const comparison = {
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        version: model.version,
        parameters: model.parameters,
        size: model.size,
        metrics: model.metrics,
      })),
      summary: {
        totalModels: models.length,
        avgParameters: models.reduce((sum, m) => sum + m.parameters, 0) / models.length,
        avgSize: models.reduce((sum, m) => sum + m.size, 0) / models.length,
      },
    };

    return comparison;
  }

  /**
   * 导出模型
   */
  async exportModel(
    modelId: string,
    targetPath: string,
    format: 'original' | 'onnx' | 'tensorrt' = 'original',
  ): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    try {
      if (format === 'original') {
        await this.copyFile(model.filePath, targetPath);
      } else {
        // TODO: 实现模型格式转换
        throw new Error(`Export format ${format} not yet implemented`);
      }
      
      this.logger.log(`Exported model ${modelId} to ${targetPath}`);
    } catch (error) {
      this.logger.error(`Failed to export model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * 获取模型统计信息
   */
  getModelStatistics(): any {
    const models = Array.from(this.models.values());
    
    return {
      totalModels: models.length,
      activeModels: models.filter(m => m.isActive).length,
      totalSize: models.reduce((sum, m) => sum + m.size, 0),
      architectures: [...new Set(models.map(m => m.architecture))],
      avgParameters: models.reduce((sum, m) => sum + m.parameters, 0) / models.length,
      recentModels: models
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
    };
  }

  /**
   * 计算文件校验和
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * 上传模型文件
   */
  async uploadModel(
    file: any,
    metadata: Partial<ModelMetadata>,
  ): Promise<{ modelId: string; message: string }> {
    try {
      // 创建临时文件路径
      const tempPath = path.join(this.modelsPath, 'temp', file.originalname);
      await fs.mkdir(path.dirname(tempPath), { recursive: true });
      
      // 保存上传的文件
      await fs.writeFile(tempPath, file.buffer);
      
      // 注册模型
      const modelId = await this.registerModel(
        metadata.name || file.originalname,
        tempPath,
        metadata,
      );
      
      // 清理临时文件
      await fs.unlink(tempPath);
      
      return {
        modelId,
        message: 'Model uploaded successfully',
      };
    } catch (error) {
      this.logger.error('Failed to upload model:', error);
      throw error;
    }
  }

  /**
   * 获取模型统计信息
   */
  getModelStats(): {
    totalModels: number;
    totalSize: number;
    averageSize: number;
    modelsByType: Record<string, number>;
  } {
    const models = this.getAllModels();
    const totalModels = models.length;
    const totalSize = models.reduce((sum, model) => sum + model.size, 0);
    const averageSize = totalModels > 0 ? totalSize / totalModels : 0;

    const modelsByType = models.reduce((acc, model) => {
      const type = model.architecture || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalModels,
      totalSize,
      averageSize,
      modelsByType,
    };
  }

  /**
   * 复制文件
   */
  private async copyFile(source: string, target: string): Promise<void> {
    await pipeline(
      createReadStream(source),
      createWriteStream(target)
    );
  }
}