# CoTrain Aptos Move 合约

本文档概述了 CoTrain 网络的 Aptos Move 合约。CoTrain 是一个去中心化的计算网络，旨在促进协作式 AI 模型训练。

## 模块概览

### `cotrain_network`

这是主模块，协调网络中的其他模块。它负责：

- **初始化**：部署和初始化所有其他核心模块。
- **角色管理**：管理 `federator` 和 `validator` 角色。
- **提供商注册**：处理计算提供商的注册，包括质押和白名单流程。
- **域创建**：允许 `federator` 创建新的训练域。

### `compute_registry`

该模块管理计算提供商和节点的注册表。

- **提供商和节点信息**：存储有关提供商及其计算节点的信息，包括规格 URI 和验证状态。
- **白名单**：允许管理员将提供商列入白名单，这是参与网络所必需的。

### `stake_manager`

处理与网络安全和参与相关的质押逻辑。

- **质押**：允许计算提供商质押 `AptosCoin` 以加入网络。
- **削减**：允许管理员因恶意行为而惩罚提供商。
- **解质押和提款**：管理解绑期和质押代币的提款。

### `domain_registry`

管理网络中的训练域。

- **域创建**：允许管理员定义新的训练域。
- **配置**：存储每个域的验证逻辑和参数的 URI。

### `compute_pool`

管理用于特定训练任务的计算节点池。

- **池创建**：允许池管理员为特定域创建计算池。
- **加入和离开**：允许经过验证的节点加入和离开活动计算池。

### `rewards_distributor`

处理向为网络贡献计算资源的提供商分发奖励。

- **奖励池**：为每个计算池管理奖励资金。
- **奖励计算**：根据贡献（例如，活动时间）计算奖励。
- **领取奖励**：允许提供商领取他们应得的奖励。

### `treasury` 和 `cotrain_coin`

这些模块定义了原生代币 `CoTrainCoin` (CTC)。

- **`cotrain_coin`**：定义 `CoTrainCoin` 结构。
- **`treasury`**：管理 `CoTrainCoin` 的铸造和销毁。它使用 `managed_coin` 功能来控制代币供应。

## 核心流程

1.  **初始化**：部署者调用 `cotrain_network::initialize` 来设置所有模块。
2.  **提供商注册**：计算提供商调用 `cotrain_network::register_provider`，质押 `AptosCoin` 并注册其详细信息。
3.  **白名单**：`validator` 调用 `cotrain_network::whitelist_provider` 来批准提供商。
4.  **域创建**：`federator` 调用 `cotrain_network::create_domain` 来设置新的训练域。
5.  **计算池**：池管理员创建计算池，节点可以加入以参与训练任务。
6.  **奖励**：在完成计算任务后，提供商可以从 `rewards_distributor` 模块中领取奖励。