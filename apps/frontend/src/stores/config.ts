/**
 * 状态管理配置文件
 * 管理 Zustand 和 React Query 的配置选项
 */

// 环境检测
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const isTesting = process.env.NODE_ENV === 'test'

/**
 * React Query 配置
 */
export const queryConfig = {
  // 默认查询选项
  defaultOptions: {
    queries: {
      // 数据被认为是新鲜的时间 (毫秒)
      staleTime: isDevelopment ? 0 : 5 * 60 * 1000, // 开发环境: 0, 生产环境: 5分钟
      
      // 缓存时间 (毫秒)
      cacheTime: isDevelopment ? 5 * 60 * 1000 : 10 * 60 * 1000, // 开发环境: 5分钟, 生产环境: 10分钟
      
      // 重试次数
      retry: isDevelopment ? 1 : 3,
      
      // 重试延迟 (指数退避)
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // 窗口重新获得焦点时重新获取
      refetchOnWindowFocus: isProduction,
      
      // 重新连接时重新获取
      refetchOnReconnect: true,
      
      // 挂载时重新获取
      refetchOnMount: true,
      
      // 网络错误时重试
      retryOnMount: true,
      
      // 查询超时时间
      queryTimeout: 30000, // 30秒
    },
    
    mutations: {
      // 变更重试次数
      retry: isDevelopment ? 0 : 2,
      
      // 变更重试延迟
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
      
      // 变更超时时间
      mutationTimeout: 60000, // 60秒
    }
  },
  
  // 持久化配置
  persistence: {
    enabled: !isTesting,
    key: 'cotrain-query-cache',
    version: 1,
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    buster: process.env.REACT_APP_CACHE_BUSTER || 'v1.0.0'
  },
  
  // 开发工具配置
  devtools: {
    enabled: isDevelopment,
    initialIsOpen: false,
    position: 'bottom-right' as const
  }
}

/**
 * Zustand Store 配置
 */
export const storeConfig = {
  // 持久化配置
  persistence: {
    enabled: !isTesting,
    version: 1,
    migrate: (persistedState: any, version: number) => {
      // 处理版本迁移
      if (version === 0) {
        // 从 v0 迁移到 v1 的逻辑
        return {
          ...persistedState,
          version: 1
        }
      }
      return persistedState
    },
    partialize: {
      // 训练 store 持久化配置
      training: (state: any) => ({
        trainingOptions: state.trainingOptions,
        history: state.history,
        preferences: state.preferences
      }),
      
      // UI store 持久化配置
      ui: (state: any) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        preferences: state.preferences,
        settings: state.settings
      }),
      
      // 区块链 store 持久化配置
      blockchain: (state: any) => ({
        networkPreference: state.networkPreference,
        walletPreference: state.walletPreference
      }),
      
      // 终端 store 不持久化 (实时数据)
      terminal: () => ({})
    }
  },
  
  // 开发工具配置
  devtools: {
    enabled: isDevelopment,
    name: 'CoTrain Store',
    serialize: true,
    trace: isDevelopment
  },
  
  // 中间件配置
  middleware: {
    immer: {
      enabled: true,
      autoFreeze: isDevelopment
    },
    
    logger: {
      enabled: isDevelopment,
      collapsed: true,
      filter: (mutation: any, stateBefore: any, stateAfter: any) => {
        // 过滤掉频繁的状态更新
        const ignoredActions = ['updateProgress', 'updateMetrics', 'addLog']
        return !ignoredActions.some(action => mutation.type?.includes(action))
      }
    }
  }
}

/**
 * WebSocket 配置
 */
export const websocketConfig = {
  // 连接配置
  connection: {
    url: process.env.REACT_APP_WS_URL || 'ws://localhost:8080',
    protocols: ['cotrain-protocol'],
    
    // 重连配置
    reconnect: {
      enabled: true,
      maxAttempts: isDevelopment ? 3 : 10,
      delay: 1000,
      maxDelay: 30000,
      backoff: 1.5
    },
    
    // 心跳配置
    heartbeat: {
      enabled: true,
      interval: 30000, // 30秒
      timeout: 5000    // 5秒
    }
  },
  
  // 事件配置
  events: {
    // 自动重连的事件类型
    autoReconnectEvents: [
      'sessionUpdate',
      'notification',
      'rewardUpdate',
      'transactionUpdate'
    ],
    
    // 需要认证的事件类型
    authenticatedEvents: [
      'joinSession',
      'createSession',
      'submitTransaction'
    ]
  }
}

/**
 * WebAssembly 配置
 */
