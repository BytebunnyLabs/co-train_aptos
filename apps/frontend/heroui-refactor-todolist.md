# HeroUI 重构计划 - CoTrain Frontend

## 项目概述

当前项目使用 shadcn/ui + Radix UI 组件库，需要重构为 HeroUI 组件库。项目已安装 `@heroui/react@^2.7.11` 并在 `layout.tsx` 中配置了 `HeroUIProvider`。

## 当前技术栈分析

### 现有组件库
- **shadcn/ui**: 基于 Radix UI 的组件系统
- **Radix UI**: 底层无样式组件库
- **Tailwind CSS**: 样式框架
- **class-variance-authority**: 变体管理

### 目标组件库
- **HeroUI**: 现代化 React 组件库
- **保留 Tailwind CSS**: 继续使用现有样式系统
- **Framer Motion**: HeroUI 内置动画支持

## 重构策略

### 阶段 1: 准备工作 (1-2 天)

#### 1.1 环境配置
- [x] ✅ HeroUI 已安装
- [x] ✅ Tailwind 配置已更新
- [x] ✅ HeroUIProvider 已配置
- [ ] 🔄 创建 HeroUI 主题配置
- [ ] 🔄 设置 HeroUI 类型定义

#### 1.2 项目结构调整
- [ ] 📁 创建新的 HeroUI 组件目录: `src/components/heroui/`
- [ ] 📁 保留现有组件作为备份: `src/components/cotrain/ui-legacy/`
- [ ] 📄 创建组件映射文档
- [ ] 🔧 更新 TypeScript 路径别名

### 阶段 2: 核心组件重构 (3-5 天)

#### 2.1 基础组件 (优先级: 🔥 高)

**Button 组件**
- [ ] 🔄 `button.tsx` → HeroUI Button
  - 当前: shadcn Button with CVA variants
  - 目标: HeroUI Button with built-in variants
  - 影响文件: ~25+ 组件

**Card 组件**
- [ ] 🔄 `card.tsx` → HeroUI Card
  - 当前: 自定义 Card 组件
  - 目标: HeroUI Card
  - 影响文件: ~20+ 页面

**Input 组件**
- [ ] 🔄 `input.tsx` → HeroUI Input
  - 当前: Radix + Tailwind
  - 目标: HeroUI Input
  - 影响文件: 表单组件

#### 2.2 导航组件 (优先级: 🔥 高)

**Navigation Menu**
- [ ] 🔄 `navigation-menu.tsx` → HeroUI Navbar
  - 文件: `ConditionalNavigation.tsx`
  - 当前: Radix Navigation Menu
  - 目标: HeroUI Navbar

**Dropdown Menu**
- [ ] 🔄 `dropdown-menu.tsx` → HeroUI Dropdown
  - 影响: 用户菜单、设置菜单

#### 2.3 反馈组件 (优先级: 🟡 中)

**Modal/Dialog**
- [ ] 🔄 `dialog.tsx` → HeroUI Modal
  - 当前: Radix Dialog
  - 目标: HeroUI Modal
  - 影响: 用户指南、确认对话框

**Toast/Notification**
- [ ] 🔄 `toast.tsx` + `sonner.tsx` → HeroUI Toast
  - 当前: Radix Toast + Sonner
  - 目标: HeroUI Toast

**Alert**
- [ ] 🔄 `alert.tsx` → HeroUI Alert

#### 2.4 数据展示组件 (优先级: 🟡 中)

**Table**
- [ ] 🔄 `table.tsx` → HeroUI Table
  - 影响: 训练历史、奖励列表

**Badge**
- [ ] 🔄 `badge.tsx` → HeroUI Chip
  - 当前: 自定义 Badge
  - 目标: HeroUI Chip

**Progress**
- [ ] 🔄 `progress.tsx` → HeroUI Progress
  - 影响: 训练进度条

**Avatar**
- [ ] 🔄 `avatar.tsx` → HeroUI Avatar
  - 影响: 用户头像

#### 2.5 表单组件 (优先级: 🟡 中)

