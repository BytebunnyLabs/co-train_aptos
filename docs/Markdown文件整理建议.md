# Markdown 文件整理建议

## 📋 当前根目录 .md 文件分析

根目录下目前有以下 7 个 Markdown 文件：

### 🔍 文件分类分析

#### 1. 核心项目文档（应保留在根目录）
- **README.md** - 项目主要介绍和快速开始指南
- **CHANGELOG.md** - 版本更新记录
- **CONTRIBUTING.md** - 贡献指南
- **CODE_OF_CONDUCT.md** - 行为准则
- **SECURITY.md** - 安全政策

#### 2. 部署和快速开始文档（可考虑移动）
- **DEPLOYMENT.md** - Vercel 部署指南
- **QUICK_START.md** - 快速开始指南

## 🎯 整理建议

### 方案一：最小化调整（推荐）

**保持现状，仅做微调：**

1. **保留在根目录**（5个文件）：
   - `README.md` - 项目入口文档
   - `CHANGELOG.md` - 版本历史
   - `CONTRIBUTING.md` - 贡献指南
   - `CODE_OF_CONDUCT.md` - 社区规范
   - `SECURITY.md` - 安全政策

2. **移动到 docs 目录**（2个文件）：
   - `DEPLOYMENT.md` → `docs/deployment/vercel.md`
   - `QUICK_START.md` → `docs/quick-start.md`

**理由：**
- 符合开源项目标准实践
- GitHub 会自动识别根目录的标准文档
- 部署文档更适合放在 docs 目录中

### 方案二：完全整理（激进）

**只保留最核心文档在根目录：**

1. **保留在根目录**（2个文件）：
   - `README.md` - 项目主文档
   - `CHANGELOG.md` - 版本记录

2. **移动到 docs 目录**：
   - `CONTRIBUTING.md` → `docs/contributing.md`
   - `CODE_OF_CONDUCT.md` → `docs/code-of-conduct.md`
   - `SECURITY.md` → `docs/security.md`
   - `DEPLOYMENT.md` → `docs/deployment/vercel.md`
   - `QUICK_START.md` → `docs/quick-start.md`

## 📁 建议的 docs 目录结构

```
docs/
├── quick-start.md              # 快速开始指南
├── contributing.md             # 贡献指南（如果移动）
├── code-of-conduct.md          # 行为准则（如果移动）
├── security.md                 # 安全政策（如果移动）
├── deployment/
│   ├── vercel.md              # Vercel 部署指南
│   ├── docker.md              # Docker 部署（未来）
│   └── kubernetes.md          # K8s 部署（未来）
├── development/
│   ├── setup.md               # 开发环境设置
│   ├── architecture.md        # 架构文档
│   └── api.md                 # API 文档
├── user-guide/
│   ├── getting-started.md     # 用户入门
│   └── features.md            # 功能介绍
└── [现有文档...]
```

## 🔧 实施步骤

### 推荐方案（方案一）实施：

```bash
# 1. 创建部署文档目录
mkdir -p docs/deployment

# 2. 移动部署相关文档
mv DEPLOYMENT.md docs/deployment/vercel.md
mv QUICK_START.md docs/quick-start.md

# 3. 更新文档中的相互引用
# 需要检查和更新文档内部的链接引用
```

### 需要更新的引用

1. **README.md** 中可能引用了这些文档
2. **CONTRIBUTING.md** 中可能有相互引用
3. **package.json** 脚本中的文档路径
4. **GitHub 模板**中的文档链接

## ✅ 整理的好处

1. **符合标准实践** - 遵循开源项目的标准结构
2. **提高可发现性** - GitHub 自动识别标准文档
3. **减少根目录混乱** - 专业文档放在专门目录
4. **便于维护** - 相关文档集中管理
5. **改善用户体验** - 更清晰的文档层次

## ⚠️ 注意事项

1. **GitHub 特殊处理**：
   - `README.md` 必须在根目录
   - `CONTRIBUTING.md` 在根目录时 GitHub 会特殊显示
   - `CODE_OF_CONDUCT.md` 在根目录时 GitHub 会自动识别
   - `SECURITY.md` 在根目录时 GitHub 会在安全标签显示

2. **SEO 和可访问性**：
   - 根目录文档更容易被搜索引擎发现
   - 用户习惯在根目录查找这些标准文档

3. **CI/CD 影响**：
   - 检查是否有自动化脚本依赖这些文档的路径
   - 更新部署脚本中的文档引用

## 🎯 最终推荐

**采用方案一（最小化调整）**：
- 保持 GitHub 标准文档在根目录
- 只移动部署和快速开始文档到 docs 目录
- 既保持了标准实践，又减少了根目录的文件数量
- 风险最小，影响最小

这样既能保持项目的专业性和标准性，又能适度减少根目录的文件数量。