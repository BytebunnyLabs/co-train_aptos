# Hivemind Service 移除计划

## 概述
根据架构优化决策，我们选择保留自研的 CotrainCore 作为核心训练引擎，移除重复的 hivemind-service，以简化架构并避免功能重叠。

## 当前状态分析

### Hivemind Service 的功能
- 分布式网络协调
- DHT (分布式哈希表) 管理
- P2P 节点通信
- 训练任务协调

### CotrainCore 的功能
- 核心AI训练引擎
- 训练会话管理
- 模型配置和参数管理
- 训练状态监控
- RESTful API 接口

### 功能重叠分析
- 两个服务都涉及分布式训练协调
- CotrainCore 更专注于训练执行，hivemind-service 更专注于网络协调
- 保留 CotrainCore 可以简化架构，减少服务间通信复杂度

## 移除步骤

### 第一阶段：准备工作
1. ✅ 分析依赖关系
2. ✅ 确定需要迁移的功能
3. ✅ 制定移除计划

### 第二阶段：功能迁移
1. 将 hivemind-service 的网络协调功能集成到 CotrainCore
2. 更新 backend 中的 hivemind 模块，直接与 CotrainCore 通信
3. 移除 hivemind-proxy 模块

### 第三阶段：配置清理
1. 从 docker-compose.yml 中移除 hivemind-service
2. 从 docker-compose.dev.yml 中移除相关配置
3. 更新 package.json 脚本
4. 清理相关文档

### 第四阶段：代码清理
1. 删除 apps/hivemind-service 目录
2. 更新 backend 中的相关模块
3. 更新前端 API 调用

### 第五阶段：测试验证
1. 验证 CotrainCore 功能完整性
2. 测试端到端训练流程
3. 更新集成测试

## 需要保留的功能

### 从 hivemind-service 迁移到 CotrainCore
- P2P 网络发现和连接
- 分布式训练协调
- 节点状态管理
- 贡献度跟踪

### Backend 模块更新
- 将 `hivemind` 模块重构为直接与 CotrainCore 通信
- 保留 P2P 网络服务的核心逻辑
- 更新 API 端点指向 CotrainCore

## 风险评估

### 低风险
- Docker 配置移除
- 脚本更新
- 文档清理

### 中等风险
- Backend 模块重构
- API 端点更新

### 高风险
- 分布式训练功能迁移
- 网络协调逻辑集成

## 回滚计划
如果移除过程中出现问题，可以：
1. 恢复 hivemind-service 配置
2. 回滚 backend 模块更改
3. 恢复原有的服务间通信

## 预期收益

### 架构简化
- 减少服务数量从 2 个到 1 个
- 简化服务间通信
- 降低部署复杂度

### 维护成本降低
- 减少重复代码
- 统一技术栈
- 简化监控和日志

### 性能提升
- 减少网络延迟
- 降低资源消耗
- 提高响应速度

## 执行时间表

- **第一阶段**: 已完成
- **第二阶段**: 2-3 天
- **第三阶段**: 1 天
- **第四阶段**: 1 天
- **第五阶段**: 1-2 天

**总计**: 5-7 天

## 下一步行动
1. 开始执行第二阶段：功能迁移
2. 更新 CotrainCore 以支持网络协调功能
3. 重构 backend 模块