**Select**
- [ ] 🔄 `select.tsx` → HeroUI Select
  - 当前: Radix Select
  - 目标: HeroUI Select

**Checkbox**
- [ ] 🔄 `checkbox.tsx` → HeroUI Checkbox

**Switch**
- [ ] 🔄 `switch.tsx` → HeroUI Switch

**Radio Group**
- [ ] 🔄 `radio-group.tsx` → HeroUI RadioGroup

**Textarea**
- [ ] 🔄 `textarea.tsx` → HeroUI Textarea

#### 2.6 布局组件 (优先级: 🟢 低)

**Tabs**
- [ ] 🔄 `tabs.tsx` → HeroUI Tabs
  - 影响: 设置页面、仪表板

**Accordion**
- [ ] 🔄 `accordion.tsx` → HeroUI Accordion
  - 影响: FAQ、文档页面

**Separator**
- [ ] 🔄 `separator.tsx` → HeroUI Divider

**Skeleton**
- [ ] 🔄 `skeleton.tsx` → HeroUI Skeleton

### 阶段 3: 页面级重构 (5-7 天)

#### 3.1 主要页面 (优先级: 🔥 高)

**首页**
- [ ] 🔄 `app/page.tsx`
  - 更新: Landing Page 组件
  - 重点: Hero Section, Stats Cards

**训练页面**
- [ ] 🔄 `app/training/page.tsx`
  - 更新: Quick Actions Cards
  - 重点: 统计展示、操作按钮

**仪表板**
- [ ] 🔄 `components/dashboard/web3-dashboard.tsx`
  - 更新: 数据可视化组件
  - 重点: Charts, Progress, Metrics

#### 3.2 功能页面 (优先级: 🟡 中)

**奖励页面**
- [ ] 🔄 `app/rewards/page.tsx`
- [ ] 🔄 `components/blockchain/rewards-dashboard.tsx`
  - 更新: 奖励卡片、历史记录

**个人资料**
- [ ] 🔄 `app/profile/page.tsx`
  - 更新: 用户信息表单

**设置页面**
- [ ] 🔄 `app/settings/`
  - 更新: 设置表单、偏好选项

#### 3.3 特殊组件 (优先级: 🟡 中)

**用户指南**
- [ ] 🔄 `components/cotrain/ui/user-guide.tsx`
  - 当前: 自定义引导组件
  - 目标: HeroUI Modal + Popover

**钱包选择器**
- [ ] 🔄 `components/WalletSelector.tsx`
  - 更新: 钱包连接界面

### 阶段 4: 样式和主题优化 (2-3 天)

#### 4.1 主题配置
- [ ] 🎨 配置 HeroUI 深色/浅色主题
- [ ] 🎨 自定义品牌颜色
- [ ] 🎨 统一组件间距和圆角

#### 4.2 响应式优化
- [ ] 📱 移动端适配检查
- [ ] 💻 桌面端布局优化
- [ ] 🖥️ 大屏幕适配

#### 4.3 动画和交互
- [ ] ✨ 添加 HeroUI 内置动画
- [ ] ✨ 优化页面过渡效果
- [ ] ✨ 增强用户交互反馈

### 阶段 5: 测试和优化 (2-3 天)

#### 5.1 功能测试
- [ ] 🧪 组件功能完整性测试
- [ ] 🧪 页面交互测试
- [ ] 🧪 钱包集成测试

#### 5.2 性能优化
- [ ] ⚡ Bundle 大小分析
- [ ] ⚡ 组件懒加载优化
- [ ] ⚡ 渲染性能检查

#### 5.3 兼容性测试
- [ ] 🌐 浏览器兼容性
- [ ] 📱 移动设备测试
- [ ] ♿ 无障碍访问测试

### 阶段 6: 清理和文档 (1-2 天)

#### 6.1 代码清理
- [ ] 🧹 移除旧的 shadcn/ui 组件
- [ ] 🧹 清理未使用的依赖
- [ ] 🧹 更新 import 语句

#### 6.2 文档更新
- [ ] 📚 更新组件使用文档
- [ ] 📚 创建 HeroUI 迁移指南
- [ ] 📚 更新开发者文档

