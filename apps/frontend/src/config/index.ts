// 统一的应用配置文件

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001',
  COTRAIN_CORE_URL: process.env.NEXT_PUBLIC_COTRAIN_CORE_URL || 'http://localhost:8002',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  LONG_TTL: 30 * 60 * 1000, // 30 minutes
  SHORT_TTL: 1 * 60 * 1000, // 1 minute
  NETWORK_STATS_TTL: 30000, // 30 seconds
  CHART_DATA_TTL: 60000, // 1 minute
} as const

// UI Configuration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 150,
} as const

// Training Configuration
export const TRAINING_CONFIG = {
  MIN_PARTICIPANTS: 10,
  MAX_PARTICIPANTS: 1000,
  DEFAULT_DURATION: '30 days',
  PROGRESS_UPDATE_INTERVAL: 5000, // 5 seconds
  STATUS_CHECK_INTERVAL: 10000, // 10 seconds
} as const

// Network Configuration
export const NETWORK_CONFIG = {
  MIN_NODES: 100,
  MAX_NODES: 10000,
  HEALTH_THRESHOLD: 80, // percentage
  UPDATE_INTERVAL: 30000, // 30 seconds
} as const

// Validation Rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_USERNAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_GPU_MEMORY: 4, // GB
  MIN_SYSTEM_MEMORY: 8, // GB
  MIN_BANDWIDTH: 10, // Mbps
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
  TRAINING_ERROR: 'Training operation failed. Please try again later.',
  DATA_FETCH_ERROR: 'Failed to fetch data. Please refresh the page.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  TRAINING_JOINED: 'Successfully joined training session!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  DATA_EXPORTED: 'Data exported successfully!',
} as const

// Routes
export const ROUTES = {
  HOME: '/',
  TRAINING: '/training',
  HISTORY: '/history',
  TERMINAL: '/terminal',
  ABOUT: '/about',
  DOCS: '/docs',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  DASHBOARD: '/dashboard',
  REWARDS: '/rewards',
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'cotrain_user_preferences',
  THEME: 'cotrain_theme',
  LANGUAGE: 'cotrain_language',
  CACHE_PREFIX: 'cotrain_cache_',
  SESSION_DATA: 'cotrain_session',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'user',
  COMPLETED_GUIDES: 'cotrain-completed-guides',
  NOTIFICATION_TOASTS: 'cotrain-notification-toasts',
  SIDEBAR_OPEN: 'cotrain-sidebar-open',
} as const

// Theme Configuration
export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: '#10b981', // green-500
    SECONDARY: '#6366f1', // indigo-500
    SUCCESS: '#22c55e', // green-500
    WARNING: '#f59e0b', // amber-500
    ERROR: '#ef4444', // red-500
    INFO: '#3b82f6', // blue-500
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
} as const

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG: process.env.NODE_ENV === 'development',
  ENABLE_EXPERIMENTAL_FEATURES: process.env.NEXT_PUBLIC_EXPERIMENTAL === 'true',
  ENABLE_PERFORMANCE_MONITORING: process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING === 'true',
} as const

// Hardware Requirements (unified from both files)
export const HARDWARE_REQUIREMENTS = {
  MINIMUM: {
    GPU: 'GTX 1060 6GB',
    MEMORY: '8GB',
    CORES: 4,
    BANDWIDTH: '10 Mbps',
    STORAGE: '100GB',
  },
  RECOMMENDED: {
    GPU: 'RTX 3080 10GB',
    MEMORY: '32GB',
    CORES: 8,
    BANDWIDTH: '100 Mbps',
    STORAGE: '500GB SSD',
  },
  OPTIMAL: {
    GPU: 'H100 80GB',
    MEMORY: '128GB',
    CORES: 16,
    BANDWIDTH: '1 Gbps',
    STORAGE: '2TB NVMe',
  },
} as const

