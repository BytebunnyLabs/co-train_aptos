# 状态管理迁移指南

## 概述

本指南将帮助您从现有的 React useState + Context 状态管理迁移到新的 Zustand + React Query 架构。

## 新架构优势

### 🚀 性能优化
- **选择性订阅**: 只有使用特定状态的组件才会重新渲染
- **自动批处理**: Zustand 自动批处理状态更新
- **内存优化**: 更好的内存管理和垃圾回收

### 🔄 状态管理
- **类型安全**: 完整的 TypeScript 支持
- **开发工具**: Redux DevTools 集成
- **持久化**: 自动状态持久化到 localStorage
- **中间件**: 支持 immer、persist、devtools 等中间件

### 🌐 服务器状态
- **缓存管理**: React Query 自动处理缓存、重新获取和同步
- **后台更新**: 自动后台数据更新
- **乐观更新**: 支持乐观更新模式
- **错误处理**: 统一的错误处理和重试机制

## 迁移步骤

### 1. 安装依赖

```bash
npm install zustand @tanstack/react-query @tanstack/react-query-devtools
npm install @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client
npm install immer
```

### 2. 设置 Query Client

在您的应用根组件中设置 Query Provider：

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

### 3. 迁移现有状态

#### 旧方式 (Context + useState)

```tsx
// 旧的 Context 方式
const TrainingContext = createContext()

function TrainingProvider({ children }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  
  const loadSessions = async () => {
    setLoading(true)
    try {
      const data = await api.getSessions()
      setSessions(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <TrainingContext.Provider value={{ sessions, loading, loadSessions }}>
      {children}
    </TrainingContext.Provider>
  )
}
```

#### 新方式 (Zustand + React Query)

```tsx
// 新的 Zustand Store
import { useTrainingStore } from '@/stores/training-store'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/stores/query-client'

// 在组件中使用
function TrainingComponent() {
  // 客户端状态 (UI 状态、临时数据)
  const { activeSession, setActiveSession } = useTrainingStore()
  
  // 服务器状态 (API 数据)
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: queryKeys.training.sessions(),
    queryFn: () => api.getSessions()
  })
  
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {sessions?.map(session => (
        <div key={session.id}>{session.name}</div>
      ))}
    </div>
  )
}
```

### 4. 组件迁移示例

#### 迁移前

```tsx
function TerminalPage() {
  const [logs, setLogs] = useState([])
  const [contributors, setContributors] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [logsData, contributorsData] = await Promise.all([
        api.getLogs(),
        api.getContributors()
      ])
      setLogs(logsData)
      setContributors(contributorsData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      <LogsList logs={logs} />
      <ContributorsList contributors={contributors} />
    </div>
  )
}
```

#### 迁移后

```tsx
function TerminalPage() {
  // 使用 Zustand 管理 UI 状态
  const { 
    selectedSession, 
    setSelectedSession,
    terminalSettings 
  } = useTerminalStore()
  
  // 使用 React Query 管理服务器数据
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: queryKeys.terminal.logs(selectedSession?.id),
    queryFn: () => api.getLogs(selectedSession?.id),
    enabled: !!selectedSession
  })
  
  const { data: contributors, isLoading: contributorsLoading } = useQuery({
    queryKey: queryKeys.terminal.contributors(),
    queryFn: () => api.getContributors(),
    refetchInterval: 30000 // 每30秒自动刷新
  })
  
  const isLoading = logsLoading || contributorsLoading
  
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      <LogsList logs={logs || []} />
      <ContributorsList contributors={contributors || []} />
    </div>
  )
}
```

### 5. 状态选择器优化

使用选择器避免不必要的重新渲染：

```tsx
// ❌ 不好 - 整个 store 变化都会触发重新渲染
const store = useTrainingStore()

// ✅ 好 - 只有 activeSessions 变化才会重新渲染
const activeSessions = useTrainingStore(state => state.activeSessions)

// ✅ 更好 - 使用预定义的选择器
const activeSessions = useTrainingStore(useTrainingActiveSessions)
```

### 6. 错误处理

```tsx
// 全局错误处理
function MyComponent() {
  const { mutate: createSession, error, isError } = useMutation({
    mutationFn: api.createSession,
    onError: (error) => {
      // 错误会自动显示通知 (在 query-client.ts 中配置)
      console.error('Failed to create session:', error)
    },
    onSuccess: (data) => {
      // 成功后刷新相关查询
      queryClient.invalidateQueries({ queryKey: queryKeys.training.sessions() })
    }
  })
  
  return (
    <div>
      {isError && <div>Error: {error?.message}</div>}
      <button onClick={() => createSession(sessionData)}>
        Create Session
      </button>
    </div>
  )
}
```

