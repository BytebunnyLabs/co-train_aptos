# 状态管理架构 - Zustand + React Query

## 📁 文件结构

```
/apps/frontend/src/stores/
├── index.ts                    # 主入口文件，导出所有 stores 和工具函数
├── query-client.ts             # React Query 配置和工具
├── training-store.ts           # 训练会话状态管理
├── terminal-store.ts           # 终端状态管理 (WebAssembly 集成)
├── blockchain-store.ts         # 区块链状态管理
├── ui-store.ts                # UI 状态管理
├── MIGRATION_GUIDE.md          # 迁移指南
├── README.md                   # 本文件
└── examples/
    └── TrainingDashboard.example.tsx  # 使用示例
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install zustand @tanstack/react-query @tanstack/react-query-devtools
npm install @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client
npm install immer
```

### 2. 设置应用

```tsx
// app/layout.tsx 或 pages/_app.tsx
import { QueryProvider } from '@/stores/query-client'
import { initializeStores } from '@/stores'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeStores()
  }, [])

  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  )
}
```

### 3. 在组件中使用

```tsx
import { useTrainingStore } from '@/stores/training-store'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/stores/query-client'

function MyComponent() {
  // 客户端状态 (Zustand)
  const { activeSession, setActiveSession } = useTrainingStore()
  
  // 服务器状态 (React Query)
  const { data: sessions, isLoading } = useQuery({
    queryKey: queryKeys.training.sessions(),
    queryFn: () => api.getSessions()
  })
  
  return (
    <div>
      {/* 你的组件内容 */}
    </div>
  )
}
```

## 🏗️ 架构设计

### 状态分离原则

- **客户端状态 (Zustand)**: UI 状态、表单数据、临时状态、WebAssembly 模块
- **服务器状态 (React Query)**: API 数据、缓存数据、实时同步

### Store 职责划分

#### 🎯 Training Store (`training-store.ts`)
- 训练选项和配置
- 活动训练会话
- 训练历史记录
- 实时训练指标
- WebAssembly 训练模块

#### 💻 Terminal Store (`terminal-store.ts`)
- 终端会话管理
- 命令历史
- 系统日志
- 贡献者信息
- 网络统计
- WebAssembly 终端优化

#### ⛓️ Blockchain Store (`blockchain-store.ts`)
- 钱包连接状态
- 网络信息
- 交易管理
- 智能合约交互
- 实时区块链事件

#### 🎨 UI Store (`ui-store.ts`)
- 主题和外观
- 布局设置
- 导航状态
- 通知系统
- 模态框管理
- 加载状态
- 搜索功能
- 命令面板
- 响应式设计
- 无障碍设置
- 性能优化
- 开发者设置

## 🔧 核心功能

### 1. 状态持久化

```tsx
// 自动持久化到 localStorage
const useTrainingStore = create<TrainingStore>()()
  devtools(
    persist(
      (set, get) => ({
        // store 实现
      }),
      {
        name: 'training-store',
        partialize: (state) => ({ 
          // 选择需要持久化的状态
          trainingOptions: state.trainingOptions,
          history: state.history
        })
      }
    ),
    { name: 'TrainingStore' }
  )
```

### 2. 选择器优化

```tsx
// ❌ 不好 - 整个 store 变化都会重新渲染
const store = useTrainingStore()

// ✅ 好 - 只有特定状态变化才会重新渲染
const activeSessions = useTrainingStore(state => state.activeSessions)

// ✅ 更好 - 使用预定义选择器
export const useTrainingActiveSessions = () => 
  useTrainingStore(state => state.activeSessions)
```

### 3. React Query 集成

```tsx
// 查询键工厂
export const queryKeys = {
  training: {
    all: ['training'] as const,
    sessions: () => [...queryKeys.training.all, 'sessions'] as const,
    session: (id: string) => [...queryKeys.training.all, 'session', id] as const,
    options: () => [...queryKeys.training.all, 'options'] as const,
  }
}

// 使用查询
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.training.sessions(),
  queryFn: () => api.getSessions(),
  staleTime: 30000,
  refetchInterval: 60000
})
```

### 4. 乐观更新

```tsx
const mutation = useMutation({
  mutationFn: api.createSession,
  onMutate: async (newSession) => {
    // 取消正在进行的查询
    await queryClient.cancelQueries({ queryKey: queryKeys.training.sessions() })
    
    // 保存之前的数据
    const previousSessions = queryClient.getQueryData(queryKeys.training.sessions())
    
    // 乐观更新
    queryClient.setQueryData(queryKeys.training.sessions(), old => [...old, newSession])
    
    return { previousSessions }
  },
  onError: (err, newSession, context) => {
    // 回滚
    queryClient.setQueryData(queryKeys.training.sessions(), context?.previousSessions)
  },
  onSettled: () => {
    // 重新获取数据
    queryClient.invalidateQueries({ queryKey: queryKeys.training.sessions() })
  }
})
```

### 5. 实时数据同步

```tsx
// WebSocket 集成
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080')
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    switch (data.type) {
      case 'session_update':
        // 更新特定会话缓存
        queryClient.setQueryData(
          queryKeys.training.session(data.sessionId),
          data.session
        )
        break
        
      case 'new_participant':
        // 刷新会话列表
        queryClient.invalidateQueries({
          queryKey: queryKeys.training.sessions()
        })
        break
    }
  }
  
  return () => ws.close()
}, [])
```

## 🎯 最佳实践

### 1. 组件优化

