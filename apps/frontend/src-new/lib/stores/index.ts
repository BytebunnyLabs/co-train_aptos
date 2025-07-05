// Export all stores
export { useAuthStore, type AuthStore, type User } from './auth-store';
export { useTrainingStore, type TrainingStore, type TrainingOption, type TrainingSession, type TrainingHistory, type TrainingMetrics } from './training-store';
export { useHivemindStore, type HivemindStore, type NetworkNode, type NetworkStats, type SystemLog, type NetworkEvent, type P2PConnection } from './hivemind-store';
export { useRewardsStore, type RewardsStore, type TokenBalance, type NFTReward, type RewardTransaction, type StakingPool, type ClaimableReward } from './rewards-store';
export { useUIStore, type UIStore, type Notification, type Modal, type ConfirmDialog, type Breadcrumb } from './ui-store';
export { useWalletStore, type WalletStore, type WalletInfo, type AccountInfo, type NetworkInfo, type WalletTransaction } from './wallet-store';

// Store initialization hook
export const useStoreInitialization = () => {
  const checkWalletInstallation = useWalletStore(state => state.checkWalletInstallation);
  const reconnectWallet = useWalletStore(state => state.reconnect);
  const setOnlineStatus = useUIStore(state => state.setOnlineStatus);
  
  // Initialize stores on app startup
  const initialize = async () => {
    // Check wallet installation status
    checkWalletInstallation();
    
    // Attempt to reconnect wallet if auto-connect is enabled
    try {
      await reconnectWallet();
    } catch (error) {
      console.warn('Failed to auto-reconnect wallet:', error);
    }
    
    // Set up online/offline detection
    const updateOnlineStatus = () => {
      setOnlineStatus(navigator.onLine);
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial status
    updateOnlineStatus();
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  };
  
  return { initialize };
};

// Global store reset function
export const resetAllStores = () => {
  useAuthStore.getState().reset();
  useTrainingStore.getState().reset();
  useHivemindStore.getState().reset();
  useRewardsStore.getState().reset();
  useUIStore.getState().reset();
  useWalletStore.getState().reset();
};

// Store selectors for common use cases
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore(state => state.user);
export const useWalletConnected = () => useWalletStore(state => state.isConnected);
export const useWalletAddress = () => useWalletStore(state => state.account?.address);
export const useTheme = () => useUIStore(state => state.theme);
export const useNotifications = () => useUIStore(state => state.notifications);
export const useUnreadCount = () => useUIStore(state => state.unreadCount);
export const useNetworkStatus = () => useUIStore(state => ({ isOnline: state.isOnline, quality: state.connectionQuality }));
export const useTrainingStatus = () => useTrainingStore(state => ({ isTraining: state.isTraining, currentSession: state.currentSession }));
export const useHivemindConnection = () => useHivemindStore(state => ({ isConnected: state.isConnected, nodeId: state.nodeId }));
export const useTotalRewards = () => useRewardsStore(state => ({ totalUsd: state.totalUsdValue, claimableUsd: state.totalClaimableUsd }));