// Reward Tiers
export const REWARD_TIERS = {
  BRONZE: {
    MIN_CONTRIBUTIONS: 0,
    MULTIPLIER: 1.0,
    BADGE_COLOR: '#cd7f32',
  },
  SILVER: {
    MIN_CONTRIBUTIONS: 1000,
    MULTIPLIER: 1.2,
    BADGE_COLOR: '#c0c0c0',
  },
  GOLD: {
    MIN_CONTRIBUTIONS: 5000,
    MULTIPLIER: 1.5,
    BADGE_COLOR: '#ffd700',
  },
  PLATINUM: {
    MIN_CONTRIBUTIONS: 10000,
    MULTIPLIER: 2.0,
    BADGE_COLOR: '#e5e4e2',
  },
} as const

// Social Links
export const SOCIAL_LINKS = {
  github: "https://github.com/cotrain-ai",
  twitter: "https://twitter.com/cotrain_ai",
  discord: "https://discord.gg/cotrain",
  telegram: "https://t.me/cotrain_ai",
  linkedin: "https://linkedin.com/company/cotrain",
  youtube: "https://youtube.com/@cotrain-ai",
} as const

// Navigation Items
export const NAVIGATION_ITEMS = [
  { id: "home", label: "Home", href: "/" },
  { id: "terminal", label: "Terminal", href: "/terminal" },
  { id: "training", label: "Training", href: "/training" },
  { id: "history", label: "History", href: "/history" },
  { id: "docs", label: "Docs", href: "/docs" },
  { id: "community", label: "Community", href: "/community" },
  { id: "about", label: "About", href: "/about" },
] as const

// Footer Links
export const FOOTER_LINKS = {
  Product: [
    { name: "Terminal", href: "/terminal" },
    { name: "Training Hub", href: "/training" },
    { name: "Analytics", href: "/analytics" },
    { name: "API", href: "/api" },
    { name: "Mobile App", href: "/mobile" },
  ],
  Resources: [
    { name: "Documentation", href: "/docs" },
    { name: "Tutorials", href: "/tutorials" },
    { name: "Blog", href: "/blog" },
    { name: "Research Papers", href: "/research" },
    { name: "Whitepaper", href: "/whitepaper" },
  ],
  Community: [
    { name: "Discord Server", href: SOCIAL_LINKS.discord },
    { name: "Forum", href: "/forum" },
    { name: "Contributors", href: "/contributors" },
    { name: "Events", href: "/events" },
    { name: "Newsletter", href: "/newsletter" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Press", href: "/press" },
    { name: "Contact", href: "/contact" },
    { name: "Investors", href: "/investors" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Security", href: "/security" },
  ],
} as const

// Terminal Commands
export const COMMANDS = {
  help: "Show available commands",
  start: "Start distributed training",
  stop: "Stop current training session",
  status: "Show system status",
  nodes: "List all network nodes",
  clear: "Clear terminal output",
  connect: "Connect to network",
  disconnect: "Disconnect from network",
  progress: "Show training progress",
  logs: "Show recent system logs",
  contributors: "Show contributor statistics",
  training: "Open training selection interface",
  history: "View training history",
  home: "Return to home page",
  profile: "View user profile",
  settings: "Open settings",
  rewards: "Check rewards and tokens",
  leaderboard: "View contributor leaderboard",
  network: "Show network topology",
  version: "Show system version",
  exit: "Exit terminal session",
} as const

// System Information
export const SYSTEM_INFO = {
  name: "CoTrain",
  version: "2.1.0",
  description: "Decentralized AI Training Platform",
  author: "CoTrain Team",
  license: "MIT",
  repository: "https://github.com/cotrain-ai/cotrain",
  website: "https://cotrain.ai",
  support: "support@cotrain.ai",
} as const

// Default export for easy access to all configs
export default {
  API_CONFIG,
  CACHE_CONFIG,
  UI_CONFIG,
  TRAINING_CONFIG,
  NETWORK_CONFIG,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  STORAGE_KEYS,
  THEME_CONFIG,
  FEATURE_FLAGS,
  HARDWARE_REQUIREMENTS,
  REWARD_TIERS,
  SOCIAL_LINKS,
  NAVIGATION_ITEMS,
  FOOTER_LINKS,
  COMMANDS,
  SYSTEM_INFO,
}