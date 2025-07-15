import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { handleError } from '../utils/error-handler'

// Theme Types
type ThemeMode = 'light' | 'dark' | 'system'
type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red'

export interface ThemeConfig {
  mode: ThemeMode
  colorScheme: ColorScheme
  fontSize: 'small' | 'medium' | 'large'
  borderRadius: 'none' | 'small' | 'medium' | 'large'
  animations: boolean
  reducedMotion: boolean
}

// Layout Types
export interface LayoutConfig {
  sidebar: {
    collapsed: boolean
    width: number
    position: 'left' | 'right'
    overlay: boolean
  }
  header: {
    visible: boolean
    height: number
    sticky: boolean
  }
  footer: {
    visible: boolean
    height: number
  }
  contentPadding: number
  maxWidth: number | null
}

// Notification Types
type NotificationType = 'info' | 'success' | 'warning' | 'error'
type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
  timestamp: string
  read: boolean
}

interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

interface NotificationConfig {
  position: NotificationPosition
  maxVisible: number
  defaultDuration: number
  enableSound: boolean
  enableDesktop: boolean
}

// Modal Types
export interface Modal {
  id: string
  component: string
  props?: Record<string, any>
  options?: ModalOptions
}

interface ModalOptions {
  closable?: boolean
  backdrop?: boolean
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  position?: 'center' | 'top' | 'bottom'
  animation?: 'fade' | 'slide' | 'zoom'
  persistent?: boolean
}

// Loading Types
interface LoadingState {
  global: boolean
  components: Record<string, boolean>
  operations: Record<string, boolean>
}

// Breadcrumb Types
interface BreadcrumbItem {
  label: string
  href?: string
  icon?: string
  active?: boolean
}

// Search Types
interface SearchState {
  query: string
  results: SearchResult[]
  loading: boolean
  history: string[]
  suggestions: string[]
  filters: Record<string, any>
}

interface SearchResult {
  id: string
  title: string
  description: string
  type: string
  url: string
  metadata?: Record<string, any>
}

// Command Palette Types
export interface Command {
  id: string
  label: string
  description?: string
  icon?: string
  shortcut?: string
  action: () => void
  category?: string
  keywords?: string[]
}

interface CommandPaletteState {
  open: boolean
  query: string
  commands: Command[]
  filteredCommands: Command[]
  selectedIndex: number
}

// UI Store State Interface
interface UIState {
  // Theme & Appearance
  theme: ThemeConfig
  
  // Layout
  layout: LayoutConfig
  sidebarOpen: boolean
  
  // Navigation
  navigation: {
    currentPath: string
    breadcrumbs: BreadcrumbItem[]
    history: string[]
    favorites: string[]
  }
  
  // Notifications
  notifications: {
    items: Notification[]
    config: NotificationConfig
    unreadCount: number
  }
  
  // Modals
  modals: {
    stack: Modal[]
    activeModal: Modal | null
  }
  
  // Loading States
  loading: LoadingState
  
  // Search
  search: SearchState
  
  // Command Palette
  commandPalette: CommandPaletteState
  
  // Responsive
  responsive: {
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    screenWidth: number
    screenHeight: number
  }
  
  // Accessibility
  accessibility: {
    highContrast: boolean
    screenReader: boolean
    keyboardNavigation: boolean
    focusVisible: boolean
  }
  
  // Performance
  performance: {
    enableVirtualization: boolean
    enableLazyLoading: boolean
    enableImageOptimization: boolean
    enableCodeSplitting: boolean
  }
  
  // Developer
  developer: {
    debugMode: boolean
    showPerformanceMetrics: boolean
    showComponentBoundaries: boolean
    enableHotReload: boolean
  }
  
  // Preferences
  preferences: {
    language: string
    timezone: string
    dateFormat: string
    numberFormat: string
    autoSave: boolean
    confirmations: boolean
  }
  
  error: string | null
}

