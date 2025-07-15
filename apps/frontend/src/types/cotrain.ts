import type React from "react"
export interface Contributor {
  id: number
  name: string
  contributions: number
  status: "ONLINE" | "TRAINING" | "OFFLINE" | "CONNECTING"
  location?: string
  joinDate?: string
  hardware?: {
    gpu: string
    memory: string
    cores: number
  }
}

export interface SystemLog {
  timestamp: string
  message: string
  type: "INFO" | "SUCCESS" | "ERROR" | "WARNING"
  category?: "NETWORK" | "TRAINING" | "SYSTEM" | "USER"
}

export interface TrainingOption {
  id: string
  title: string
  description: string
  iconName: string
  status: "available" | "training" | "completed" | "coming-soon"
  participants?: number
  progress?: number
  estimatedDuration?: string
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
  rewards?: {
    tokens: number
    reputation: number
    nfts?: number
  }
  requirements?: {
    minGPU?: string
    minRAM?: string
    bandwidth?: string
  }
}

export interface TrainingHistory {
  id: string
  title: string
  description: string
  iconName: string
  startDate: string
  endDate?: string
  status: "completed" | "active" | "paused" | "failed"
  contribution: {
    computeHours: number
    tokensProcessed: number
    rank: number
    totalParticipants: number
    efficiency: number
  }
  rewards: {
    tokens: number
    nfts: number
    reputation: number
  }
  progress: number
  duration: string
  tags?: string[]
}

export interface UserProfile {
  id: string
  username: string
  email: string
  avatar?: string
  joinDate: string
  totalContributions: number
  reputation: number
  level: number
  badges: Badge[]
  preferences: UserPreferences
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
  earnedDate: string
}

export interface UserPreferences {
  theme: "dark" | "light" | "auto"
  notifications: {
    email: boolean
    push: boolean
    training: boolean
    rewards: boolean
  }
  privacy: {
    showProfile: boolean
    showStats: boolean
    showLocation: boolean
  }
}

export interface NetworkStats {
  totalNodes: number
  activeNodes: number
  totalComputeHours: number
  modelsTraining: number
  totalContributors: number
  networkHealth: number
}

export interface ChartData {
  date: string
  computeHours: number
  tokens: number
  reputation: number
  rank: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Training Session Types
export interface TrainingSession {
  id: string
  name?: string
  trainingOptionId: string
  userId: string
  startTime: string
  endTime?: string
  status: "active" | "paused" | "completed" | "failed"
  progress: number
  computeContributed: number
  tokensEarned: number
  reputationEarned: number
  metrics: TrainingMetrics
  participants?: any[]
}

export interface TrainingMetrics {
  accuracy?: number
  loss?: number
  throughput: number
  efficiency: number
  uptime: number
  errorRate: number
}

// Hardware Types
export interface HardwareSpec {
  gpu: GPUSpec
  cpu: CPUSpec
  memory: MemorySpec
  storage: StorageSpec
  network: NetworkSpec
}

export interface GPUSpec {
  model: string
  memory: number // GB
  computeCapability: string
  powerConsumption: number // Watts
}

export interface CPUSpec {
  model: string
  cores: number
  threads: number
  baseFrequency: number // GHz
  maxFrequency: number // GHz
}

export interface MemorySpec {
  total: number // GB
  type: "DDR4" | "DDR5"
  speed: number // MHz
}

export interface StorageSpec {
  total: number // GB
  type: "SSD" | "HDD" | "NVMe"
  readSpeed: number // MB/s
  writeSpeed: number // MB/s
}

export interface NetworkSpec {
  bandwidth: number // Mbps
  latency: number // ms
  reliability: number // percentage
}

// Notification Types
export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  duration?: number
  timestamp?: string
  read?: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  variant?: "primary" | "secondary" | "destructive"
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: "text" | "email" | "password" | "number" | "select" | "checkbox" | "textarea"
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  validation?: ValidationRule[]
}

export interface ValidationRule {
  type: "required" | "email" | "minLength" | "maxLength" | "pattern" | "custom"
  value?: any
  message: string
  validator?: (value: any) => boolean
}

// State Management Types
export interface AppState {
  user: UserState
  training: TrainingState
  network: NetworkState
  ui: UIState
}

export interface UserState {
  profile: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface TrainingState {
  options: TrainingOption[]
  sessions: TrainingSession[]
  history: TrainingHistory[]
  currentSession: TrainingSession | null
  loading: boolean
  error: string | null
}

export interface NetworkState {
  stats: NetworkStats
  contributors: Contributor[]
  logs: SystemLog[]
  loading: boolean
  error: string | null
}

export interface UIState {
  theme: "dark" | "light" | "auto"
  sidebarOpen: boolean
  notifications: Notification[]
  modals: ModalState
  loading: boolean
}

export interface ModalState {
  contribute: boolean
  profile: boolean
  settings: boolean
  training: boolean
}

// Event Types
export interface AppEvent {
  type: string
  payload?: any
  timestamp: string
  source: "user" | "system" | "network"
}

export interface TrainingEvent extends AppEvent {
  type: "training.started" | "training.paused" | "training.completed" | "training.failed"
  sessionId: string
  userId: string
}

export interface NetworkEvent extends AppEvent {
  type: "node.connected" | "node.disconnected" | "network.health.changed"
  nodeId?: string
  health?: number
}

// Utility Types
export type Status = "idle" | "loading" | "success" | "error"
export type Theme = "dark" | "light" | "auto"
export type Difficulty = "Beginner" | "Intermediate" | "Advanced"
export type TrainingStatus = "available" | "training" | "completed" | "coming-soon"
export type ContributorStatus = "ONLINE" | "TRAINING" | "OFFLINE" | "CONNECTING"
export type LogType = "INFO" | "SUCCESS" | "ERROR" | "WARNING"
export type LogCategory = "NETWORK" | "TRAINING" | "SYSTEM" | "USER"