export const wasmConfig = {
  // 模块配置
  modules: {
    training: {
      url: '/wasm/training.wasm',
      enabled: true,
      fallback: true // 如果 WASM 不可用，使用 JS 实现
    },
    
    terminal: {
      url: '/wasm/terminal.wasm',
      enabled: true,
      fallback: true
    },
    
    crypto: {
      url: '/wasm/crypto.wasm',
      enabled: true,
      fallback: false // 加密功能必须使用 WASM
    }
  },
  
  // 性能配置
  performance: {
    // 内存限制 (MB)
    memoryLimit: 256,
    
    // 执行超时 (毫秒)
    executionTimeout: 30000,
    
    // 是否启用多线程
    multiThreading: true,
    
    // 工作线程数量
    workerCount: navigator.hardwareConcurrency || 4
  },
  
  // 调试配置
  debug: {
    enabled: isDevelopment,
    logLevel: isDevelopment ? 'debug' : 'error',
    profiling: isDevelopment
  }
}

/**
 * API 配置
 */
export const apiConfig = {
  // 基础配置
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 30000,
  
  // 重试配置
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 2,
    retryCondition: (error: any) => {
      // 只对网络错误和 5xx 错误重试
      return !error.response || (error.response.status >= 500 && error.response.status < 600)
    }
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5分钟
    maxSize: 100 // 最多缓存 100 个请求
  },
  
  // 请求拦截器配置
  interceptors: {
    request: {
      // 自动添加认证头
      auth: true,
      
      // 自动添加时间戳
      timestamp: true,
      
      // 请求 ID (用于追踪)
      requestId: true
    },
    
    response: {
      // 自动处理错误
      errorHandling: true,
      
      // 自动显示通知
      notifications: {
        success: false, // 不显示成功通知
        error: true     // 显示错误通知
      }
    }
  }
}

/**
 * 性能监控配置
 */
export const performanceConfig = {
  // 监控开关
  enabled: isDevelopment || process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
  
  // 监控指标
  metrics: {
    // 组件渲染时间
    componentRender: true,
    
    // 状态更新时间
    stateUpdate: true,
    
    // API 请求时间
    apiRequest: true,
    
    // WebAssembly 执行时间
    wasmExecution: true,
    
    // 内存使用情况
    memoryUsage: true
  },
  
  // 采样率 (0-1)
  sampleRate: isDevelopment ? 1 : 0.1,
  
  // 报告配置
  reporting: {
    // 控制台输出
    console: isDevelopment,
    
    // 发送到分析服务
    analytics: isProduction,
    
    // 本地存储
    localStorage: isDevelopment
  }
}

/**
 * 安全配置
 */
export const securityConfig = {
  // CSP 配置
  csp: {
    enabled: isProduction,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'ws:', 'wss:', 'https:']
    }
  },
  
  // 数据加密
  encryption: {
    // 本地存储加密
    localStorage: isProduction,
    
    // 敏感数据加密
    sensitiveData: true,
    
    // 加密算法
    algorithm: 'AES-GCM',
    
    // 密钥长度
    keyLength: 256
  },
  
  // 输入验证
  validation: {
    // 严格模式
    strict: isProduction,
    
    // 自动清理
    sanitize: true,
    
    // 最大输入长度
    maxInputLength: 10000
  }
}

/**
 * 功能开关配置
 */
export const featureFlags = {
  // WebAssembly 支持
  webAssembly: true,
  
  // 实时通信
  realTimeUpdates: true,
  
  // 离线支持
  offlineSupport: false,
  
  // 高级分析
  advancedAnalytics: isProduction,
  
  // 实验性功能
  experimental: {
    // 虚拟滚动
    virtualScrolling: true,
    
    // 预测性预加载
    predictivePrefetching: false,
    
    // 智能缓存
    smartCaching: false
  }
}

/**
 * 导出所有配置
 */
export const config = {
  query: queryConfig,
  store: storeConfig,
  websocket: websocketConfig,
  wasm: wasmConfig,
  api: apiConfig,
  performance: performanceConfig,
  security: securityConfig,
  features: featureFlags,
  
  // 环境信息
  env: {
    isDevelopment,
    isProduction,
    isTesting,
    version: process.env.REACT_APP_VERSION || '1.0.0',
    buildTime: process.env.REACT_APP_BUILD_TIME || new Date().toISOString()
  }
}

export default config

/**
 * 配置验证函数
 */
export function validateConfig() {
  const errors: string[] = []
  
  // 验证必需的环境变量
  if (!process.env.REACT_APP_API_URL && isProduction) {
    errors.push('REACT_APP_API_URL is required in production')
  }
  
  if (!process.env.REACT_APP_WS_URL && isProduction) {
    errors.push('REACT_APP_WS_URL is required in production')
  }
  
  // 验证配置值
  if (queryConfig.defaultOptions.queries.staleTime < 0) {
    errors.push('Query staleTime must be non-negative')
  }
  
  if (wasmConfig.performance.memoryLimit < 64) {
    errors.push('WASM memory limit must be at least 64MB')
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors)
    if (isProduction) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`)
    }
  }
  
  return errors.length === 0
}

/**
 * 获取运行时配置
 */
export function getRuntimeConfig() {
  return {
    ...config,
    runtime: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      memory: (navigator as any).deviceMemory,
      connection: (navigator as any).connection
    }
  }
}