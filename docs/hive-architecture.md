# 前端与 Hive 后端连接架构

```mermaid
graph TB
    %% 主要组件定义
    Frontend[前端应用\nNext.js]:::frontend
    Backend[后端服务\nNestJS]:::backend
    P2PNetwork[P2P网络服务]:::p2p
    DHT[分布式哈希表\nDHT管理]:::p2p
    Blockchain[区块链服务\nAptos]:::blockchain
    WebSocket[WebSocket网关]:::realtime
    EventSystem[事件系统]:::realtime
    Database[(数据库\nPostgreSQL)]:::storage
    Redis[(缓存\nRedis)]:::storage
    
    %% 前端内部组件
    subgraph Frontend
        APIClient[API客户端]:::frontend
        WSHook[WebSocket Hook]:::frontend
        UIComponents[UI组件]:::frontend
    end
    
    %% 后端内部组件
    subgraph Backend
        HivemindService[Hivemind服务]:::backend
        ContributionTracker[贡献跟踪服务]:::backend
        RewardDistributor[奖励分发服务]:::backend
    end
    
    %% P2P网络内部组件
    subgraph P2PNetwork
        NodeDiscovery[节点发现]:::p2p
        MessageBroker[消息代理]:::p2p
        PeerConnections[对等连接]:::p2p
    end
    
    %% 连接关系
    APIClient -->|HTTP API| HivemindService
    WSHook -->|WebSocket| WebSocket
    WebSocket -->|实时事件| HivemindService
    
    HivemindService --> ContributionTracker
    HivemindService --> RewardDistributor
    HivemindService --> P2PNetwork
    HivemindService --> DHT
    HivemindService --> EventSystem
    HivemindService --> Blockchain
    
    ContributionTracker --> Database
    RewardDistributor --> Blockchain
    P2PNetwork --> DHT
    EventSystem --> WebSocket
    EventSystem --> Redis
    
    %% 数据流
    APIClient -.->|获取网络统计| HivemindService
    APIClient -.->|获取节点信息| HivemindService
    APIClient -.->|获取贡献者数据| ContributionTracker
    APIClient -.->|获取奖励历史| RewardDistributor
    WSHook -.->|会话更新| WebSocket
    WSHook -.->|奖励分发通知| WebSocket
    
    %% 样式定义
    classDef frontend fill:#42a5f5,stroke:#1976d2,color:white
    classDef backend fill:#66bb6a,stroke:#43a047,color:white
    classDef p2p fill:#ab47bc,stroke:#8e24aa,color:white
    classDef blockchain fill:#ffa726,stroke:#fb8c00,color:white
    classDef realtime fill:#ef5350,stroke:#e53935,color:white
    classDef storage fill:#78909c,stroke:#546e7a,color:white
```

## 架构说明

### 1. 前端组件
- **API客户端**: 处理HTTP请求，与后端API交互
- **WebSocket Hook**: 管理实时连接，接收事件更新
- **UI组件**: 展示网络状态、节点信息和贡献数据

### 2. 后端服务
- **Hivemind服务**: 核心业务逻辑，协调其他服务
- **贡献跟踪服务**: 记录和验证节点贡献
- **奖励分发服务**: 计算和分发奖励

### 3. P2P网络
- **节点发现**: 发现和连接新节点
- **消息代理**: 处理节点间通信
- **对等连接**: 维护节点连接状态
- **分布式哈希表(DHT)**: 分布式数据存储和路由

### 4. 实时通信
- **WebSocket网关**: 处理客户端WebSocket连接
- **事件系统**: 分发系统事件

### 5. 存储
- **数据库**: 持久化存储节点和贡献数据
- **缓存**: 临时存储和消息队列

### 6. 区块链集成
- **区块链服务**: 与Aptos区块链交互，记录贡献和分发奖励

## 主要数据流

1. 前端通过HTTP API获取网络统计、节点信息、贡献者数据和奖励历史
2. 前端通过WebSocket接收实时事件（节点加入/离开、会话更新、奖励分发）
3. 后端Hivemind服务协调P2P网络中的节点活动
4. 贡献数据通过P2P网络收集，由贡献跟踪服务验证
5. 验证后的贡献记录到区块链，并由奖励分发服务计算奖励
6. 事件通过WebSocket实时推送给前端

## 环境配置

**前端环境变量**:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APTOS_NETWORK=testnet
```

**后端环境变量**:
```
PORT=3001
FRONTEND_URL=http://localhost:3000
APTOS_NETWORK=testnet
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
```