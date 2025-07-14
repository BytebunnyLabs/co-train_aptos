import { Injectable, Logger } from '@nestjs/common';
import { TrainingSessionConfigDto, ModelArchitecture, OptimizationType, SchedulerType, LogLevel } from '../dto/training-session-config.dto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export interface ConfigTemplate {
  name: string;
  description: string;
  architecture: ModelArchitecture;
  defaultConfig: Partial<TrainingSessionConfigDto>;
  requiredFields: string[];
  validationRules?: Record<string, any>;
}

@Injectable()
export class ConfigGenerator {
  private readonly logger = new Logger(ConfigGenerator.name);
  private readonly templatesPath = path.join(process.env.SHARED_PATH || '/app/shared', 'templates');
  private templates: Map<string, ConfigTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * 初始化配置模板
   */
  private async initializeTemplates(): Promise<void> {
    try {
      await fs.mkdir(this.templatesPath, { recursive: true });
      await this.loadDefaultTemplates();
      this.logger.log('Configuration templates initialized');
    } catch (error) {
      this.logger.error('Failed to initialize templates:', error);
    }
  }

  /**
   * 加载默认模板
   */
  private async loadDefaultTemplates(): Promise<void> {
    const defaultTemplates: ConfigTemplate[] = [
      {
        name: 'transformer-base',
        description: 'Base Transformer model configuration',
        architecture: ModelArchitecture.TRANSFORMER,
        defaultConfig: {
          model: {
            name: 'transformer-base',
            architecture: ModelArchitecture.TRANSFORMER,
            hiddenSize: 768,
            numAttentionHeads: 12,
            numLayers: 12,
            maxSequenceLength: 512,
          },
          training: {
            epochs: 10,
            batchSize: 32,
            learningRate: 0.0001,
            optimizer: OptimizationType.ADAMW,
            scheduler: SchedulerType.LINEAR,
            weightDecay: 0.01,
            warmupSteps: 1000,
            checkpointInterval: 100,
          },
          hardware: {
            gpuIds: [0],
            mixedPrecision: true,
          },
          logging: {
            level: LogLevel.INFO,
            enableTensorboard: true,
          },
        },
        requiredFields: ['model.name', 'training.epochs', 'training.batchSize', 'training.learningRate'],
      },
      {
        name: 'gpt-small',
        description: 'Small GPT model configuration',
        architecture: ModelArchitecture.GPT,
        defaultConfig: {
          model: {
            name: 'gpt-small',
            architecture: ModelArchitecture.GPT,
            hiddenSize: 512,
            numAttentionHeads: 8,
            numLayers: 6,
            maxSequenceLength: 1024,
          },
          training: {
            epochs: 20,
            batchSize: 16,
            learningRate: 0.0003,
            optimizer: OptimizationType.ADAM,
            scheduler: SchedulerType.COSINE,
            checkpointInterval: 200,
          },
        },
        requiredFields: ['model.name', 'training.epochs', 'training.batchSize'],
      },
      {
        name: 'bert-base',
        description: 'BERT base model configuration',
        architecture: ModelArchitecture.BERT,
        defaultConfig: {
          model: {
            name: 'bert-base',
            architecture: ModelArchitecture.BERT,
            hiddenSize: 768,
            numAttentionHeads: 12,
            numLayers: 12,
            vocabSize: 30522,
            maxSequenceLength: 512,
          },
          training: {
            epochs: 3,
            batchSize: 16,
            learningRate: 0.00002,
            optimizer: OptimizationType.ADAMW,
            scheduler: SchedulerType.LINEAR,
            weightDecay: 0.01,
            warmupSteps: 500,
          },
        },
        requiredFields: ['model.name', 'data.datasetPath'],
      },
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.name, template);
    }
  }

  /**
   * 生成TOML配置文件
   */
  async generateTomlConfig(
    config: TrainingSessionConfigDto,
    outputPath?: string,
  ): Promise<string> {
    try {
      // 验证配置
      this.validateConfig(config);

      // 生成TOML内容
      const tomlContent = this.buildTomlContent(config);

      // 确定输出路径
      const configPath = outputPath || path.join(
        process.env.SHARED_PATH || '/app/shared',
        'configs',
        `${config.sessionName || uuidv4()}.toml`
      );

      // 确保目录存在
      await fs.mkdir(path.dirname(configPath), { recursive: true });

      // 写入文件
      await fs.writeFile(configPath, tomlContent, 'utf-8');

      this.logger.log(`Generated TOML config: ${configPath}`);
      return configPath;
    } catch (error) {
      this.logger.error('Failed to generate TOML config:', error);
      throw error;
    }
  }

  /**
   * 构建TOML内容
   */
  private buildTomlContent(config: TrainingSessionConfigDto): string {
    const sections: string[] = [];

    // 添加头部注释
    sections.push(this.generateHeader(config));

    // 模型配置
    sections.push(this.generateModelSection(config.model));

    // 训练配置
    sections.push(this.generateTrainingSection(config.training));

    // 数据配置
    sections.push(this.generateDataSection(config.data));

    // 输出配置
    sections.push(this.generateOutputSection(config.output));

    // 硬件配置
    if (config.hardware) {
      sections.push(this.generateHardwareSection(config.hardware));
    }

    // 分布式配置
    if (config.distributed) {
      sections.push(this.generateDistributedSection(config.distributed));
    }

    // 日志配置
    if (config.logging) {
      sections.push(this.generateLoggingSection(config.logging));
    }

    // 自定义参数
    if (config.customArgs) {
      sections.push(this.generateCustomSection(config.customArgs));
    }

    return sections.join('\n\n');
  }

  /**
   * 生成头部注释
   */
  private generateHeader(config: TrainingSessionConfigDto): string {
    return `# CotrainCore Training Configuration
# Session: ${config.sessionName}
# Generated: ${new Date().toISOString()}
${config.description ? `# Description: ${config.description}` : ''}
${config.tags ? `# Tags: ${config.tags.join(', ')}` : ''}`;
  }

  /**
   * 生成模型配置段
   */
  private generateModelSection(model: any): string {
    const lines = ['[model]'];
    
    lines.push(`name = "${model.name}"`);
    lines.push(`architecture = "${model.architecture}"`);
    
    if (model.pretrainedPath) {
      lines.push(`pretrained_path = "${model.pretrainedPath}"`);
    }
    
    if (model.parameters) {
      lines.push(`parameters = ${model.parameters}`);
    }
    
    if (model.hiddenSize) {
      lines.push(`hidden_size = ${model.hiddenSize}`);
    }
    
    if (model.numAttentionHeads) {
      lines.push(`num_attention_heads = ${model.numAttentionHeads}`);
    }
    
    if (model.numLayers) {
      lines.push(`num_layers = ${model.numLayers}`);
    }
    
    if (model.vocabSize) {
      lines.push(`vocab_size = ${model.vocabSize}`);
    }
    
    if (model.maxSequenceLength) {
      lines.push(`max_sequence_length = ${model.maxSequenceLength}`);
    }

    return lines.join('\n');
  }

  /**
   * 生成训练配置段
   */
  private generateTrainingSection(training: any): string {
    const lines = ['[training]'];
    
    lines.push(`epochs = ${training.epochs}`);
    lines.push(`batch_size = ${training.batchSize}`);
    lines.push(`learning_rate = ${training.learningRate}`);
    
    if (training.optimizer) {
      lines.push(`optimizer = "${training.optimizer}"`);
    }
    
    if (training.scheduler) {
      lines.push(`scheduler = "${training.scheduler}"`);
    }
    
    if (training.weightDecay !== undefined) {
      lines.push(`weight_decay = ${training.weightDecay}`);
    }
    
    if (training.gradientClipping) {
      lines.push(`gradient_clipping = ${training.gradientClipping}`);
    }
    
    if (training.warmupSteps) {
      lines.push(`warmup_steps = ${training.warmupSteps}`);
    }
    
    if (training.checkpointInterval) {
      lines.push(`checkpoint_interval = ${training.checkpointInterval}`);
    }
    
    if (training.validationInterval) {
      lines.push(`validation_interval = ${training.validationInterval}`);
    }
    
    if (training.earlyStopping) {
      lines.push(`early_stopping = ${training.earlyStopping}`);
    }
    
    if (training.accumulationSteps) {
      lines.push(`accumulation_steps = ${training.accumulationSteps}`);
    }

    return lines.join('\n');
  }

  /**
   * 生成数据配置段
   */
  private generateDataSection(data: any): string {
    const lines = ['[data]'];
    
    lines.push(`dataset_path = "${data.datasetPath}"`);
    
    if (data.validationPath) {
      lines.push(`validation_path = "${data.validationPath}"`);
    }
    
    if (data.testPath) {
      lines.push(`test_path = "${data.testPath}"`);
    }
    
    if (data.numWorkers !== undefined) {
      lines.push(`num_workers = ${data.numWorkers}`);
    }
    
    if (data.shuffle !== undefined) {
      lines.push(`shuffle = ${data.shuffle}`);
    }
    
    if (data.preprocessingConfig) {
      lines.push('\n[data.preprocessing]');
      for (const [key, value] of Object.entries(data.preprocessingConfig)) {
        lines.push(`${key} = ${this.formatValue(value)}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 生成输出配置段
   */
  private generateOutputSection(output: any): string {
    const lines = ['[output]'];
    
    lines.push(`output_path = "${output.outputPath}"`);
    
    if (output.experimentName) {
      lines.push(`experiment_name = "${output.experimentName}"`);
    }
    
    if (output.saveBestModel !== undefined) {
      lines.push(`save_best_model = ${output.saveBestModel}`);
    }
    
    if (output.saveLastModel !== undefined) {
      lines.push(`save_last_model = ${output.saveLastModel}`);
    }
    
    if (output.saveFormats) {
      lines.push(`save_formats = [${output.saveFormats.map(f => `"${f}"`).join(', ')}]`);
    }

    return lines.join('\n');
  }

  /**
   * 生成硬件配置段
   */
  private generateHardwareSection(hardware: any): string {
    const lines = ['[hardware]'];
    
    if (hardware.gpuIds) {
      lines.push(`gpu_ids = [${hardware.gpuIds.join(', ')}]`);
    }
    
    if (hardware.cpuCores) {
      lines.push(`cpu_cores = ${hardware.cpuCores}`);
    }
    
    if (hardware.memoryLimit) {
      lines.push(`memory_limit = ${hardware.memoryLimit}`);
    }
    
    if (hardware.mixedPrecision !== undefined) {
      lines.push(`mixed_precision = ${hardware.mixedPrecision}`);
    }

    return lines.join('\n');
  }

  /**
   * 生成分布式配置段
   */
  private generateDistributedSection(distributed: any): string {
    const lines = ['[distributed]'];
    
    lines.push(`enabled = ${distributed.enabled}`);
    
    if (distributed.nodes) {
      lines.push(`nodes = [${distributed.nodes.map(n => `"${n}"`).join(', ')}]`);
    }
    
    if (distributed.masterNode) {
      lines.push(`master_node = "${distributed.masterNode}"`);
    }
    
    if (distributed.backend) {
      lines.push(`backend = "${distributed.backend}"`);
    }
    
    if (distributed.worldSize) {
      lines.push(`world_size = ${distributed.worldSize}`);
    }
    
    if (distributed.rank !== undefined) {
      lines.push(`rank = ${distributed.rank}`);
    }

    return lines.join('\n');
  }

  /**
   * 生成日志配置段
   */
  private generateLoggingSection(logging: any): string {
    const lines = ['[logging]'];
    
    if (logging.level) {
      lines.push(`level = "${logging.level}"`);
    }
    
    if (logging.logPath) {
      lines.push(`log_path = "${logging.logPath}"`);
    }
    
    if (logging.enableTensorboard !== undefined) {
      lines.push(`enable_tensorboard = ${logging.enableTensorboard}`);
    }
    
    if (logging.tensorboardPath) {
      lines.push(`tensorboard_path = "${logging.tensorboardPath}"`);
    }
    
    if (logging.enableWandb !== undefined) {
      lines.push(`enable_wandb = ${logging.enableWandb}`);
    }
    
    if (logging.wandbProject) {
      lines.push(`wandb_project = "${logging.wandbProject}"`);
    }

    return lines.join('\n');
  }

  /**
   * 生成自定义配置段
   */
  private generateCustomSection(customArgs: Record<string, any>): string {
    const lines = ['[custom]'];
    
    for (const [key, value] of Object.entries(customArgs)) {
      lines.push(`${key} = ${this.formatValue(value)}`);
    }

    return lines.join('\n');
  }

  /**
   * 格式化值为TOML格式
   */
  private formatValue(value: any): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    } else if (typeof value === 'boolean') {
      return value.toString();
    } else if (typeof value === 'number') {
      return value.toString();
    } else if (Array.isArray(value)) {
      return `[${value.map(v => this.formatValue(v)).join(', ')}]`;
    } else if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * 验证配置
   */
  private validateConfig(config: TrainingSessionConfigDto): void {
    // 基本验证
    if (!config.model?.name) {
      throw new Error('Model name is required');
    }
    
    if (!config.training?.epochs || config.training.epochs <= 0) {
      throw new Error('Training epochs must be greater than 0');
    }
    
    if (!config.training?.batchSize || config.training.batchSize <= 0) {
      throw new Error('Batch size must be greater than 0');
    }
    
    if (!config.training?.learningRate || config.training.learningRate <= 0) {
      throw new Error('Learning rate must be greater than 0');
    }
    
    if (!config.data?.datasetPath) {
      throw new Error('Dataset path is required');
    }
    
    if (!config.output?.outputPath) {
      throw new Error('Output path is required');
    }

    // 硬件验证
    if (config.hardware?.gpuIds) {
      for (const gpuId of config.hardware.gpuIds) {
        if (gpuId < 0) {
          throw new Error('GPU IDs must be non-negative');
        }
      }
    }

    // 分布式验证
    if (config.distributed?.enabled) {
      if (config.distributed.worldSize && config.distributed.worldSize <= 0) {
        throw new Error('World size must be greater than 0');
      }
      
      if (config.distributed.rank !== undefined && config.distributed.rank < 0) {
        throw new Error('Rank must be non-negative');
      }
    }
  }

  /**
   * 获取配置模板
   */
  getTemplate(name: string): ConfigTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): ConfigTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 获取所有模板（别名方法）
   */
  getTemplates(): ConfigTemplate[] {
    return this.getAllTemplates();
  }

  /**
   * 添加自定义模板
   */
  addTemplate(template: ConfigTemplate): void {
    this.templates.set(template.name, template);
  }

  /**
   * 基于模板生成配置
   */
  generateFromTemplate(
    templateName: string,
    overrides: Partial<TrainingSessionConfigDto>,
  ): TrainingSessionConfigDto {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    // 深度合并配置
    const config = this.deepMerge(template.defaultConfig, overrides) as TrainingSessionConfigDto;
    
    // 验证必需字段
    this.validateRequiredFields(config, template.requiredFields);
    
    return config;
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * 验证必需字段
   */
  private validateRequiredFields(config: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      const value = this.getNestedValue(config, field);
      if (value === undefined || value === null || value === '') {
        throw new Error(`Required field ${field} is missing`);
      }
    }
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}