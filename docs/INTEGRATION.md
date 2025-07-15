# CoTrain Aptos Integration Guide

本文档说明如何将Aptos Move智能合约与CoTrain前后端项目集成。

## 项目架构

```
co-train_aptos/
├── frontend/          # React前端应用
├── backend/           # NestJS后端API
├── move/              # Aptos Move智能合约
│   ├── sources/       # 合约源代码
│   ├── scripts/       # 部署脚本
│   ├── tests/         # 合约测试
│   └── deploy.sh      # 部署工具
└── INTEGRATION.md     # 集成指南
```

## 1. Aptos Move合约部署

### 1.1 环境准备

首先安装Aptos CLI：

```bash
# macOS
brew install aptos

# 或者从源码安装
cargo install --git https://github.com/aptos-labs/aptos-core.git aptos
```

### 1.2 部署合约

```bash
cd move

# 编译和测试
./deploy.sh compile
./deploy.sh test

# 部署到devnet
./deploy.sh deploy --profile devnet

# 或者一键部署
./deploy.sh full --profile devnet
```

部署成功后，会生成`deployment_info.txt`文件，包含合约地址等信息。

## 2. 后端集成

### 2.1 安装Aptos SDK

在后端项目中安装Aptos TypeScript SDK：

```bash
cd backend
npm install aptos
```

### 2.2 创建Aptos服务

创建`src/aptos/aptos.service.ts`：

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { AptosClient, AptosAccount, HexString, Types } from 'aptos';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AptosService {
  private readonly logger = new Logger(AptosService.name);
  private client: AptosClient;
  private adminAccount: AptosAccount;
  private contractAddress: string;

  constructor(private configService: ConfigService) {
    const nodeUrl = this.configService.get<string>('APTOS_NODE_URL', 'https://fullnode.devnet.aptoslabs.com');
    this.client = new AptosClient(nodeUrl);
    
    const privateKey = this.configService.get<string>('APTOS_PRIVATE_KEY');
    if (privateKey) {
      this.adminAccount = new AptosAccount(HexString.ensure(privateKey).toUint8Array());
    }
    
    this.contractAddress = this.configService.get<string>('APTOS_CONTRACT_ADDRESS');
  }

  async createTrainingSession(name: string, rewardAmount: number): Promise<string> {
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::training_rewards::create_training_session`,
      arguments: [name, rewardAmount.toString()],
      type_arguments: [],
    };

    try {
      const txnRequest = await this.client.generateTransaction(this.adminAccount.address(), payload);
      const signedTxn = await this.client.signTransaction(this.adminAccount, txnRequest);
      const transactionRes = await this.client.submitTransaction(signedTxn);
      
      await this.client.waitForTransaction(transactionRes.hash);
      this.logger.log(`Training session created: ${transactionRes.hash}`);
      
      return transactionRes.hash;
    } catch (error) {
      this.logger.error('Failed to create training session:', error);
      throw error;
    }
  }

  async registerParticipant(sessionId: number, participantAddress: string): Promise<string> {
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::training_rewards::register_participant`,
      arguments: [sessionId.toString()],
      type_arguments: [],
    };

    try {
      // Note: In real implementation, this should be signed by the participant
      const txnRequest = await this.client.generateTransaction(participantAddress, payload);
      // For demo purposes, we'll use admin account
      const signedTxn = await this.client.signTransaction(this.adminAccount, txnRequest);
      const transactionRes = await this.client.submitTransaction(signedTxn);
      
      await this.client.waitForTransaction(transactionRes.hash);
      this.logger.log(`Participant registered: ${transactionRes.hash}`);
      
      return transactionRes.hash;
    } catch (error) {
      this.logger.error('Failed to register participant:', error);
      throw error;
    }
  }

  async submitContribution(sessionId: number, participantAddress: string, score: number): Promise<string> {
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::training_rewards::submit_contribution`,
      arguments: [sessionId.toString(), participantAddress, score.toString()],
      type_arguments: [],
    };

    try {
      const txnRequest = await this.client.generateTransaction(this.adminAccount.address(), payload);
      const signedTxn = await this.client.signTransaction(this.adminAccount, txnRequest);
      const transactionRes = await this.client.submitTransaction(signedTxn);
      
      await this.client.waitForTransaction(transactionRes.hash);
      this.logger.log(`Contribution submitted: ${transactionRes.hash}`);
      
      return transactionRes.hash;
    } catch (error) {
      this.logger.error('Failed to submit contribution:', error);
      throw error;
    }
  }

  async completeTrainingSession(sessionId: number): Promise<string> {
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::training_rewards::complete_training_session`,
      arguments: [sessionId.toString()],
      type_arguments: [],
    };

    try {
      const txnRequest = await this.client.generateTransaction(this.adminAccount.address(), payload);
      const signedTxn = await this.client.signTransaction(this.adminAccount, txnRequest);
      const transactionRes = await this.client.submitTransaction(signedTxn);
      
      await this.client.waitForTransaction(transactionRes.hash);
      this.logger.log(`Training session completed: ${transactionRes.hash}`);
      
      return transactionRes.hash;
    } catch (error) {
      this.logger.error('Failed to complete training session:', error);
      throw error;
    }
  }

  async getTrainingSession(sessionId: number): Promise<any> {
    try {
      const resource = await this.client.view({
        function: `${this.contractAddress}::training_rewards::get_training_session`,
        arguments: [sessionId.toString()],
        type_arguments: [],
      });
      
      return resource;
    } catch (error) {
      this.logger.error('Failed to get training session:', error);
      throw error;
    }
  }

  async getParticipantScore(sessionId: number, participantAddress: string): Promise<number> {
    try {
      const result = await this.client.view({
        function: `${this.contractAddress}::training_rewards::get_participant_score`,
        arguments: [sessionId.toString(), participantAddress],
        type_arguments: [],
      });
      
      return parseInt(result[0] as string);
    } catch (error) {
      this.logger.error('Failed to get participant score:', error);
      throw error;
    }
  }

  async getTotalRewardsDistributed(): Promise<number> {
    try {
      const result = await this.client.view({
        function: `${this.contractAddress}::training_rewards::get_total_rewards_distributed`,
        arguments: [],
        type_arguments: [],
      });
      
      return parseInt(result[0] as string);
    } catch (error) {
      this.logger.error('Failed to get total rewards distributed:', error);
      throw error;
    }
  }

  async getAccountBalance(address: string): Promise<number> {
    try {
      const resources = await this.client.getAccountResources(address);
      const coinResource = resources.find(r => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
      
      if (coinResource) {
        const data = coinResource.data as any;
        return parseInt(data.coin.value);
      }
      
      return 0;
    } catch (error) {
      this.logger.error('Failed to get account balance:', error);
      return 0;
    }
  }
}
```

### 2.3 创建Aptos模块

创建`src/aptos/aptos.module.ts`：

```typescript
import { Module } from '@nestjs/common';
import { AptosService } from './aptos.service';
import { AptosController } from './aptos.controller';

