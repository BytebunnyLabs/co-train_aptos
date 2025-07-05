import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'destructive';
  }>;
}

export interface Modal {
  id: string;
  component: string;
  props?: Record<string, any>;
  isOpen: boolean;
  onClose?: () => void;
}

export interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface Breadcrumb {
  label: string;
  href?: string;
  icon?: string;
}

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'cotrain' | 'system';
  
  // Layout
  sidebarCollapsed: boolean;
  sidebarOpen: boolean; // For mobile
  headerHeight: number;
  footerHeight: number;
  
  // Navigation
  currentPage: string;
  breadcrumbs: Breadcrumb[];
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Modals
  modals: Modal[];
  
  // Dialogs
  confirmDialog: ConfirmDialog;
  
  // Loading States
  globalLoading: boolean;
  loadingMessages: string[];
  
  // Search
  searchOpen: boolean;
  searchQuery: string;
  
  // Settings
  animations: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
  highContrast: boolean;
  
  // Connection Status
  isOnline: boolean;
  connectionQuality: 'good' | 'poor' | 'offline';
  
  // User Preferences
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  
  // Page State
  pageTitle: string;
  pageDescription: string;
  showBackButton: boolean;
}

interface UIActions {
  // Theme
  setTheme: (theme: UIState['theme']) => void;
  toggleTheme: () => void;
  
  // Layout
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setHeaderHeight: (height: number) => void;
  setFooterHeight: (height: number) => void;
  
  // Navigation
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  addBreadcrumb: (breadcrumb: Breadcrumb) => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  
  // Modals
  openModal: (modal: Omit<Modal, 'isOpen'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Dialogs
  showConfirmDialog: (dialog: Omit<ConfirmDialog, 'isOpen'>) => void;
  hideConfirmDialog: () => void;
  
  // Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  addLoadingMessage: (message: string) => void;
  removeLoadingMessage: (message: string) => void;
  
  // Search
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  
  // Settings
  setAnimations: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  
  // Connection
  setOnlineStatus: (online: boolean) => void;
  setConnectionQuality: (quality: UIState['connectionQuality']) => void;
  
  // User Preferences
  setLanguage: (language: string) => void;
  setTimezone: (timezone: string) => void;
  setDateFormat: (format: string) => void;
  setNumberFormat: (format: string) => void;
  
  // Page State
  setPageTitle: (title: string) => void;
  setPageDescription: (description: string) => void;
  setShowBackButton: (show: boolean) => void;
  
  // Utilities
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  
  // Reset
  reset: () => void;
}

export type UIStore = UIState & UIActions;

const initialConfirmDialog: ConfirmDialog = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default',
};

