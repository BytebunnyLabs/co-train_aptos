import { Module } from '@nestjs/common';
import { CotrainCoreController } from './cotrain-core.controller';
import { CotrainCoreService } from './services/cotrain-core.service';
import { TrainingExecutorService } from './services/training-executor.service';
import { ModelManagerService } from './services/model-manager.service';
import { ProcessManagerService } from './services/process-manager.service';
import { ConfigGenerator } from './utils/config-generator';

@Module({
  controllers: [CotrainCoreController],
  providers: [
    ProcessManagerService,
    CotrainCoreService,
    TrainingExecutorService,
    ModelManagerService,
    ConfigGenerator,
  ],
  exports: [
    ProcessManagerService,
    CotrainCoreService,
    TrainingExecutorService,
    ModelManagerService,
    ConfigGenerator,
  ],
})
export class CotrainCoreModule {}