@Module({
  providers: [AptosService],
  controllers: [AptosController],
  exports: [AptosService],
})
export class AptosModule {}
```

### 2.4 创建Aptos控制器

创建`src/aptos/aptos.controller.ts`：

```typescript
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AptosService } from './aptos.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('aptos')
@Controller('aptos')
export class AptosController {
  constructor(private readonly aptosService: AptosService) {}

  @Post('training-sessions')
  @ApiOperation({ summary: 'Create a new training session' })
  async createTrainingSession(
    @Body() createSessionDto: { name: string; rewardAmount: number }
  ) {
    const txHash = await this.aptosService.createTrainingSession(
      createSessionDto.name,
      createSessionDto.rewardAmount
    );
    return { success: true, transactionHash: txHash };
  }

  @Post('training-sessions/:id/participants')
  @ApiOperation({ summary: 'Register participant for training session' })
  async registerParticipant(
    @Param('id') sessionId: number,
    @Body() registerDto: { participantAddress: string }
  ) {
    const txHash = await this.aptosService.registerParticipant(
      sessionId,
      registerDto.participantAddress
    );
    return { success: true, transactionHash: txHash };
  }

  @Post('training-sessions/:id/contributions')
  @ApiOperation({ summary: 'Submit participant contribution' })
  async submitContribution(
    @Param('id') sessionId: number,
    @Body() contributionDto: { participantAddress: string; score: number }
  ) {
    const txHash = await this.aptosService.submitContribution(
      sessionId,
      contributionDto.participantAddress,
      contributionDto.score
    );
    return { success: true, transactionHash: txHash };
  }

  @Post('training-sessions/:id/complete')
  @ApiOperation({ summary: 'Complete training session and distribute rewards' })
  async completeTrainingSession(@Param('id') sessionId: number) {
    const txHash = await this.aptosService.completeTrainingSession(sessionId);
    return { success: true, transactionHash: txHash };
  }

  @Get('training-sessions/:id')
  @ApiOperation({ summary: 'Get training session details' })
  async getTrainingSession(@Param('id') sessionId: number) {
    const session = await this.aptosService.getTrainingSession(sessionId);
    return { success: true, data: session };
  }

  @Get('training-sessions/:id/participants/:address/score')
  @ApiOperation({ summary: 'Get participant score' })
  async getParticipantScore(
    @Param('id') sessionId: number,
    @Param('address') participantAddress: string
  ) {
    const score = await this.aptosService.getParticipantScore(sessionId, participantAddress);
    return { success: true, score };
  }