### 7. 实时数据更新

```tsx
// WebSocket 集成示例
function useRealtimeUpdates() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'session_update':
          // 更新特定会话的缓存
          queryClient.setQueryData(
            queryKeys.training.session(data.sessionId),
            data.session
          )
          break
          
        case 'new_contributor':
          // 刷新贡献者列表
          queryClient.invalidateQueries({
            queryKey: queryKeys.terminal.contributors()
          })
          break
      }
    }
    
    return () => ws.close()
  }, [])
}
```

## 最佳实践

### 1. 状态分离

- **客户端状态**: 使用 Zustand (UI 状态、表单数据、临时状态)
- **服务器状态**: 使用 React Query (API 数据、缓存数据)

### 2. Store 组织

```tsx
// 按功能域分离 stores
├── training-store.ts    // 训练相关状态
├── terminal-store.ts    // 终端相关状态
├── blockchain-store.ts  // 区块链相关状态
└── ui-store.ts         // UI 相关状态
```

### 3. 选择器使用

```tsx
// 创建专用选择器
export const useTrainingActiveSessions = () => 
  useTrainingStore(state => state.activeSessions)

export const useTrainingMetrics = (sessionId: string) => 
  useTrainingStore(state => state.sessions[sessionId]?.metrics)
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
```

## 性能优化技巧

### 1. 查询优化

```tsx
// 使用 select 选择特定数据
const sessionNames = useQuery({
  queryKey: queryKeys.training.sessions(),
  queryFn: api.getSessions,
  select: (data) => data.map(session => session.name) // 只选择需要的数据
})

// 预取数据
const queryClient = useQueryClient()
queryClient.prefetchQuery({
  queryKey: queryKeys.training.options(),
  queryFn: api.getTrainingOptions
})
```

### 2. 状态订阅优化

```tsx
// 使用浅比较避免不必要的重新渲染
const { sessions, loading } = useTrainingStore(
  state => ({ sessions: state.sessions, loading: state.loading }),
  shallow
)
```

### 3. 批量更新

```tsx
// Zustand 自动批处理，但可以手动控制
const updateMultipleStates = () => {
  useTrainingStore.setState((state) => {
    state.loading = true
    state.error = null
    state.sessions = []
  })
}
```

## 调试工具

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
```

## 常见问题

### Q: 如何处理表单状态？

A: 简单表单使用 React 本地状态，复杂表单使用 Zustand：

```tsx
// 简单表单
function SimpleForm() {
  const [email, setEmail] = useState('')
  return <input value={email} onChange={e => setEmail(e.target.value)} />
}

// 复杂表单
function ComplexForm() {
  const { formData, setFormField, resetForm } = useUIStore()
  return (
    <input 
      value={formData.email} 
      onChange={e => setFormField('email', e.target.value)} 
    />
  )
}
```

### Q: 如何处理乐观更新？

A: 使用 React Query 的乐观更新功能：

```tsx
const { mutate } = useMutation({
  mutationFn: api.updateSession,
  onMutate: async (newSession) => {
    // 取消正在进行的查询
    await queryClient.cancelQueries({ queryKey: queryKeys.training.sessions() })
    
    // 保存之前的数据
    const previousSessions = queryClient.getQueryData(queryKeys.training.sessions())
    
    // 乐观更新
    queryClient.setQueryData(queryKeys.training.sessions(), old => 
      old?.map(session => session.id === newSession.id ? newSession : session)
    )
    
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

### Q: 如何处理认证状态？

A: 在 blockchain-store 中管理钱包连接状态：

```tsx
const { wallet, connectWallet, disconnectWallet } = useBlockchainStore()

// 在路由守卫中使用
function ProtectedRoute({ children }) {
  if (!wallet.connected) {
    return <LoginPage />
  }
  return children
}
```

## 总结

新的状态管理架构提供了：

- ✅ 更好的性能和开发体验
- ✅ 类型安全和自动补全
- ✅ 强大的缓存和同步机制
- ✅ 优秀的调试工具
- ✅ 更好的代码组织和维护性

按照本指南逐步迁移，您将获得更现代、更高效的状态管理解决方案。