// UI Store Actions Interface
interface UIActions {
  // Theme Management
  setThemeMode: (mode: ThemeMode) => void
  setColorScheme: (scheme: ColorScheme) => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  setBorderRadius: (radius: 'none' | 'small' | 'medium' | 'large') => void
  toggleAnimations: () => void
  toggleReducedMotion: () => void
  resetTheme: () => void
  
  // Layout Management
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarWidth: (width: number) => void
  setSidebarPosition: (position: 'left' | 'right') => void
  toggleHeader: () => void
  toggleFooter: () => void
  setContentPadding: (padding: number) => void
  setMaxWidth: (width: number | null) => void
  
  // Navigation
  setCurrentPath: (path: string) => void
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
  addToHistory: (path: string) => void
  addToFavorites: (path: string) => void
  removeFromFavorites: (path: string) => void
  
  // Notification Management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string
  removeNotification: (id: string) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  clearNotifications: () => void
  updateNotificationConfig: (config: Partial<NotificationConfig>) => void
  
  // Modal Management
  openModal: (component: string, props?: Record<string, any>, options?: ModalOptions) => string
  closeModal: (id?: string) => void
  closeAllModals: () => void
  updateModalProps: (id: string, props: Record<string, any>) => void
  
  // Loading Management
  setGlobalLoading: (loading: boolean) => void
  setComponentLoading: (component: string, loading: boolean) => void
  setOperationLoading: (operation: string, loading: boolean) => void
  clearAllLoading: () => void
  
  // Search Management
  setSearchQuery: (query: string) => void
  setSearchResults: (results: SearchResult[]) => void
  setSearchLoading: (loading: boolean) => void
  addToSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  setSearchFilters: (filters: Record<string, any>) => void
  
  // Command Palette
  toggleCommandPalette: () => void
  setCommandPaletteQuery: (query: string) => void
  setCommandPaletteSelectedIndex: (index: number) => void
  executeCommand: (commandId: string) => void
  registerCommand: (command: Command) => void
  unregisterCommand: (commandId: string) => void
  
  // Responsive
  updateScreenSize: (width: number, height: number) => void
  
  // Accessibility
  toggleHighContrast: () => void
  setScreenReader: (enabled: boolean) => void
  toggleKeyboardNavigation: () => void
  toggleFocusVisible: () => void
  
  // Performance
  toggleVirtualization: () => void
  toggleLazyLoading: () => void
  toggleImageOptimization: () => void
  toggleCodeSplitting: () => void
  
  // Developer
  toggleDebugMode: () => void
  togglePerformanceMetrics: () => void
  toggleComponentBoundaries: () => void
  toggleHotReload: () => void
  
  // Preferences
  setLanguage: (language: string) => void
  setTimezone: (timezone: string) => void
  setDateFormat: (format: string) => void
  setNumberFormat: (format: string) => void
  toggleAutoSave: () => void
  toggleConfirmations: () => void
  
  // Utility Actions
  clearError: () => void
  reset: () => void
}

export type UIStore = UIState & UIActions

// Initial State
const initialState: UIState = {
  theme: {
    mode: 'system',
    colorScheme: 'blue',
    fontSize: 'medium',
    borderRadius: 'medium',
    animations: true,
    reducedMotion: false
  },
  sidebarOpen: true,
  layout: {
    sidebar: {
      collapsed: false,
      width: 280,
      position: 'left',
      overlay: false
    },
    header: {
      visible: true,
      height: 64,
      sticky: true
    },
    footer: {
      visible: true,
      height: 48
    },
    contentPadding: 24,
    maxWidth: null
  },
  navigation: {
    currentPath: '/',
    breadcrumbs: [],
    history: [],
    favorites: []
  },
  notifications: {
    items: [],
    config: {
      position: 'top-right',
      maxVisible: 5,
      defaultDuration: 5000,
      enableSound: true,
      enableDesktop: true
    },
    unreadCount: 0
  },
  modals: {
    stack: [],
    activeModal: null
  },
  loading: {
    global: false,
    components: {},
    operations: {}
  },
  search: {
    query: '',
    results: [],
    loading: false,
    history: [],
    suggestions: [],
    filters: {}
  },
  commandPalette: {
    open: false,
    query: '',
    commands: [],
    filteredCommands: [],
    selectedIndex: 0
  },
  responsive: {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    screenHeight: 1080
  },
  accessibility: {
    highContrast: false,
    screenReader: false,
    keyboardNavigation: true,
    focusVisible: true
  },
  performance: {
    enableVirtualization: true,
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCodeSplitting: true
  },
  developer: {
    debugMode: false,
    showPerformanceMetrics: false,
    showComponentBoundaries: false,
    enableHotReload: true
  },
  preferences: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'en-US',
    autoSave: true,
    confirmations: true
  },
  error: null
}

