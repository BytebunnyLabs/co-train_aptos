'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useWebSocket } from '@/hooks/useWebSocket';
// import { useUserGuide, UserGuide } from '@/components/cotrain/ui/user-guide';
// import UserGuideComponent from '@/components/cotrain/ui/user-guide';
import { useToast } from '@/components/cotrain/ui/use-toast';

interface AppState {
  isInitialized: boolean;
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  debugMode: boolean;
}

interface AppContextType {
  // App state
  appState: AppState;
  setAppState: (state: Partial<AppState>) => void;
  
  // WebSocket
  wsConnected: boolean;
  wsError: string | null;
  
  // User guide
  // activeGuide: UserGuide | null;
  // startGuide: (guide: UserGuide) => void;
  // closeGuide: () => void;
  // isGuideCompleted: (guideId: string) => boolean;
  
  // Notifications
  showNotificationToasts: boolean;
  setShowNotificationToasts: (show: boolean) => void;
  
  // Utilities
  refreshData: () => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { connected: walletConnected, account } = useWallet();
  const { 
    connected: wsConnected, 
    error: wsError, 
    notifications,
    connect: connectWS,
    disconnect: disconnectWS 
  } = useWebSocket();
  // const { 
  //   activeGuide, 
  //   startGuide, 
  //   closeGuide, 
  //   completeGuide, 
  //   isGuideCompleted 
  // } = useUserGuide();
  const { toast } = useToast();

  const [appState, setAppStateInternal] = useState<AppState>({
    isInitialized: false,
    theme: 'system',
    sidebarOpen: false,
    debugMode: typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  });

  const [showNotificationToasts, setShowNotificationToasts] = useState(true);
  const [notificationQueue, setNotificationQueue] = useState<typeof notifications>([]);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        // Load saved preferences
        const savedTheme = localStorage.getItem('cotrain-theme') as AppState['theme'];
        const savedSidebar = localStorage.getItem('cotrain-sidebar-open') === 'true';
        const savedNotifications = localStorage.getItem('cotrain-notification-toasts') !== 'false';

        setAppStateInternal(prev => ({
          ...prev,
          theme: savedTheme || 'system',
          sidebarOpen: savedSidebar,
          isInitialized: true,
        }));

        setShowNotificationToasts(savedNotifications);

        // Apply theme
        applyTheme(savedTheme || 'system');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  // Auto-connect WebSocket when wallet connects
  useEffect(() => {
    if (walletConnected && account && !wsConnected) {
      connectWS();
    } else if (!walletConnected && wsConnected) {
      disconnectWS();
    }
  }, [walletConnected, account, wsConnected, connectWS, disconnectWS]);

  // Handle new notifications for toasts
  useEffect(() => {
    if (notifications.length > notificationQueue.length && showNotificationToasts) {
      const newNotifications = notifications.slice(0, notifications.length - notificationQueue.length);
      newNotifications.forEach(notification => {
        // Show toast for new notifications
        if (Date.now() - new Date(notification.timestamp).getTime() < 2000) {
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default',
          });
        }
      });
    }
    setNotificationQueue(notifications);
  }, [notifications, notificationQueue.length, showNotificationToasts, toast]);

  const setAppState = (newState: Partial<AppState>) => {
    setAppStateInternal(prev => {
      const updated = { ...prev, ...newState };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        if (newState.theme) {
          localStorage.setItem('cotrain-theme', newState.theme);
          applyTheme(newState.theme);
        }
        if (newState.sidebarOpen !== undefined) {
          localStorage.setItem('cotrain-sidebar-open', newState.sidebarOpen.toString());
        }
      }
      
      return updated;
    });
  };

  const applyTheme = (theme: AppState['theme']) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const refreshData = () => {
    // Trigger refresh of all data
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const toggleSidebar = () => {
    setAppState({ sidebarOpen: !appState.sidebarOpen });
  };

  const toggleTheme = () => {
    const themes: AppState['theme'][] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(appState.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setAppState({ theme: nextTheme });
  };

  // const handleCompleteGuide = (guide: UserGuide) => {
  //   completeGuide(guide);
  //   
  //   // Show completion toast
  //   toast({
  //     title: "Guide Completed",
  //     description: `You've completed the ${guide.title} guide!`,
  //   });
  // };

  const handleNotificationToastSettings = (show: boolean) => {
    setShowNotificationToasts(show);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cotrain-notification-toasts', show.toString());
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    if (appState.theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [appState.theme]);

  const contextValue: AppContextType = {
    // App state
    appState,
    setAppState,
    
    // WebSocket
    wsConnected,
    wsError,
    
    // User guide
    // activeGuide,
    // startGuide,
    // closeGuide,
    // isGuideCompleted,
    
    // Notifications
    showNotificationToasts,
    setShowNotificationToasts: handleNotificationToastSettings,
    
    // Utilities
    refreshData,
    toggleSidebar,
    toggleTheme,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
      
      {/* User Guide Modal */}
      {/* {activeGuide && (
        <UserGuideComponent
          guide={activeGuide}
          isOpen={!!activeGuide}
          onClose={closeGuide}
          onComplete={() => handleCompleteGuide(activeGuide)}
        />
      )} */}
      
      {/* Debug Panel */}
      {appState.debugMode && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-2 rounded text-xs z-50">
          <div>WebSocket: {wsConnected ? '🟢' : '🔴'}</div>
          <div>Wallet: {walletConnected ? '🟢' : '🔴'}</div>
          <div>Theme: {appState.theme}</div>
          <div>Notifications: {notifications.length}</div>
        </div>
      )}
    </AppContext.Provider>
  );
};