const initialState: UIState = {
  theme: 'system',
  sidebarCollapsed: false,
  sidebarOpen: false,
  headerHeight: 64,
  footerHeight: 60,
  currentPage: '',
  breadcrumbs: [],
  notifications: [],
  unreadCount: 0,
  modals: [],
  confirmDialog: initialConfirmDialog,
  globalLoading: false,
  loadingMessages: [],
  searchOpen: false,
  searchQuery: '',
  animations: true,
  soundEnabled: true,
  compactMode: false,
  highContrast: false,
  isOnline: true,
  connectionQuality: 'good',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/dd/yyyy',
  numberFormat: 'en-US',
  pageTitle: '',
  pageDescription: '',
  showBackButton: false,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Theme
      setTheme: (theme) => set({ theme }),
      
      toggleTheme: () => {
        const currentTheme = get().theme;
        const nextTheme = currentTheme === 'light' ? 'dark' : 
                         currentTheme === 'dark' ? 'cotrain' : 'light';
        set({ theme: nextTheme });
      },

      // Layout
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setHeaderHeight: (height) => set({ headerHeight: height }),
      setFooterHeight: (height) => set({ footerHeight: height }),

      // Navigation
      setCurrentPage: (page) => set({ currentPage: page }),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      
      addBreadcrumb: (breadcrumb) => {
        const breadcrumbs = [...get().breadcrumbs, breadcrumb];
        set({ breadcrumbs });
      },

      // Notifications
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification_${Date.now()}_${Math.random()}`,
          timestamp: new Date().toISOString(),
          read: false,
        };

        const notifications = [newNotification, ...get().notifications];
        const unreadCount = notifications.filter(n => !n.read).length;
        
        set({ notifications, unreadCount });

        // Auto-remove notification after duration
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, notification.duration);
        }
      },

      removeNotification: (id) => {
        const notifications = get().notifications.filter(n => n.id !== id);
        const unreadCount = notifications.filter(n => !n.read).length;
        set({ notifications, unreadCount });
      },

      markNotificationRead: (id) => {
        const notifications = get().notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        const unreadCount = notifications.filter(n => !n.read).length;
        set({ notifications, unreadCount });
      },

      markAllNotificationsRead: () => {
        const notifications = get().notifications.map(n => ({ ...n, read: true }));
        set({ notifications, unreadCount: 0 });
      },

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      // Modals
      openModal: (modal) => {
        const modals = [...get().modals, { ...modal, isOpen: true }];
        set({ modals });
      },

      closeModal: (id) => {
        const modals = get().modals.filter(m => m.id !== id);
        set({ modals });
      },

      closeAllModals: () => set({ modals: [] }),

      // Dialogs
      showConfirmDialog: (dialog) => {
        set({ confirmDialog: { ...dialog, isOpen: true } });
      },

      hideConfirmDialog: () => {
        set({ confirmDialog: initialConfirmDialog });
      },

      // Loading
      setGlobalLoading: (loading, message) => {
        if (loading && message) {
          get().addLoadingMessage(message);
        }
        set({ globalLoading: loading });
      },

      addLoadingMessage: (message) => {
        const loadingMessages = [...get().loadingMessages, message];
        set({ loadingMessages });
      },

      removeLoadingMessage: (message) => {
        const loadingMessages = get().loadingMessages.filter(m => m !== message);
        set({ loadingMessages });
      },

      // Search
      setSearchOpen: (open) => set({ searchOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Settings
      setAnimations: (enabled) => set({ animations: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setCompactMode: (compact) => set({ compactMode: compact }),
      setHighContrast: (enabled) => set({ highContrast: enabled }),

      // Connection
      setOnlineStatus: (online) => set({ isOnline: online }),
      setConnectionQuality: (quality) => set({ connectionQuality: quality }),

      // User Preferences
      setLanguage: (language) => set({ language }),
      setTimezone: (timezone) => set({ timezone }),
      setDateFormat: (format) => set({ dateFormat: format }),
      setNumberFormat: (format) => set({ numberFormat: format }),

      // Page State
      setPageTitle: (title) => set({ pageTitle: title }),
      setPageDescription: (description) => set({ pageDescription: description }),
      setShowBackButton: (show) => set({ showBackButton: show }),

      // Utilities
      showSuccess: (message, title = 'Success') => {
        get().addNotification({
          type: 'success',
          title,
          message,
          duration: 5000,
        });
      },

      showError: (message, title = 'Error') => {
        get().addNotification({
          type: 'error',
          title,
          message,
          duration: 8000,
        });
      },

      showWarning: (message, title = 'Warning') => {
        get().addNotification({
          type: 'warning',
          title,
          message,
          duration: 6000,
        });
      },

      showInfo: (message, title = 'Info') => {
        get().addNotification({
          type: 'info',
          title,
          message,
          duration: 5000,
        });
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        animations: state.animations,
        soundEnabled: state.soundEnabled,
        compactMode: state.compactMode,
        highContrast: state.highContrast,
        language: state.language,
        timezone: state.timezone,
        dateFormat: state.dateFormat,
        numberFormat: state.numberFormat,
      }),
    },
  ),
);