// Helper Functions
const generateId = () => Math.random().toString(36).substr(2, 9)

const filterCommands = (commands: Command[], query: string): Command[] => {
  if (!query.trim()) return commands
  
  const lowerQuery = query.toLowerCase()
  return commands.filter(command => 
    command.label.toLowerCase().includes(lowerQuery) ||
    command.description?.toLowerCase().includes(lowerQuery) ||
    command.keywords?.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  )
}

// UI Store Implementation
export const useUIStore = create<UIStore>()(devtools(
  immer(
    persist(
        (set, get) => ({
          ...initialState,

          // Theme Management
          setThemeMode: (mode) => {
            set((state) => {
              state.theme.mode = mode
            })
          },

          setColorScheme: (scheme) => {
            set((state) => {
              state.theme.colorScheme = scheme
            })
          },

          setFontSize: (size) => {
            set((state) => {
              state.theme.fontSize = size
            })
          },

          setBorderRadius: (radius) => {
            set((state) => {
              state.theme.borderRadius = radius
            })
          },

          toggleAnimations: () => {
            set((state) => {
              state.theme.animations = !state.theme.animations
            })
          },

          toggleReducedMotion: () => {
            set((state) => {
              state.theme.reducedMotion = !state.theme.reducedMotion
            })
          },

          resetTheme: () => {
            set((state) => {
              state.theme = initialState.theme
            })
          },

          // Layout Management
          toggleSidebar: () => {
            set((state) => {
              state.layout.sidebar.collapsed = !state.layout.sidebar.collapsed
              state.sidebarOpen = !state.layout.sidebar.collapsed
            })
          },

          setSidebarOpen: (open) => {
            set((state) => {
              state.sidebarOpen = open
              state.layout.sidebar.collapsed = !open
            })
          },

          setSidebarCollapsed: (collapsed) => {
            set((state) => {
              state.layout.sidebar.collapsed = collapsed
            })
          },

          setSidebarWidth: (width) => {
            set((state) => {
              state.layout.sidebar.width = Math.max(200, Math.min(400, width))
            })
          },

          setSidebarPosition: (position) => {
            set((state) => {
              state.layout.sidebar.position = position
            })
          },

          toggleHeader: () => {
            set((state) => {
              state.layout.header.visible = !state.layout.header.visible
            })
          },

          toggleFooter: () => {
            set((state) => {
              state.layout.footer.visible = !state.layout.footer.visible
            })
          },

          setContentPadding: (padding) => {
            set((state) => {
              state.layout.contentPadding = Math.max(0, Math.min(48, padding))
            })
          },

          setMaxWidth: (width) => {
            set((state) => {
              state.layout.maxWidth = width
            })
          },

          // Navigation
          setCurrentPath: (path) => {
            set((state) => {
              state.navigation.currentPath = path
            })
          },

          setBreadcrumbs: (breadcrumbs) => {
            set((state) => {
              state.navigation.breadcrumbs = breadcrumbs
            })
          },

          addToHistory: (path) => {
            set((state) => {
              const history = state.navigation.history.filter((p: string) => p !== path)
              history.unshift(path)
              state.navigation.history = history.slice(0, 50) // Keep last 50 items
            })
          },

          addToFavorites: (path) => {
            set((state) => {
              if (!state.navigation.favorites.includes(path)) {
                state.navigation.favorites.push(path)
              }
            })
          },

          removeFromFavorites: (path) => {
            set((state) => {
              state.navigation.favorites = state.navigation.favorites.filter((p: string) => p !== path)
            })
          },

          // Notification Management
          addNotification: (notification) => {
            const id = generateId()
            const newNotification: Notification = {
              ...notification,
              id,
              timestamp: new Date().toISOString(),
              read: false
            }

            set((state) => {
              state.notifications.items.unshift(newNotification)
              state.notifications.unreadCount += 1
              
              // Auto-remove non-persistent notifications
              if (!notification.persistent) {
                const duration = notification.duration || state.notifications.config.defaultDuration
                setTimeout(() => {
                  get().removeNotification(id)
                }, duration)
              }
            })

            return id
          },

          showNotification: (notification) => {
            return get().addNotification(notification)
          },

          removeNotification: (id) => {
            set((state) => {
              const notification = state.notifications.items.find((n: any) => n.id === id)
              if (notification && !notification.read) {
                state.notifications.unreadCount = Math.max(0, state.notifications.unreadCount - 1)
              }
              state.notifications.items = state.notifications.items.filter((n: any) => n.id !== id)
            })
          },

          markNotificationAsRead: (id) => {
            set((state) => {
              const notification = state.notifications.items.find((n: any) => n.id === id)
              if (notification && !notification.read) {
                notification.read = true
                state.notifications.unreadCount = Math.max(0, state.notifications.unreadCount - 1)
              }
            })
          },

          markAllNotificationsAsRead: () => {
            set((state) => {
              state.notifications.items.forEach((notification: any) => {
                notification.read = true
              })
              state.notifications.unreadCount = 0
            })
          },

          clearNotifications: () => {
            set((state) => {
              state.notifications.items = []
              state.notifications.unreadCount = 0
            })
          },

          updateNotificationConfig: (config) => {
            set((state) => {
              Object.assign(state.notifications.config, config)
            })
          },

          // Modal Management
          openModal: (component, props = {}, options = {}) => {
            const id = generateId()
            const modal: Modal = {
              id,
              component,
              props,
              options
            }

            set((state) => {
              state.modals.stack.push(modal)
              state.modals.activeModal = modal
            })

            return id
          },

          closeModal: (id) => {
            set((state) => {
              if (id) {
                state.modals.stack = state.modals.stack.filter((modal: any) => modal.id !== id)
              } else {
                // Close top modal
                state.modals.stack.pop()
              }
              
              // Update active modal
              state.modals.activeModal = state.modals.stack[state.modals.stack.length - 1] || null
            })
          },

          closeAllModals: () => {
            set((state) => {
              state.modals.stack = []
              state.modals.activeModal = null
            })
          },

          updateModalProps: (id, props) => {
            set((state) => {
              const modal = state.modals.stack.find((m: any) => m.id === id)
              if (modal) {
                Object.assign(modal.props || {}, props)
              }
            })
          },

          // Loading Management
          setGlobalLoading: (loading) => {
            set((state) => {
              state.loading.global = loading
            })
          },

          setComponentLoading: (component, loading) => {
            set((state) => {
              if (loading) {
                state.loading.components[component] = true
              } else {
                delete state.loading.components[component]
              }
            })
          },

          setOperationLoading: (operation, loading) => {
            set((state) => {
              if (loading) {
                state.loading.operations[operation] = true
              } else {
                delete state.loading.operations[operation]
              }
            })
          },

          clearAllLoading: () => {
            set((state) => {
              state.loading.global = false
              state.loading.components = {}
              state.loading.operations = {}
            })
          },

          // Search Management
          setSearchQuery: (query) => {
            set((state) => {
              state.search.query = query
            })
          },

          setSearchResults: (results) => {
            set((state) => {
              state.search.results = results
            })
          },

          setSearchLoading: (loading) => {
            set((state) => {
              state.search.loading = loading
            })
          },

          addToSearchHistory: (query) => {
            if (!query.trim()) return
            
            set((state) => {
              const history = state.search.history.filter((q: string) => q !== query)
              history.unshift(query)
              state.search.history = history.slice(0, 20) // Keep last 20 searches
            })
          },

          clearSearchHistory: () => {
            set((state) => {
              state.search.history = []
            })
          },

          setSearchFilters: (filters) => {
            set((state) => {
              state.search.filters = filters
            })
          },

          // Command Palette
          toggleCommandPalette: () => {
            set((state) => {
              state.commandPalette.open = !state.commandPalette.open
              if (!state.commandPalette.open) {
                state.commandPalette.query = ''
                state.commandPalette.selectedIndex = 0
              }
            })
          },

          setCommandPaletteQuery: (query) => {
            set((state) => {
              state.commandPalette.query = query
              state.commandPalette.filteredCommands = filterCommands(state.commandPalette.commands, query)
              state.commandPalette.selectedIndex = 0
            })
          },

          setCommandPaletteSelectedIndex: (index) => {
            set((state) => {
              const maxIndex = state.commandPalette.filteredCommands.length - 1
              state.commandPalette.selectedIndex = Math.max(0, Math.min(maxIndex, index))
            })
          },

          executeCommand: (commandId) => {
            const command = get().commandPalette.commands.find(c => c.id === commandId)
            if (command) {
              try {
                command.action()
                get().toggleCommandPalette() // Close palette after execution
              } catch (error) {
                const handledError = handleError(error)
                get().addNotification({
                  type: 'error',
                  title: 'Command Error',
                  message: handledError.message
                })
              }
            }
          },

          registerCommand: (command) => {
            set((state) => {
              // Remove existing command with same id
              state.commandPalette.commands = state.commandPalette.commands.filter((c: any) => c.id !== command.id)
              state.commandPalette.commands.push(command)
              
              // Update filtered commands if palette is open
              if (state.commandPalette.open) {
                state.commandPalette.filteredCommands = filterCommands(
                  state.commandPalette.commands,
                  state.commandPalette.query
                )
              }
            })
          },

          unregisterCommand: (commandId) => {
            set((state) => {
              state.commandPalette.commands = state.commandPalette.commands.filter((c: any) => c.id !== commandId)
              
              // Update filtered commands if palette is open
              if (state.commandPalette.open) {
                state.commandPalette.filteredCommands = filterCommands(
                  state.commandPalette.commands,
                  state.commandPalette.query
                )
              }
            })
          },

          // Responsive
          updateScreenSize: (width, height) => {
            set((state) => {
              state.responsive.screenWidth = width
              state.responsive.screenHeight = height
              state.responsive.isMobile = width < 768
              state.responsive.isTablet = width >= 768 && width < 1024
              state.responsive.isDesktop = width >= 1024
              
              // Auto-collapse sidebar on mobile
              if (state.responsive.isMobile && !state.layout.sidebar.collapsed) {
                state.layout.sidebar.overlay = true
              } else if (!state.responsive.isMobile) {
                state.layout.sidebar.overlay = false
              }
            })
          },

          // Accessibility
          toggleHighContrast: () => {
            set((state) => {
              state.accessibility.highContrast = !state.accessibility.highContrast
            })
          },

          setScreenReader: (enabled) => {
            set((state) => {
              state.accessibility.screenReader = enabled
            })
          },

          toggleKeyboardNavigation: () => {
            set((state) => {
              state.accessibility.keyboardNavigation = !state.accessibility.keyboardNavigation
            })
          },

          toggleFocusVisible: () => {
            set((state) => {
              state.accessibility.focusVisible = !state.accessibility.focusVisible
            })
          },

          // Performance
          toggleVirtualization: () => {
            set((state) => {
              state.performance.enableVirtualization = !state.performance.enableVirtualization
            })
          },

          toggleLazyLoading: () => {
            set((state) => {
              state.performance.enableLazyLoading = !state.performance.enableLazyLoading
            })
          },

          toggleImageOptimization: () => {
            set((state) => {
              state.performance.enableImageOptimization = !state.performance.enableImageOptimization
            })
          },

          toggleCodeSplitting: () => {
            set((state) => {
              state.performance.enableCodeSplitting = !state.performance.enableCodeSplitting
            })
          },

          // Developer
          toggleDebugMode: () => {
            set((state) => {
              state.developer.debugMode = !state.developer.debugMode
            })
          },

          togglePerformanceMetrics: () => {
            set((state) => {
              state.developer.showPerformanceMetrics = !state.developer.showPerformanceMetrics
            })
          },

          toggleComponentBoundaries: () => {
            set((state) => {
              state.developer.showComponentBoundaries = !state.developer.showComponentBoundaries
            })
          },

          toggleHotReload: () => {
            set((state) => {
              state.developer.enableHotReload = !state.developer.enableHotReload
            })
          },

          // Preferences
          setLanguage: (language) => {
            set((state) => {
              state.preferences.language = language
            })
          },

          setTimezone: (timezone) => {
            set((state) => {
              state.preferences.timezone = timezone
            })
          },

          setDateFormat: (format) => {
            set((state) => {
              state.preferences.dateFormat = format
            })
          },

          setNumberFormat: (format) => {
            set((state) => {
              state.preferences.numberFormat = format
            })
          },

          toggleAutoSave: () => {
            set((state) => {
              state.preferences.autoSave = !state.preferences.autoSave
            })
          },

          toggleConfirmations: () => {
            set((state) => {
              state.preferences.confirmations = !state.preferences.confirmations
            })
          },

          // Utility Actions
          clearError: () => {
            set((state) => {
              state.error = null
            })
          },

          reset: () => {
            set((state) => {
              Object.assign(state, initialState)
            })
          }
        }),
        {
          name: 'ui-store',
          partialize: (state: UIStore) => ({
            theme: state.theme,
            layout: {
              sidebar: {
                collapsed: state.layout.sidebar.collapsed,
                width: state.layout.sidebar.width,
                position: state.layout.sidebar.position
              },
              header: state.layout.header,
              footer: state.layout.footer,
              contentPadding: state.layout.contentPadding,
              maxWidth: state.layout.maxWidth
            },
            navigation: {
              favorites: state.navigation.favorites,
              history: state.navigation.history
            },
            notifications: {
              config: state.notifications.config
            },
            search: {
              history: state.search.history
            },
            accessibility: state.accessibility,
            performance: state.performance,
            developer: state.developer,
            preferences: state.preferences
          })
        }
      )
    ),
    { name: 'UIStore' }
  ));

