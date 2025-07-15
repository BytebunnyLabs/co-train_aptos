# CoTrain Aptos 分布式训练架构文档

## 概述

本文档说明 CoTrain Aptos 项目的分布式深度学习架构。项目已从独立的 `hivemind-service` 迁移到统一的 `CotrainCore` 架构，实现更好的集成和维护性。

## 项目背景

- **当前项目**: CoTrain Aptos - 基于区块链的协作训练平台
- **技术栈**: TypeScript, NestJS, React, PostgreSQL, Aptos 区块链, Python (CotrainCore)
- **架构变更**: 已移除独立的 `hivemind-service`，功能集成到 `CotrainCore` 中

## 架构变更说明

### 变更前 (已废弃)
- 独立的 `hivemind-service` Python 微服务
- 通过 HTTP API 与 NestJS 后端通信
- 复杂的服务间通信和状态同步

### 变更后 (当前架构)
- 统一的 `CotrainCore` Python 服务
- 直接集成分布式训练功能
- 简化的架构和更好的性能

## 当前架构

### 项目结构

```
cotrainai/
├── apps/
│   ├── backend/          # NestJS 后端 (包含 Hivemind 模块)
│   ├── frontend/         # React 前端
│   └── CotrainCore/      # 统一的 Python 训练服务
├── packages/
└── docker-compose.yml    # 容器编排
```

### 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   NestJS        │    │   CotrainCore   │
│   (React)       │◄──►│   Backend       │◄──►│   (Python)      │
│                 │    │   + Hivemind    │    │   + Hivemind    │
│                 │    │   Module        │    │   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis Cache   │    │   DHT Network   │
│   Database      │    │                 │    │   (P2P)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 实施步骤

### 步骤 1: 创建 Hivemind 微服务

#### 1.1 创建服务目录结构

```bash
mkdir apps/hivemind-service
cd apps/hivemind-service
```

创建以下文件结构：
```
hivemind-service/
├── Dockerfile
├── requirements.txt
├── main.py
├── api/
│   ├── __init__.py
│   ├── routes.py
│   └── models.py
├── config/
│   ├── __init__.py
│   └── settings.py
├── services/
│   ├── __init__.py
│   ├── hivemind_manager.py
│   └── training_service.py
└── utils/
    ├── __init__.py
    └── helpers.py
```

#### 1.2 依赖配置

**requirements.txt**:
```txt
hivemind>=1.1.0
fastapi>=0.68.0
uvicorn>=0.15.0
requests>=2.25.0
torch>=1.9.0
numpy>=1.21.0
pydantic>=1.8.0
aiohttp>=3.7.0
python-multipart>=0.0.5
```

### 步骤 2: 实现 FastAPI 服务

#### 2.1 主应用文件

**main.py**:
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from config.settings import settings
import uvicorn