  @Get('stats/total-rewards')
  @ApiOperation({ summary: 'Get total rewards distributed' })
  async getTotalRewardsDistributed() {
    const total = await this.aptosService.getTotalRewardsDistributed();
    return { success: true, totalRewards: total };
  }

  @Get('accounts/:address/balance')
  @ApiOperation({ summary: 'Get account APT balance' })
  async getAccountBalance(@Param('address') address: string) {
    const balance = await this.aptosService.getAccountBalance(address);
    return { success: true, balance };
  }
}
```

### 2.5 更新环境变量

在`.env`文件中添加Aptos相关配置：

```env
# Aptos Configuration
APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com
APTOS_PRIVATE_KEY=0x你的私钥
APTOS_CONTRACT_ADDRESS=0x合约地址
```

### 2.6 集成到主模块

在`src/app.module.ts`中导入AptosModule：

```typescript
import { AptosModule } from './aptos/aptos.module';

@Module({
  imports: [
    // ... 其他模块
    AptosModule,
  ],
  // ...
})
export class AppModule {}
```

## 3. 前端集成

### 3.1 安装Aptos钱包适配器

```bash
cd frontend
npm install @aptos-labs/wallet-adapter-react @aptos-labs/wallet-adapter-ant-design aptos
```

### 3.2 配置钱包提供者

在`src/App.tsx`中配置钱包适配器：

```typescript
import React from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from '@aptos-labs/wallet-adapter-petra';
import { MartianWallet } from '@aptos-labs/wallet-adapter-martian';
import { Network } from '@aptos-labs/ts-sdk';

const wallets = [new PetraWallet(), new MartianWallet()];

function App() {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      dappConfig={{
        network: Network.DEVNET,
        aptosConnectDappId: 'your-dapp-id',
      }}
    >
      {/* 你的应用组件 */}
    </AptosWalletAdapterProvider>
  );
}

export default App;
```

### 3.3 创建Aptos服务

创建`src/services/aptosService.ts`：

```typescript
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

class AptosService {
  private aptos: Aptos;
  private contractAddress: string;

  constructor() {
    const config = new AptosConfig({ network: Network.DEVNET });
    this.aptos = new Aptos(config);
    this.contractAddress = process.env.REACT_APP_APTOS_CONTRACT_ADDRESS || '';
  }

  async getTrainingSession(sessionId: number) {
    try {
      const result = await this.aptos.view({
        payload: {
          function: `${this.contractAddress}::training_rewards::get_training_session`,
          functionArguments: [sessionId],
        },
      });
      return result;
    } catch (error) {
      console.error('Failed to get training session:', error);
      throw error;
    }
  }

  async getParticipantScore(sessionId: number, participantAddress: string) {
    try {
      const result = await this.aptos.view({
        payload: {
          function: `${this.contractAddress}::training_rewards::get_participant_score`,
          functionArguments: [sessionId, participantAddress],
        },
      });
      return parseInt(result[0] as string);
    } catch (error) {
      console.error('Failed to get participant score:', error);
      throw error;
    }
  }

  async getTotalRewardsDistributed() {
    try {
      const result = await this.aptos.view({
        payload: {
          function: `${this.contractAddress}::training_rewards::get_total_rewards_distributed`,
          functionArguments: [],
        },
      });
      return parseInt(result[0] as string);
    } catch (error) {
      console.error('Failed to get total rewards:', error);
      throw error;
    }
  }

  async getAccountBalance(address: string) {
    try {
      const balance = await this.aptos.getAccountAPTAmount({
        accountAddress: address,
      });
      return balance;
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return 0;
    }
  }
}

export const aptosService = new AptosService();
```

### 3.4 创建钱包连接组件

创建`src/components/WalletConnection.tsx`：

```typescript
import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { Button, Card, Typography } from 'antd';

const { Text } = Typography;

