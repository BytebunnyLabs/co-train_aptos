import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TokenBalance {
  symbol: string;
  amount: number;
  decimals: number;
  usdValue?: number;
  contractAddress?: string;
}

export interface NFTReward {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedDate: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  tokenId?: string;
  contractAddress?: string;
}

export interface RewardTransaction {
  id: string;
  type: 'earned' | 'claimed' | 'staked' | 'transferred';
  amount: number;
  symbol: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  blockHeight?: number;
  gasUsed?: number;
  description: string;
  source?: 'training' | 'contribution' | 'bonus' | 'referral';
}

export interface StakingPool {
  id: string;
  name: string;
  symbol: string;
  apr: number;
  totalStaked: number;
  myStaked: number;
  pendingRewards: number;
  lockPeriod: number; // days
  description: string;
  isActive: boolean;
}

export interface ClaimableReward {
  id: string;
  type: 'token' | 'nft';
  amount?: number;
  symbol?: string;
  nft?: {
    name: string;
    image: string;
    rarity: string;
  };
  earnedFrom: string;
  earnedDate: string;
  claimableDate: string;
  isClaimable: boolean;
}

interface RewardsState {
  // Balances
  tokenBalances: TokenBalance[];
  totalUsdValue: number;
  nftRewards: NFTReward[];
  
  // Claimable Rewards
  claimableRewards: ClaimableReward[];
  totalClaimableUsd: number;
  
  // Transactions
  transactions: RewardTransaction[];
  pendingTransactions: RewardTransaction[];
  
  // Staking
  stakingPools: StakingPool[];
  totalStaked: number;
  totalPendingRewards: number;
  
  // Wallet Connection
  isWalletConnected: boolean;
  walletAddress: string | null;
  walletType: string | null;
  
  // Loading States
  balancesLoading: boolean;
  claimingReward: boolean;
  stakingLoading: boolean;
  transactionsLoading: boolean;
  
  // Error State
  error: string | null;
  
  // Statistics
  stats: {
    totalEarned: number;
    totalClaimed: number;
    totalStaked: number;
    nftCount: number;
    rank: number;
    streak: number;
  };
}

interface RewardsActions {
  // Wallet Management
  connectWallet: (walletType: string) => Promise<void>;
  disconnectWallet: () => void;
  setWalletInfo: (address: string, type: string) => void;
  
  // Balance Management
  setTokenBalances: (balances: TokenBalance[]) => void;
  updateTokenBalance: (symbol: string, amount: number) => void;
  setNftRewards: (nfts: NFTReward[]) => void;
  addNftReward: (nft: NFTReward) => void;
  calculateTotalUsdValue: () => void;
  
  // Claimable Rewards
  setClaimableRewards: (rewards: ClaimableReward[]) => void;
  claimReward: (rewardId: string) => Promise<void>;
  claimAllRewards: () => Promise<void>;
  removeClaimableReward: (rewardId: string) => void;
  
  // Transactions
  setTransactions: (transactions: RewardTransaction[]) => void;
  addTransaction: (transaction: RewardTransaction) => void;
  updateTransactionStatus: (txId: string, status: 'pending' | 'confirmed' | 'failed', txHash?: string) => void;
  
  // Staking
  setStakingPools: (pools: StakingPool[]) => void;
  stakeTokens: (poolId: string, amount: number) => Promise<void>;
  unstakeTokens: (poolId: string, amount: number) => Promise<void>;
  claimStakingRewards: (poolId: string) => Promise<void>;
  updateStakingPool: (poolId: string, updates: Partial<StakingPool>) => void;
  
  // Loading States
  setBalancesLoading: (loading: boolean) => void;
  setClaimingReward: (claiming: boolean) => void;
  setStakingLoading: (loading: boolean) => void;
  setTransactionsLoading: (loading: boolean) => void;
  
  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Statistics
  updateStats: (stats: Partial<RewardsState['stats']>) => void;
  calculateStats: () => void;
  
  // Actions
  refreshBalances: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Reset
  reset: () => void;
}

export type RewardsStore = RewardsState & RewardsActions;

const initialStats = {
  totalEarned: 0,
  totalClaimed: 0,
  totalStaked: 0,
  nftCount: 0,
  rank: 0,
  streak: 0,
};

const initialState: RewardsState = {
  tokenBalances: [],
  totalUsdValue: 0,
  nftRewards: [],
  claimableRewards: [],
  totalClaimableUsd: 0,
  transactions: [],
  pendingTransactions: [],
  stakingPools: [],
  totalStaked: 0,
  totalPendingRewards: 0,
  isWalletConnected: false,
  walletAddress: null,
  walletType: null,
  balancesLoading: false,
  claimingReward: false,
  stakingLoading: false,
  transactionsLoading: false,
  error: null,
  stats: initialStats,
};

