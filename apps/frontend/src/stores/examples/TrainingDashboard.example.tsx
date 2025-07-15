/**
 * 训练仪表板示例组件
 * 展示如何使用新的 Zustand + React Query 状态管理架构
 */

import React, { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTrainingStore } from '../training-store'
import { useTerminalStore } from '../terminal-store'
import { useBlockchainStore } from '../blockchain-store'
import { useUIStore } from '../ui-store'
import { queryKeys } from '../query-client'
import { smartApi } from '@/services/api'
import type { TrainingSession, TrainingOption } from '@/types/cotrain'

/**
 * 主训练仪表板组件
 * 演示了如何结合使用 Zustand 和 React Query
 */
export function TrainingDashboard() {
  // 1. 使用 Zustand 管理客户端状态 (UI 状态、临时数据)
  const {
    activeSession,
    setActiveSession,
    trainingProgress,
    updateProgress,
    wasmModule,
    initializeWasm
  } = useTrainingStore()

  const {
    theme,
    sidebarOpen,
    setSidebarOpen,
    showNotification
  } = useUIStore()

  const {
    wallet,
    networkStatus,
    connectWallet
  } = useBlockchainStore()

  // 2. 使用 React Query 管理服务器状态 (API 数据)
  const {
    data: trainingSessions,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: queryKeys.training.sessions(),
    queryFn: () => smartApi.getTrainingSessions(),
    refetchInterval: 30000, // 每30秒自动刷新
    staleTime: 10000 // 10秒内认为数据是新鲜的
  })

  const {
    data: trainingOptions,
    isLoading: optionsLoading
  } = useQuery({
    queryKey: queryKeys.training.options(),
    queryFn: () => smartApi.getTrainingOptions(),
    staleTime: 5 * 60 * 1000 // 5分钟内不重新获取
  })

  // 3. 使用 Mutation 处理数据变更
  const queryClient = useQueryClient()
  
  const createSessionMutation = useMutation({
    mutationFn: (sessionData: Partial<TrainingSession>) => 
      smartApi.createTrainingSession(sessionData),
    onMutate: async (newSession) => {
      // 乐观更新：立即更新 UI
      await queryClient.cancelQueries({ queryKey: queryKeys.training.sessions() })
      
      const previousSessions = queryClient.getQueryData(queryKeys.training.sessions())
      
      // 临时添加新会话到缓存
      queryClient.setQueryData(queryKeys.training.sessions(), (old: TrainingSession[] = []) => [
        ...old,
        { ...newSession, id: 'temp-' + Date.now(), status: 'active' } as TrainingSession
      ])
      
      return { previousSessions }
    },
    onError: (error, newSession, context) => {
      // 错误时回滚
      queryClient.setQueryData(queryKeys.training.sessions(), context?.previousSessions)
      showNotification({
        type: 'error',
        title: '创建训练会话失败',
        message: error.message
      })
    },
    onSuccess: (data) => {
      // 成功后刷新数据
      queryClient.invalidateQueries({ queryKey: queryKeys.training.sessions() })
      const sessionData = data as any
      setActiveSession(sessionData.id)
      showNotification({
        type: 'success',
        title: '训练会话创建成功',
        message: `会话 ${sessionData.name} 已创建`
      })
    }
  })

  const joinSessionMutation = useMutation({
    mutationFn: (sessionId: string) => smartApi.joinTrainingSession(sessionId),
    onSuccess: (data) => {
      const sessionData = data as any
      setActiveSession(sessionData.id)
      // 更新特定会话的缓存
      queryClient.setQueryData(
        queryKeys.training.session(sessionData.id),
        sessionData
      )
    }
  })

  // 4. 初始化 WebAssembly 模块
  useEffect(() => {
    if (!wasmModule) {
      initializeWasm()
    }
  }, [])

  // 5. 处理实时更新 (WebSocket)
  useEffect(() => {
    if (!activeSession) return

    const ws = new WebSocket(`ws://localhost:8080/training/${activeSession}`)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'progress_update':
          updateProgress(data.sessionId, data.progress)
          break
          
        case 'session_completed':
          // 刷新会话数据
          queryClient.invalidateQueries({
            queryKey: queryKeys.training.session(data.sessionId)
          })
          showNotification({
            type: 'success',
            title: '训练完成',
            message: `会话 ${data.sessionName} 已完成`
          })
          break
          
        case 'participant_joined':
          // 更新参与者列表
          queryClient.setQueryData(
            queryKeys.training.session(data.sessionId),
            (old: TrainingSession | undefined) => {
              if (!old) return old
              return {
                ...old,
                participants: [...(old.participants || []), data.participant]
              }
            }
          )
          break
      }
    }
    
    return () => ws.close()
  }, [activeSession])

  // 6. 事件处理函数
  const handleCreateSession = (option: TrainingOption) => {
    if (!wallet.connected) {
      connectWallet('default')
      return
    }
    
    createSessionMutation.mutate({
      name: `${option.title} - ${new Date().toLocaleString()}`,
      trainingOptionId: option.id,
      participants: []
    })
  }

  const handleJoinSession = (sessionId: string) => {
    if (!wallet.connected) {
      connectWallet('default')
      return
    }
    
    joinSessionMutation.mutate(sessionId)
  }

  // 7. 加载状态处理
  if (sessionsLoading || optionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">加载训练数据...</span>
      </div>
    )
  }

  // 8. 错误状态处理
  if (sessionsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">加载失败</h3>
        <p className="text-red-600 mt-1">{sessionsError.message}</p>
        <button 
          onClick={() => refetchSessions()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className={`training-dashboard ${theme.mode === 'dark' ? 'dark' : ''}`}>
      {/* 头部状态栏 */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold">训练仪表板</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 网络状态 */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              networkStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {networkStatus === 'connected' ? '已连接' : '未连接'}
            </span>
          </div>
          
          {/* 钱包状态 */}
          {wallet.connected ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {wallet.info?.address?.slice(0, 6)}...{wallet.info?.address?.slice(-4)}
            </div>
          ) : (
            <button
              onClick={() => connectWallet('default')}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              连接钱包
            </button>
          )}
        </div>
      </div>

      <div className="flex">
        {/* 侧边栏 */}
        {sidebarOpen && (
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r p-4">
            <h2 className="font-medium mb-4">训练选项</h2>
            <div className="space-y-2">
              {trainingOptions?.data?.map((option: any) => (
                <div key={option.id} className="p-3 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                  <h3 className="font-medium">{option.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {option.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {option.difficulty}
                    </span>
                    <button
                      onClick={() => handleCreateSession(option)}
                      disabled={createSessionMutation.isPending}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createSessionMutation.isPending ? '创建中...' : '创建会话'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 主内容区 */}
        <div className="flex-1 p-6">
          {/* 活动会话 */}
          {activeSession && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h2 className="font-medium text-blue-800 dark:text-blue-200">当前训练会话</h2>
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span>会话 ID: {activeSession}</span>
                  <span>进度: {trainingProgress[activeSession] || 0}%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${trainingProgress[activeSession] || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* 训练会话列表 */}
          <div>
            <h2 className="text-lg font-medium mb-4">可用训练会话</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainingSessions?.data?.map((session: any) => (
                <div key={session.id} className="p-4 border rounded-md hover:shadow-md transition-shadow">
                  <h3 className="font-medium">{session.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    参与者: {session.participants?.length || 0}/{session.maxParticipants || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    状态: {session.status}
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleJoinSession(session.id)}
                      disabled={joinSessionMutation.isPending || (session.participants?.length || 0) >= (session.maxParticipants || 0)}
                      className="flex-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      {joinSessionMutation.isPending ? '加入中...' : '加入会话'}
                    </button>
                    <button
                      onClick={() => {
                        queryClient.invalidateQueries({
                          queryKey: queryKeys.training.session(session.id)
                        })
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                    >
                      刷新
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 训练会话详情组件
 * 展示如何使用选择器优化性能
 */
export function TrainingSessionDetail({ sessionId }: { sessionId: string }) {
  // 使用选择器只订阅需要的数据
  const sessionProgress = useTrainingStore(
    state => state.trainingProgress[sessionId]
  )
  
  const sessionMetrics = useTrainingStore(
    state => state.sessions.find(s => s.id === sessionId)?.metrics
  )

  // 获取特定会话的详细信息
  const { data: session, isLoading } = useQuery({
    queryKey: queryKeys.training.session(sessionId),
    queryFn: () => smartApi.getTrainingSession(sessionId),
    enabled: !!sessionId
  })

  if (isLoading) {
    return <div>加载会话详情...</div>
  }

  if (!session) {
    return <div>会话不存在</div>
  }

  return (
    <div className="training-session-detail">
      <h2 className="text-xl font-semibold mb-4">{session.data?.name || 'Training Session'}</h2>
      
      {/* 实时进度 */}
      {sessionProgress && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">训练进度</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>完成度</span>
              <span>{sessionProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${sessionProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      {/* 实时指标 */}
      {sessionMetrics && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">性能指标</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">准确率</div>
              <div className="text-lg font-semibold">{sessionMetrics.accuracy}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">损失</div>
              <div className="text-lg font-semibold">{sessionMetrics.loss?.toFixed(4) || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 参与者列表 */}
      <div>
        <h3 className="font-medium mb-2">参与者 ({session.data?.participants?.length || 0})</h3>
        <div className="space-y-2">
          {session.data?.participants?.map((participant: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{participant.address}</span>
              <span className="text-xs text-gray-500">贡献: {participant.contribution}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 性能优化的训练列表组件
 * 展示如何使用 React.memo 和选择器优化渲染
 */
export const TrainingSessionList = React.memo(function TrainingSessionList() {
  // 只订阅会话列表，不订阅其他状态
  const sessions = useTrainingStore(state => state.sessions)
  
  return (
    <div className="space-y-2">
      {sessions.map(session => (
        <TrainingSessionItem key={session.id} sessionId={session.id} />
      ))}
    </div>
  )
})

/**
 * 单个训练会话项组件
 * 展示如何优化单个项目的渲染
 */
const TrainingSessionItem = React.memo(function TrainingSessionItem({ 
  sessionId 
}: { 
  sessionId: string 
}) {
  // 只订阅特定会话的数据
  const session = useTrainingStore(
    state => state.sessions.find(s => s.id === sessionId)
  )
  
  const progress = useTrainingStore(
    state => state.trainingProgress[sessionId]
  )

  if (!session) return null

  return (
    <div className="p-3 border rounded hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <span className="font-medium">{session.name}</span>
        <span className="text-sm text-gray-500">
          {progress || 0}%
        </span>
      </div>
    </div>
  )
})

export default TrainingDashboard