export const WalletConnection: React.FC = () => {
  const { connected, account, disconnect } = useWallet();

  if (connected && account) {
    return (
      <Card>
        <Text strong>Connected: </Text>
        <Text code>{account.address}</Text>
        <Button onClick={disconnect} style={{ marginLeft: 16 }}>
          Disconnect
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <Text>Connect your Aptos wallet to participate in training sessions</Text>
      <WalletSelector />
    </Card>
  );
};
```

### 3.5 创建训练会话组件

创建`src/components/TrainingSession.tsx`：

```typescript
import React, { useState, useEffect } from 'react';
import { Card, Button, Statistic, Row, Col, message } from 'antd';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { aptosService } from '../services/aptosService';

interface TrainingSessionProps {
  sessionId: number;
}

export const TrainingSession: React.FC<TrainingSessionProps> = ({ sessionId }) => {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [sessionData, setSessionData] = useState<any>(null);
  const [participantScore, setParticipantScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  useEffect(() => {
    if (connected && account) {
      loadParticipantScore();
    }
  }, [connected, account, sessionId]);

  const loadSessionData = async () => {
    try {
      const data = await aptosService.getTrainingSession(sessionId);
      setSessionData(data);
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
  };

  const loadParticipantScore = async () => {
    if (!account) return;
    
    try {
      const score = await aptosService.getParticipantScore(sessionId, account.address);
      setParticipantScore(score);
    } catch (error) {
      console.error('Failed to load participant score:', error);
    }
  };

  const registerForSession = async () => {
    if (!connected || !account) {
      message.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const transaction = {
        data: {
          function: `${process.env.REACT_APP_APTOS_CONTRACT_ADDRESS}::training_rewards::register_participant`,
          functionArguments: [sessionId],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      message.success('Successfully registered for training session!');
      loadSessionData();
      loadParticipantScore();
    } catch (error) {
      console.error('Failed to register:', error);
      message.error('Failed to register for training session');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionData) {
    return <Card loading />;
  }

  const [id, name, creator, totalPool, remainingRewards, participants, status, createdAt] = sessionData;

  return (
    <Card title={`Training Session: ${name}`}>
      <Row gutter={16}>
        <Col span={6}>
          <Statistic title="Session ID" value={id} />
        </Col>
        <Col span={6}>
          <Statistic title="Total Reward Pool" value={totalPool} suffix="APT" />
        </Col>
        <Col span={6}>
          <Statistic title="Participants" value={participants.length} />
        </Col>
        <Col span={6}>
          <Statistic title="Status" value={status === 1 ? 'Active' : status === 2 ? 'Completed' : 'Cancelled'} />
        </Col>
      </Row>
      
      {connected && account && (
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Statistic title="Your Score" value={participantScore} />
          </Col>
          <Col span={12}>
            <Button 
              type="primary" 
              onClick={registerForSession}
              loading={loading}
              disabled={status !== 1 || participants.includes(account.address)}
            >
              {participants.includes(account.address) ? 'Already Registered' : 'Register for Session'}
            </Button>
          </Col>
        </Row>
      )}
    </Card>
  );
};
```

## 4. 环境配置

### 4.1 前端环境变量

在`frontend/.env`中添加：

```env
REACT_APP_APTOS_CONTRACT_ADDRESS=0x你的合约地址
REACT_APP_APTOS_NETWORK=devnet
```

### 4.2 后端环境变量

在`backend/.env`中添加：

```env
APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com
APTOS_PRIVATE_KEY=0x你的私钥
APTOS_CONTRACT_ADDRESS=0x你的合约地址
```

## 5. 部署和测试

### 5.1 完整部署流程

```bash
# 1. 部署Move合约
cd move
./deploy.sh full --profile devnet

# 2. 更新环境变量（使用deployment_info.txt中的地址）

# 3. 启动后端
cd ../backend
npm run start:dev

# 4. 启动前端
cd ../frontend
npm start
```

### 5.2 测试API端点

```bash
# 创建训练会话
curl -X POST http://localhost:3001/aptos/training-sessions \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Session", "rewardAmount": 1000000}'

# 获取会话信息
curl http://localhost:3001/aptos/training-sessions/1

# 获取总奖励统计
curl http://localhost:3001/aptos/stats/total-rewards
```

## 6. 监控和日志

### 6.1 事件监听

可以在后端添加事件监听器来跟踪合约事件：

```typescript
// 在AptosService中添加
async listenToEvents() {
  // 监听会话创建事件
  const events = await this.client.getEventsByEventHandle(
    this.contractAddress,
    `${this.contractAddress}::training_rewards::TrainingRewardsState`,
    'session_created_events'
  );
  
  // 处理事件...
}
```

### 6.2 错误处理

确保在所有Aptos交互中添加适当的错误处理和重试逻辑。

## 7. 安全考虑

1. **私钥管理**: 永远不要在代码中硬编码私钥
2. **权限控制**: 确保只有授权用户可以执行管理员操作
3. **输入验证**: 验证所有用户输入和合约参数
4. **交易确认**: 等待交易确认后再更新UI状态

## 8. 故障排除

### 常见问题

1. **合约地址错误**: 确保使用正确的合约地址
2. **网络不匹配**: 确保前后端使用相同的Aptos网络
3. **余额不足**: 确保账户有足够的APT支付gas费用
4. **钱包连接问题**: 检查钱包扩展是否正确安装和配置

通过以上集成步骤，你的CoTrain项目现在已经完全集成了Aptos Move智能合约，可以实现去中心化的AI训练奖励分配系统。