app = FastAPI(
    title="Hivemind Service",
    description="分布式深度学习服务",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "hivemind"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
```

#### 2.2 API 路由

**api/routes.py**:
```python
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from services.hivemind_manager import HivemindManager
from services.training_service import TrainingService
from typing import Optional, Dict, Any

router = APIRouter()
hivemind_manager = HivemindManager()
training_service = TrainingService()

class TrainingRequest(BaseModel):
    model_config: Dict[str, Any]
    training_params: Dict[str, Any]
    dataset_info: Dict[str, Any]
    user_id: str
    task_id: str

class PeerInfo(BaseModel):
    peer_id: str
    address: str
    port: int

@router.post("/hivemind/start")
async def start_hivemind_server(background_tasks: BackgroundTasks):
    """启动 Hivemind 服务器"""
    try:
        result = await hivemind_manager.start_server()
        return {"status": "success", "message": "Hivemind server started", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hivemind/status")
async def get_hivemind_status():
    """获取 Hivemind 状态"""
    try:
        status = await hivemind_manager.get_status()
        return {"status": "success", "data": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hivemind/train")
async def submit_training_task(request: TrainingRequest, background_tasks: BackgroundTasks):
    """提交训练任务"""
    try:
        task_id = await training_service.submit_task(
            request.model_config,
            request.training_params,
            request.dataset_info,
            request.user_id,
            request.task_id
        )
        return {"status": "success", "task_id": task_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hivemind/peers")
async def get_connected_peers():
    """获取连接的节点列表"""
    try:
        peers = await hivemind_manager.get_peers()
        return {"status": "success", "data": peers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hivemind/peers/connect")
async def connect_to_peer(peer: PeerInfo):
    """连接到指定节点"""
    try:
        result = await hivemind_manager.connect_peer(
            peer.peer_id, peer.address, peer.port
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hivemind/training/{task_id}")
async def get_training_status(task_id: str):
    """获取训练任务状态"""
    try:
        status = await training_service.get_task_status(task_id)
        return {"status": "success", "data": status}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Task not found")
```

#### 2.3 Hivemind 管理器

**services/hivemind_manager.py**:
```python
import hivemind
import asyncio
from typing import Dict, List, Optional
from config.settings import settings

class HivemindManager:
    def __init__(self):
        self.dht = None
        self.server = None
        self.is_running = False
        
    async def start_server(self) -> Dict:
        """启动 Hivemind DHT 服务器"""
        if self.is_running:
            return {"message": "Server already running"}
            
        try:
            # 初始化 DHT
            self.dht = hivemind.DHT(
                start=True,
                initial_peers=settings.INITIAL_PEERS,
                host_maddrs=[f"/ip4/0.0.0.0/tcp/{settings.DHT_PORT}"],
                use_ipfs=False
            )
            
            # 启动服务器
            self.server = hivemind.Server(
                dht=self.dht,
                expert_backends={},  # 将根据需要添加专家
                host_maddrs=[f"/ip4/0.0.0.0/tcp/{settings.SERVER_PORT}"],
                start=True
            )
            
            self.is_running = True
            
            return {
                "dht_address": str(self.dht.get_visible_maddrs()),
                "server_address": str(self.server.get_visible_maddrs()),
                "peer_id": str(self.dht.peer_id)
            }
            
        except Exception as e:
            raise Exception(f"Failed to start Hivemind server: {str(e)}")
    
    async def get_status(self) -> Dict:
        """获取服务器状态"""
        if not self.is_running:
            return {"status": "stopped"}
            
        try:
            peers = await self.get_peers()
            return {
                "status": "running",
                "peer_id": str(self.dht.peer_id) if self.dht else None,
                "connected_peers": len(peers),
                "dht_size": len(peers) + 1
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def get_peers(self) -> List[Dict]:
        """获取连接的节点"""
        if not self.dht:
            return []
            
        try:
            # 获取 DHT 中的节点信息
            routing_table = self.dht.routing_table
            peers = []
            
            for bucket in routing_table.buckets:
                for peer_id, peer_info in bucket.items():
                    peers.append({
                        "peer_id": str(peer_id),
                        "address": str(peer_info.addrs[0]) if peer_info.addrs else "unknown",
                        "last_seen": peer_info.last_seen
                    })
                    
            return peers
        except Exception as e:
            raise Exception(f"Failed to get peers: {str(e)}")
    
    async def connect_peer(self, peer_id: str, address: str, port: int) -> Dict:
        """连接到指定节点"""
        if not self.dht:
            raise Exception("DHT not initialized")
            
        try:
            # 构建多地址
            maddr = f"/ip4/{address}/tcp/{port}"
            
            # 连接到节点
            await self.dht.add_peers([maddr])
            
            return {
                "peer_id": peer_id,
                "address": maddr,
                "status": "connected"
            }
        except Exception as e:
            raise Exception(f"Failed to connect to peer: {str(e)}")
    
    async def stop_server(self):
        """停止服务器"""
        if self.server:
            self.server.shutdown()
        if self.dht:
            self.dht.shutdown()
        self.is_running = False
```

#### 2.4 训练服务

**services/training_service.py**:
```python
import asyncio
import uuid
from typing import Dict, Any
from datetime import datetime

class TrainingService:
    def __init__(self):
        self.active_tasks = {}
        
    async def submit_task(
        self, 
        model_config: Dict[str, Any],
        training_params: Dict[str, Any],
        dataset_info: Dict[str, Any],
        user_id: str,
        external_task_id: str
    ) -> str:
        """提交训练任务"""
        
        task_id = str(uuid.uuid4())
        
        task_info = {
            "task_id": task_id,
            "external_task_id": external_task_id,
            "user_id": user_id,
            "model_config": model_config,
            "training_params": training_params,
            "dataset_info": dataset_info,
            "status": "submitted",
            "created_at": datetime.utcnow().isoformat(),
            "progress": 0.0,
            "logs": []
        }
        
        self.active_tasks[task_id] = task_info
        
        # 启动后台训练任务
        asyncio.create_task(self._run_training(task_id))
        
        return task_id
    
    async def get_task_status(self, task_id: str) -> Dict:
        """获取任务状态"""
        if task_id not in self.active_tasks:
            raise Exception("Task not found")
            
        return self.active_tasks[task_id]
    
    async def _run_training(self, task_id: str):
        """运行训练任务（后台任务）"""
        try:
            task_info = self.active_tasks[task_id]
            task_info["status"] = "running"
            task_info["started_at"] = datetime.utcnow().isoformat()
            
            # 模拟训练过程
            for i in range(10):
                await asyncio.sleep(2)  # 模拟训练步骤
                task_info["progress"] = (i + 1) * 10.0
                task_info["logs"].append(f"Training step {i+1}/10 completed")
                
            task_info["status"] = "completed"
            task_info["completed_at"] = datetime.utcnow().isoformat()
            task_info["progress"] = 100.0
            
        except Exception as e:
            task_info["status"] = "failed"
            task_info["error"] = str(e)
            task_info["failed_at"] = datetime.utcnow().isoformat()
```

#### 2.5 配置文件

**config/settings.py**:
```python
import os
from typing import List

class Settings:
    # 服务配置
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Hivemind 配置
    DHT_PORT: int = int(os.getenv("HIVEMIND_DHT_PORT", 8080))
    SERVER_PORT: int = int(os.getenv("HIVEMIND_SERVER_PORT", 8081))
    INITIAL_PEERS: List[str] = os.getenv("HIVEMIND_INITIAL_PEERS", "").split(",") if os.getenv("HIVEMIND_INITIAL_PEERS") else []
    
    # 外部服务配置
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://backend:3001")
    
settings = Settings()
```

### 步骤 3: Docker 容器化

#### 3.1 Dockerfile

**Dockerfile**:
```dockerfile
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN useradd -m -u 1000 hivemind && chown -R hivemind:hivemind /app
USER hivemind

# 暴露端口
EXPOSE 8000 8080 8081

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 步骤 4: 更新 Docker Compose

#### 4.1 更新根目录 docker-compose.yml

在现有的 `docker-compose.yml` 中添加 Hivemind 服务：

```yaml
version: '3.8'

services:
  # 现有服务保持不变...
  
  hivemind-service:
    build:
      context: ./apps/hivemind-service
      dockerfile: Dockerfile
    container_name: hivemind-service
    ports:
      - "8000:8000"  # FastAPI 端口
      - "8080:8080"  # DHT 端口
      - "8081:8081"  # Hivemind 服务器端口
    environment:
      - PORT=8000
      - DEBUG=true
      - HIVEMIND_DHT_PORT=8080
      - HIVEMIND_SERVER_PORT=8081
      - HIVEMIND_INITIAL_PEERS=
      - BACKEND_URL=http://backend:3001
    volumes:
      - ./apps/hivemind-service:/app
      - hivemind_data:/app/data
    networks:
      - cotrainai-network
    depends_on:
      - backend
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  hivemind_data:
    driver: local

networks:
  cotrainai-network:
    driver: bridge
```

### 步骤 5: NestJS 后端集成

#### 5.1 创建 Hivemind 代理模块

在 `apps/backend/src/modules/` 下创建 `hivemind-proxy/` 目录：

**hivemind-proxy.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HivemindProxyController } from './hivemind-proxy.controller';
import { HivemindProxyService } from './hivemind-proxy.service';
import { HivemindSyncService } from './hivemind-sync.service';

@Module({
  imports: [HttpModule],
  controllers: [HivemindProxyController],
  providers: [HivemindProxyService, HivemindSyncService],
  exports: [HivemindProxyService],
})
export class HivemindProxyModule {}
```

**hivemind-proxy.controller.ts**:
```typescript
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
```

**hivemind-proxy.service.ts**:
```typescript
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
```

**hivemind-sync.service.ts**:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// 假设您有这些实体
// import { TrainingTask } from '../entities/training-task.entity';
// import { User } from '../entities/user.entity';

@Injectable()
export class HivemindSyncService {
  private readonly logger = new Logger(HivemindSyncService.name);

  constructor(
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
```

### 步骤 6: 环境配置

#### 6.1 更新环境变量

在根目录 `.env` 文件中添加：
```env
# CotrainCore 分布式训练配置
COTRAIN_CORE_URL=http://cotrain-core:8002
HIVEMIND_DHT_PORT=8080
HIVEMIND_SERVER_PORT=8081
HIVEMIND_INITIAL_PEERS=
```

在 `apps/backend/.env` 中添加：
```env
# CotrainCore 集成
COTRAIN_CORE_URL=http://cotrain-core:8002
```

#### 6.2 更新开发脚本

注意：以下脚本已被移除，分布式训练功能现已集成到 CotrainCore 中：
```json
{
  "scripts": {
    // 已移除 - 功能集成到 CotrainCore
    // "dev:hivemind": "docker-compose up hivemind-service",
    // "build:hivemind": "docker-compose build hivemind-service",
    // "logs:hivemind": "docker-compose logs -f hivemind-service",
    // "test:hivemind": "cd apps/hivemind-service && python -m pytest"
  }
}
```

### 步骤 7: 前端集成

#### 7.1 创建 Hivemind API 客户端

在 `apps/frontend/src/lib/api/` 下创建 `hivemind.ts`：

```typescript
import { apiClient } from './client';

export interface TrainingRequest {
  model_config: Record<string, any>;
  training_params: Record<string, any>;
  dataset_info: Record<string, any>;
  user_id: string;
  task_id: string;
}

export interface TrainingStatus {
  task_id: string;
  status: 'submitted' | 'running' | 'completed' | 'failed';
  progress: number;
  logs: string[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface PeerInfo {
  peer_id: string;
  address: string;
  last_seen: string;
}

export const hivemindApi = {
  // 启动 Hivemind 服务器
  async startServer() {
    const response = await apiClient.post('/api/v1/hivemind-ml/start');
    return response.data;
  },

  // 获取服务器状态
  async getStatus() {
    const response = await apiClient.get('/api/v1/hivemind-ml/status');
    return response.data;
  },

  // 提交训练任务
  async submitTrainingTask(request: TrainingRequest) {
    const response = await apiClient.post('/api/v1/hivemind-ml/train', request);
    return response.data;
  },

  // 获取训练状态
  async getTrainingStatus(taskId: string): Promise<TrainingStatus> {
    const response = await apiClient.get(`/api/v1/hivemind-ml/training/${taskId}`);
    return response.data.data;
  },

  // 获取连接的节点
  async getConnectedPeers(): Promise<PeerInfo[]> {
    const response = await apiClient.get('/api/v1/hivemind-ml/peers');
    return response.data.data;
  },
};
```

#### 7.2 创建 Hivemind 管理页面

在 `apps/frontend/src/app/hivemind/` 下创建管理页面：

```typescript
// apps/frontend/src/app/hivemind/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { hivemindApi, type PeerInfo, type TrainingStatus } from '@/lib/api/hivemind';
import { toast } from 'sonner';

export default function HivemindPage() {
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadServerStatus();
    loadPeers();
  }, []);

  const loadServerStatus = async () => {
    try {
      const status = await hivemindApi.getStatus();
      setServerStatus(status.data);
    } catch (error) {
      console.error('Failed to load server status:', error);
    }
  };

  const loadPeers = async () => {
    try {
      const peersData = await hivemindApi.getConnectedPeers();
      setPeers(peersData);
    } catch (error) {
      console.error('Failed to load peers:', error);
    }
  };

  const handleStartServer = async () => {
    setIsLoading(true);
    try {
      await hivemindApi.startServer();
      toast.success('Hivemind 服务器启动成功');
      await loadServerStatus();
    } catch (error) {
      toast.error('启动服务器失败');
      console.error('Failed to start server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      running: 'default',
      stopped: 'secondary',
      error: 'destructive',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hivemind 分布式训练</h1>
        <Button 
          onClick={handleStartServer} 
          disabled={isLoading || serverStatus?.status === 'running'}
        >
          {isLoading ? '启动中...' : '启动服务器'}
        </Button>
      </div>

      {/* 服务器状态 */}
      <Card>
        <CardHeader>
          <CardTitle>服务器状态</CardTitle>
        </CardHeader>
        <CardContent>
          {serverStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">状态</p>
                {getStatusBadge(serverStatus.status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">节点 ID</p>
                <p className="font-mono text-sm">
                  {serverStatus.peer_id ? 
                    `${serverStatus.peer_id.slice(0, 8)}...` : 
                    'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">连接节点数</p>
                <p className="text-2xl font-bold">{serverStatus.connected_peers || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DHT 大小</p>
                <p className="text-2xl font-bold">{serverStatus.dht_size || 0}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">加载中...</p>
          )}
        </CardContent>
      </Card>

      {/* 连接的节点 */}
      <Card>
        <CardHeader>
          <CardTitle>连接的节点</CardTitle>
        </CardHeader>
        <CardContent>
          {peers.length > 0 ? (
            <div className="space-y-2">
              {peers.map((peer, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-mono text-sm">{peer.peer_id.slice(0, 16)}...</p>
                    <p className="text-sm text-muted-foreground">{peer.address}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    最后连接: {new Date(peer.last_seen).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">暂无连接的节点</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 部署和运维

### 开发环境启动

```bash
# 启动所有服务（包括 Hivemind）
docker-compose up --build

# 仅启动 Hivemind 服务
npm run dev:hivemind

# 查看 Hivemind 日志
npm run logs:hivemind
```

### 生产环境部署

1. **构建镜像**:
```bash
docker-compose build hivemind-service
```

2. **推送到镜像仓库**:
```bash
docker tag hivemind-service:latest your-registry/hivemind-service:latest
docker push your-registry/hivemind-service:latest
```

3. **Kubernetes 部署** (可选):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hivemind-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hivemind-service
  template:
    metadata:
      labels:
        app: hivemind-service
    spec:
      containers:
      - name: hivemind-service
        image: your-registry/hivemind-service:latest
        ports:
        - containerPort: 8000
        - containerPort: 8080
        - containerPort: 8081
        env:
        - name: PORT
          value: "8000"
        - name: HIVEMIND_DHT_PORT
          value: "8080"
        - name: HIVEMIND_SERVER_PORT
          value: "8081"
```

## 监控和日志

### 健康检查

Hivemind 服务提供了健康检查端点：
- `GET /health` - 基本健康检查
- `GET /api/v1/hivemind/status` - 详细状态信息

### 日志配置

在 Python 服务中添加结构化日志：

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        return json.dumps(log_entry)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/app/logs/hivemind.log')
    ]
)

for handler in logging.root.handlers:
    handler.setFormatter(JSONFormatter())
```

## 安全考虑

### 网络安全

1. **防火墙配置**: 限制 DHT 端口的访问
2. **TLS 加密**: 在生产环境中启用 HTTPS
3. **认证授权**: 实现 API 访问控制

### 数据安全

1. **数据加密**: 训练数据传输加密
2. **访问控制**: 基于角色的访问控制
3. **审计日志**: 记录所有关键操作

## 性能优化

### 资源配置

```yaml
# docker-compose.yml 中的资源限制
hivemind-service:
  # ...
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 4G
      reservations:
        cpus: '1.0'
        memory: 2G
```

### 缓存策略

1. **Redis 缓存**: 缓存训练状态和节点信息
2. **本地缓存**: 使用内存缓存频繁访问的数据
3. **CDN**: 静态资源使用 CDN 加速

## 故障排除

### 常见问题

1. **DHT 连接失败**:
   - 检查网络配置
   - 验证端口是否开放
   - 确认初始节点配置

2. **训练任务失败**:
   - 检查 Python 依赖
   - 验证模型配置
   - 查看详细错误日志

3. **服务间通信问题**:
   - 检查 Docker 网络配置
   - 验证服务发现
   - 确认端口映射

### 调试命令

```bash
# 检查容器状态
docker-compose ps

# 查看服务日志
docker-compose logs hivemind-service

# 进入容器调试
docker-compose exec hivemind-service bash

# 测试 API 连接
curl http://localhost:8000/health
```

## 总结

通过以上方案，您可以成功将 `learning-at-home/hivemind` 集成到现有的 monorepo 项目中，实现：

1. **微服务架构**: Python Hivemind 作为独立服务
2. **API 集成**: 通过 REST API 与现有系统通信
3. **容器化部署**: 统一的 Docker 部署方案
4. **数据同步**: 训练结果与区块链系统同步
5. **前端集成**: 用户友好的管理界面

这种架构既保持了技术栈的分离，又实现了功能的深度集成，为项目提供了强大的分布式训练能力。