// Selectors for optimized re-renders
export const useTheme = () => useUIStore(state => state.theme)
export const useLayout = () => useUIStore(state => state.layout)
export const useNavigation = () => useUIStore(state => state.navigation)
export const useNotifications = () => useUIStore(state => state.notifications)
export const useModals = () => useUIStore(state => state.modals)
export const useLoading = () => useUIStore(state => state.loading)
export const useSearch = () => useUIStore(state => state.search)
export const useCommandPalette = () => useUIStore(state => state.commandPalette)
export const useResponsive = () => useUIStore(state => state.responsive)
export const useAccessibility = () => useUIStore(state => state.accessibility)
export const usePerformance = () => useUIStore(state => state.performance)
export const useDeveloper = () => useUIStore(state => state.developer)
export const usePreferences = () => useUIStore(state => state.preferences)

// Compound selectors
export const useIsMobile = () => useUIStore(state => state.responsive.isMobile)
export const useIsTablet = () => useUIStore(state => state.responsive.isTablet)
export const useIsDesktop = () => useUIStore(state => state.responsive.isDesktop)
export const useUnreadNotifications = () => useUIStore(state => state.notifications.unreadCount)
export const useActiveModal = () => useUIStore(state => state.modals.activeModal)
export const useIsLoading = () => useUIStore(state => 
  state.loading.global || 
  Object.keys(state.loading.components).length > 0 || 
  Object.keys(state.loading.operations).length > 0
)