export const useRewardsStore = create<RewardsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Wallet Management
      connectWallet: async (walletType) => {
        try {
          set({ error: null });
          
          // TODO: Integrate with Aptos wallet adapter
          // This would connect to the specified wallet
          
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate connection
          
          const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
          
          set({
            isWalletConnected: true,
            walletAddress: mockAddress,
            walletType,
          });

          // Refresh balances after connection
          get().refreshBalances();

        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to connect wallet' });
        }
      },

      disconnectWallet: () => {
        set({
          isWalletConnected: false,
          walletAddress: null,
          walletType: null,
          tokenBalances: [],
          nftRewards: [],
          claimableRewards: [],
        });
      },

      setWalletInfo: (address, type) => {
        set({
          isWalletConnected: true,
          walletAddress: address,
          walletType: type,
        });
      },

      // Balance Management
      setTokenBalances: (balances) => {
        set({ tokenBalances: balances });
        get().calculateTotalUsdValue();
      },

      updateTokenBalance: (symbol, amount) => {
        const balances = get().tokenBalances.map(balance =>
          balance.symbol === symbol ? { ...balance, amount } : balance
        );
        set({ tokenBalances: balances });
        get().calculateTotalUsdValue();
      },

      setNftRewards: (nfts) => set({ nftRewards: nfts }),
      
      addNftReward: (nft) => {
        const nfts = [nft, ...get().nftRewards];
        set({ nftRewards: nfts });
      },

      calculateTotalUsdValue: () => {
        const totalUsdValue = get().tokenBalances.reduce(
          (total, balance) => total + (balance.usdValue || 0),
          0
        );
        set({ totalUsdValue });
      },

      // Claimable Rewards
      setClaimableRewards: (rewards) => {
        set({ claimableRewards: rewards });
        const totalClaimableUsd = rewards.reduce((total, reward) => {
          if (reward.type === 'token' && reward.amount) {
            // TODO: Convert to USD based on token price
            return total + reward.amount * 0.1; // Mock conversion
          }
          return total;
        }, 0);
        set({ totalClaimableUsd });
      },

      claimReward: async (rewardId) => {
        try {
          set({ claimingReward: true, error: null });
          
          const reward = get().claimableRewards.find(r => r.id === rewardId);
          if (!reward) throw new Error('Reward not found');

          // TODO: Integrate with blockchain
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate claiming
          
          // Create transaction record
          const transaction: RewardTransaction = {
            id: `tx_${Date.now()}`,
            type: 'claimed',
            amount: reward.amount || 0,
            symbol: reward.symbol || 'NFT',
            timestamp: new Date().toISOString(),
            status: 'confirmed',
            description: `Claimed ${reward.type} reward from ${reward.earnedFrom}`,
            source: 'training',
          };

          get().addTransaction(transaction);
          get().removeClaimableReward(rewardId);

          // Update balance if it's a token
          if (reward.type === 'token' && reward.amount && reward.symbol) {
            const currentBalance = get().tokenBalances.find(b => b.symbol === reward.symbol);
            if (currentBalance) {
              get().updateTokenBalance(reward.symbol, currentBalance.amount + reward.amount);
            } else {
              const newBalance: TokenBalance = {
                symbol: reward.symbol,
                amount: reward.amount,
                decimals: 8,
                usdValue: reward.amount * 0.1, // Mock USD value
              };
              set({ tokenBalances: [...get().tokenBalances, newBalance] });
            }
          }

          set({ claimingReward: false });

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to claim reward',
            claimingReward: false 
          });
        }
      },

      claimAllRewards: async () => {
        const claimableRewards = get().claimableRewards.filter(r => r.isClaimable);
        
        for (const reward of claimableRewards) {
          await get().claimReward(reward.id);
        }
      },

      removeClaimableReward: (rewardId) => {
        const rewards = get().claimableRewards.filter(r => r.id !== rewardId);
        set({ claimableRewards: rewards });
      },

      // Transactions
      setTransactions: (transactions) => set({ transactions }),
      
      addTransaction: (transaction) => {
        const transactions = [transaction, ...get().transactions];
        set({ transactions });
      },

      updateTransactionStatus: (txId, status, txHash) => {
        const transactions = get().transactions.map(tx =>
          tx.id === txId ? { ...tx, status, txHash } : tx
        );
        set({ transactions });
      },

      // Staking
      setStakingPools: (pools) => {
        set({ stakingPools: pools });
        const totalStaked = pools.reduce((total, pool) => total + pool.myStaked, 0);
        const totalPendingRewards = pools.reduce((total, pool) => total + pool.pendingRewards, 0);
        set({ totalStaked, totalPendingRewards });
      },

      stakeTokens: async (poolId, amount) => {
        try {
          set({ stakingLoading: true, error: null });
          
          // TODO: Integrate with staking contract
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const pools = get().stakingPools.map(pool =>
            pool.id === poolId 
              ? { ...pool, myStaked: pool.myStaked + amount, totalStaked: pool.totalStaked + amount }
              : pool
          );
          
          set({ stakingPools: pools, stakingLoading: false });

          const transaction: RewardTransaction = {
            id: `tx_${Date.now()}`,
            type: 'staked',
            amount,
            symbol: 'COTRAIN',
            timestamp: new Date().toISOString(),
            status: 'confirmed',
            description: `Staked ${amount} tokens in ${pools.find(p => p.id === poolId)?.name}`,
          };

          get().addTransaction(transaction);

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to stake tokens',
            stakingLoading: false 
          });
        }
      },

      unstakeTokens: async (poolId, amount) => {
        try {
          set({ stakingLoading: true, error: null });
          
          // TODO: Integrate with staking contract
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const pools = get().stakingPools.map(pool =>
            pool.id === poolId 
              ? { ...pool, myStaked: Math.max(0, pool.myStaked - amount), totalStaked: Math.max(0, pool.totalStaked - amount) }
              : pool
          );
          
          set({ stakingPools: pools, stakingLoading: false });

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to unstake tokens',
            stakingLoading: false 
          });
        }
      },

      claimStakingRewards: async (poolId) => {
        try {
          set({ stakingLoading: true, error: null });
          
          const pool = get().stakingPools.find(p => p.id === poolId);
          if (!pool || pool.pendingRewards === 0) return;

          // TODO: Integrate with staking contract
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const pools = get().stakingPools.map(p =>
            p.id === poolId ? { ...p, pendingRewards: 0 } : p
          );
          
          set({ stakingPools: pools, stakingLoading: false });

          // Update token balance
          get().updateTokenBalance(pool.symbol, 
            (get().tokenBalances.find(b => b.symbol === pool.symbol)?.amount || 0) + pool.pendingRewards
          );

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to claim staking rewards',
            stakingLoading: false 
          });
        }
      },

      updateStakingPool: (poolId, updates) => {
        const pools = get().stakingPools.map(pool =>
          pool.id === poolId ? { ...pool, ...updates } : pool
        );
        set({ stakingPools: pools });
      },

      // Loading States
      setBalancesLoading: (loading) => set({ balancesLoading: loading }),
      setClaimingReward: (claiming) => set({ claimingReward: claiming }),
      setStakingLoading: (loading) => set({ stakingLoading: loading }),
      setTransactionsLoading: (loading) => set({ transactionsLoading: loading }),

      // Error Handling
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Statistics
      updateStats: (stats) => set({ stats: { ...get().stats, ...stats } }),
      
      calculateStats: () => {
        const { transactions, nftRewards, stakingPools } = get();
        
        const totalEarned = transactions
          .filter(tx => tx.type === 'earned')
          .reduce((total, tx) => total + tx.amount, 0);
          
        const totalClaimed = transactions
          .filter(tx => tx.type === 'claimed')
          .reduce((total, tx) => total + tx.amount, 0);
          
        const totalStaked = stakingPools
          .reduce((total, pool) => total + pool.myStaked, 0);

        set({
          stats: {
            totalEarned,
            totalClaimed,
            totalStaked,
            nftCount: nftRewards.length,
            rank: 150, // TODO: Calculate from network
            streak: 7, // TODO: Calculate from activity
          }
        });
      },

      // Actions
      refreshBalances: async () => {
        if (!get().isWalletConnected) return;

        try {
          set({ balancesLoading: true });
          
          // TODO: Fetch actual balances from blockchain
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock data
          const mockBalances: TokenBalance[] = [
            {
              symbol: 'COTRAIN',
              amount: 1250.75,
              decimals: 8,
              usdValue: 125.08,
            },
            {
              symbol: 'APT',
              amount: 45.2,
              decimals: 8,
              usdValue: 542.4,
            },
          ];

          set({ tokenBalances: mockBalances, balancesLoading: false });
          get().calculateTotalUsdValue();

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh balances',
            balancesLoading: false 
          });
        }
      },

      refreshAll: async () => {
        await Promise.all([
          get().refreshBalances(),
          // Add other refresh functions here
        ]);
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'rewards-storage',
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        walletType: state.walletType,
        isWalletConnected: state.isWalletConnected,
        transactions: state.transactions.slice(0, 100), // Only persist last 100 transactions
        stats: state.stats,
      }),
    },
  ),
);