## 组件映射表

| shadcn/ui 组件 | HeroUI 组件 | 优先级 | 复杂度 | 预估时间 |
|----------------|-------------|--------|--------|----------|
| Button | Button | 🔥 高 | 🟢 低 | 2h |
| Card | Card | 🔥 高 | 🟢 低 | 3h |
| Input | Input | 🔥 高 | 🟡 中 | 4h |
| Dialog | Modal | 🔥 高 | 🟡 中 | 6h |
| Navigation Menu | Navbar | 🔥 高 | 🔴 高 | 8h |
| Dropdown Menu | Dropdown | 🟡 中 | 🟡 中 | 4h |
| Select | Select | 🟡 中 | 🟡 中 | 4h |
| Toast | Toast | 🟡 中 | 🟡 中 | 5h |
| Table | Table | 🟡 中 | 🔴 高 | 8h |
| Tabs | Tabs | 🟡 中 | 🟡 中 | 4h |
| Badge | Chip | 🟢 低 | 🟢 低 | 2h |
| Avatar | Avatar | 🟢 低 | 🟢 低 | 2h |
| Progress | Progress | 🟢 低 | 🟢 低 | 2h |
| Skeleton | Skeleton | 🟢 低 | 🟢 低 | 1h |

## 风险评估和缓解策略

### 高风险项目

1. **Navigation Menu 重构**
   - 风险: 复杂的导航逻辑
   - 缓解: 分步骤重构，保留原有功能

2. **Table 组件**
   - 风险: 数据展示逻辑复杂
   - 缓解: 先迁移简单表格，再处理复杂功能

3. **用户指南组件**
   - 风险: 自定义逻辑较多
   - 缓解: 保留核心逻辑，只更新 UI 层

### 依赖风险

1. **Radix UI 依赖移除**
   - 计划: 逐步移除，确保功能不受影响
   - 时机: 所有组件迁移完成后

2. **样式兼容性**
   - 风险: HeroUI 样式与现有样式冲突
   - 缓解: 使用 CSS 模块或命名空间隔离

## 时间安排

### 总体时间: 14-20 工作日

- **第 1-2 天**: 准备工作和环境配置
- **第 3-7 天**: 核心组件重构
- **第 8-12 天**: 页面级重构
- **第 13-15 天**: 样式和主题优化
- **第 16-18 天**: 测试和优化
- **第 19-20 天**: 清理和文档

### 里程碑

- **里程碑 1** (第 2 天): 环境配置完成
- **里程碑 2** (第 7 天): 核心组件重构完成
- **里程碑 3** (第 12 天): 主要页面重构完成
- **里程碑 4** (第 18 天): 测试和优化完成
- **里程碑 5** (第 20 天): 项目交付

## 成功标准

### 功能标准
- [ ] 所有现有功能正常工作
- [ ] 用户体验无明显降级
- [ ] 钱包集成功能完整
- [ ] 响应式设计保持良好

### 性能标准
- [ ] 页面加载时间不超过现有水平
- [ ] Bundle 大小控制在合理范围
- [ ] 组件渲染性能优良

### 代码质量标准
- [ ] TypeScript 类型安全
- [ ] 代码结构清晰
- [ ] 组件复用性良好
- [ ] 文档完整

## 后续优化计划

### 短期优化 (1-2 周)
- 🎨 深度定制 HeroUI 主题
- ✨ 添加更多动画效果
- 📱 移动端体验优化

### 长期优化 (1-2 月)
- 🔧 组件库标准化
- 📚 建立设计系统
- 🧪 自动化测试覆盖
- 🚀 性能监控和优化

---

**注意事项:**
1. 重构过程中保持功能完整性
2. 及时备份重要代码
3. 分阶段测试，确保稳定性
4. 与团队保持沟通，及时反馈问题
5. 关注 HeroUI 版本更新和最佳实践

**联系信息:**
- 项目负责人: [待填写]
- 技术支持: [待填写]
- 文档更新: [待填写]