```tsx
// 使用 React.memo 避免不必要的重新渲染
const TrainingItem = React.memo(function TrainingItem({ sessionId }) {
  // 只订阅需要的数据
  const session = useTrainingStore(
    state => state.sessions.find(s => s.id === sessionId)
  )
  
  return <div>{session?.name}</div>
})

// 使用 shallow 比较避免引用变化
import { shallow } from 'zustand/shallow'

const { sessions, loading } = useTrainingStore(
  state => ({ sessions: state.sessions, loading: state.loading }),
  shallow
)
```

### 2. 错误处理

```tsx
// 全局错误处理在 query-client.ts 中配置
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        // 自动显示错误通知
        useUIStore.getState().showNotification({
          type: 'error',
          title: '操作失败',
          message: error.message
        })
      }
    }
  }
})

// 组件级错误处理
const { error, isError, refetch } = useQuery({
  queryKey: queryKeys.training.sessions(),
  queryFn: api.getSessions,
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
})

if (isError) {
  return (
    <div className="error-state">
      <p>加载失败: {error.message}</p>
      <button onClick={() => refetch()}>重试</button>
    </div>
  )
}
```

### 3. 性能监控

```tsx
// 开发环境性能监控
if (process.env.NODE_ENV === 'development') {
  // 订阅 store 变化
  subscribeToStoreChanges((storeName, state, previousState) => {
    console.log(`[${storeName}] State changed:`, {
      previous: previousState,
      current: state
    })
  })
  
  // 监控查询性能
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated') {
      console.log('Query updated:', event.query.queryKey)
    }
  })
}
```

### 4. 类型安全

```tsx
// 确保所有 store 都有完整的类型定义
interface TrainingState {
  sessions: TrainingSession[]
  activeSessions: string[]
  loading: boolean
}

interface TrainingActions {
  addSession: (session: TrainingSession) => void
  removeSession: (id: string) => void
  setLoading: (loading: boolean) => void
}

type TrainingStore = TrainingState & TrainingActions

// 使用严格的查询键类型
type QueryKeys = {
  training: {
    all: readonly ['training']
    sessions: readonly ['training', 'sessions']
    session: (id: string) => readonly ['training', 'session', string]
  }
}
```

## 🔍 调试工具

### 1. Redux DevTools

所有 Zustand stores 都集成了 Redux DevTools，可以在浏览器开发者工具中查看状态变化。

### 2. React Query DevTools

```tsx
// 开发环境自动启用
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryProvider>
      <YourApp />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryProvider>
  )
}
```

### 3. 调试工具函数

```tsx
// 在浏览器控制台中使用
window.__queryClient // React Query 客户端
window.__queryUtils  // 查询工具函数
window.__queryKeys   // 查询键

// 获取所有 store 状态
import { getStoreStates } from '@/stores'
console.log(getStoreStates())

// 重置所有 stores
import { resetAllStores } from '@/stores'
resetAllStores()

// 清除持久化数据
import { clearStorePersistence } from '@/stores'
clearStorePersistence()
```

## 📊 性能优化

### 1. 查询优化

```tsx
// 使用 select 选择特定数据
const sessionNames = useQuery({
  queryKey: queryKeys.training.sessions(),
  queryFn: api.getSessions,
  select: (data) => data.map(session => session.name)
})

// 预取数据
const queryClient = useQueryClient()
queryClient.prefetchQuery({
  queryKey: queryKeys.training.options(),
  queryFn: api.getTrainingOptions
})

// 并行查询
const queries = useQueries({
  queries: [
    {
      queryKey: queryKeys.training.sessions(),
      queryFn: api.getSessions
    },
    {
      queryKey: queryKeys.training.options(),
      queryFn: api.getTrainingOptions
    }
  ]
})
```

### 2. 状态订阅优化

```tsx
// 使用计算属性避免重复计算
const activeSessionsCount = useTrainingStore(
  state => state.activeSessions.length
)

// 使用 useMemo 缓存复杂计算
const sortedSessions = useMemo(() => {
  return sessions?.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}, [sessions])
```

### 3. 代码分割

```tsx
// 懒加载 stores
const useTrainingStore = lazy(() => import('./training-store'))
const useTerminalStore = lazy(() => import('./terminal-store'))

// 懒加载组件
const TrainingDashboard = lazy(() => import('./components/TrainingDashboard'))
```

## 🚀 部署注意事项

### 1. 环境变量

```env
# .env.production
REACT_APP_API_URL=https://api.cotrain.com
REACT_APP_WS_URL=wss://ws.cotrain.com
REACT_APP_ENABLE_DEVTOOLS=false
```

### 2. 缓存策略

```tsx
// 生产环境缓存配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 0,
      cacheTime: process.env.NODE_ENV === 'production' ? 10 * 60 * 1000 : 5 * 60 * 1000,
      retry: process.env.NODE_ENV === 'production' ? 3 : 1
    }
  }
})
```

### 3. 错误监控

```tsx
// 集成错误监控服务
import * as Sentry from '@sentry/react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        if (process.env.NODE_ENV === 'production') {
          Sentry.captureException(error)
        }
      }
    }
  }
})
```

## 📚 相关资源

- [Zustand 官方文档](https://zustand-demo.pmnd.rs/)
- [React Query 官方文档](https://tanstack.com/query/latest)
- [迁移指南](./MIGRATION_GUIDE.md)
- [使用示例](./examples/TrainingDashboard.example.tsx)

## 🤝 贡献指南

1. 遵循现有的代码风格和命名约定
2. 为新功能添加类型定义
3. 更新相关文档
4. 添加单元测试
5. 确保性能优化

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 初始版本
- 🚀 Zustand + React Query 架构
- 📱 完整的状态管理解决方案
- 🔧 开发工具集成
- 📖 完整的文档和示例