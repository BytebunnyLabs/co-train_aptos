import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WalletInfo {
  name: string;
  icon: string;
  description: string;
  url: string;
  isInstalled: boolean;
  isConnectable: boolean;
}

export interface AccountInfo {
  address: string;
  publicKey: string;
  minKeysRequired?: number;
  authKey?: string;
}

export interface NetworkInfo {
  name: string;
  chainId: string;
  url: string;
}

export interface WalletTransaction {
  hash: string;
  sender: string;
  sequenceNumber: string;
  maxGasAmount: string;
  gasUnitPrice: string;
  gasUsed?: string;
  success?: boolean;
  timestamp: string;
  type: string;
  payload?: any;
}

interface WalletState {
  // Connection State
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Wallet Info
  connectedWallet: WalletInfo | null;
  availableWallets: WalletInfo[];
  
  // Account Info
  account: AccountInfo | null;
  
  // Network Info
  network: NetworkInfo | null;
  
  // Transactions
  pendingTransactions: WalletTransaction[];
  transactionHistory: WalletTransaction[];
  
  // Signing State
  isSigning: boolean;
  signingError: string | null;
  
  // Balance (APT)
  aptBalance: number;
  balanceLoading: boolean;
  
  // Auto-connect
  autoConnect: boolean;
  lastConnectedWallet: string | null;
}

interface WalletActions {
  // Connection Management
  connect: (walletName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  setConnecting: (connecting: boolean) => void;
  setConnectionError: (error: string | null) => void;
  
  // Wallet Management
  setConnectedWallet: (wallet: WalletInfo | null) => void;
  setAvailableWallets: (wallets: WalletInfo[]) => void;
  checkWalletInstallation: () => void;
  
  // Account Management
  setAccount: (account: AccountInfo | null) => void;
  refreshAccount: () => Promise<void>;
  
  // Network Management
  setNetwork: (network: NetworkInfo | null) => void;
  switchNetwork: (networkName: string) => Promise<void>;
  
  // Transaction Management
  signAndSubmitTransaction: (transaction: any) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  addPendingTransaction: (transaction: WalletTransaction) => void;
  updateTransactionStatus: (hash: string, success: boolean, gasUsed?: string) => void;
  setTransactionHistory: (history: WalletTransaction[]) => void;
  clearPendingTransactions: () => void;
  
  // Signing State
  setSigning: (signing: boolean) => void;
  setSigningError: (error: string | null) => void;
  
  // Balance Management
  setAptBalance: (balance: number) => void;
  refreshBalance: () => Promise<void>;
  setBalanceLoading: (loading: boolean) => void;
  
  // Auto-connect
  setAutoConnect: (autoConnect: boolean) => void;
  setLastConnectedWallet: (walletName: string | null) => void;
  
  // Error Handling
  clearErrors: () => void;
  
  // Reset
  reset: () => void;
}

export type WalletStore = WalletState & WalletActions;

const defaultNetworks: NetworkInfo[] = [
  {
    name: 'Mainnet',
    chainId: '1',
    url: 'https://fullnode.mainnet.aptoslabs.com',
  },
  {
    name: 'Testnet',
    chainId: '2',
    url: 'https://fullnode.testnet.aptoslabs.com',
  },
  {
    name: 'Devnet',
    chainId: '3',
    url: 'https://fullnode.devnet.aptoslabs.com',
  },
];

const defaultWallets: WalletInfo[] = [
  {
    name: 'Petra',
    icon: '/wallets/petra.svg',
    description: 'Petra Wallet for Aptos',
    url: 'https://petra.app/',
    isInstalled: false,
    isConnectable: false,
  },
  {
    name: 'Martian',
    icon: '/wallets/martian.svg',
    description: 'Martian Wallet for Aptos',
    url: 'https://martianwallet.xyz/',
    isInstalled: false,
    isConnectable: false,
  },
  {
    name: 'MSafe',
    icon: '/wallets/msafe.svg',
    description: 'MSafe Multisig Wallet',
    url: 'https://msafe.io/',
    isInstalled: false,
    isConnectable: false,
  },
  {
    name: 'Fewcha',
    icon: '/wallets/fewcha.svg',
    description: 'Fewcha Wallet for Aptos',
    url: 'https://fewcha.app/',
    isInstalled: false,
    isConnectable: false,
  },
  {
    name: 'Rise',
    icon: '/wallets/rise.svg',
    description: 'Rise Wallet for Aptos',
    url: 'https://risewallet.io/',
    isInstalled: false,
    isConnectable: false,
  },
];

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  connectedWallet: null,
  availableWallets: defaultWallets,
  account: null,
  network: defaultNetworks[1], // Default to testnet
  pendingTransactions: [],
  transactionHistory: [],
  isSigning: false,
  signingError: null,
  aptBalance: 0,
  balanceLoading: false,
  autoConnect: true,
  lastConnectedWallet: null,
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Connection Management
      connect: async (walletName) => {
        try {
          set({ isConnecting: true, connectionError: null });

          // TODO: Integrate with @aptos-labs/wallet-adapter-react
          // This would connect to the actual wallet
          
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay

          const wallet = get().availableWallets.find(w => w.name === walletName);
          if (!wallet) {
            throw new Error(`Wallet ${walletName} not found`);
          }

          // Mock account data
          const mockAccount: AccountInfo = {
            address: '0x1234567890abcdef1234567890abcdef12345678',
            publicKey: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            authKey: '0x1234567890abcdef1234567890abcdef12345678',
          };

          set({
            isConnected: true,
            isConnecting: false,
            connectedWallet: wallet,
            account: mockAccount,
            lastConnectedWallet: walletName,
          });

          // Refresh balance after connection
          get().refreshBalance();

        } catch (error) {
          set({
            connectionError: error instanceof Error ? error.message : 'Failed to connect wallet',
            isConnecting: false,
          });
        }
      },

      disconnect: async () => {
        try {
          // TODO: Integrate with wallet adapter disconnect
          await new Promise(resolve => setTimeout(resolve, 500));

          set({
            isConnected: false,
            connectedWallet: null,
            account: null,
            pendingTransactions: [],
            aptBalance: 0,
            connectionError: null,
            signingError: null,
          });

        } catch (error) {
          set({
            connectionError: error instanceof Error ? error.message : 'Failed to disconnect wallet',
          });
        }
      },

      reconnect: async () => {
        const { lastConnectedWallet, autoConnect } = get();
        if (lastConnectedWallet && autoConnect) {
          await get().connect(lastConnectedWallet);
        }
      },

      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setConnectionError: (error) => set({ connectionError: error }),

      // Wallet Management
      setConnectedWallet: (wallet) => set({ connectedWallet: wallet }),
      setAvailableWallets: (wallets) => set({ availableWallets: wallets }),

      checkWalletInstallation: () => {
        // TODO: Check if wallets are actually installed
        const wallets = get().availableWallets.map(wallet => ({
          ...wallet,
          isInstalled: true, // Mock - in reality check window.aptos, etc.
          isConnectable: true,
        }));
        set({ availableWallets: wallets });
      },

      // Account Management
      setAccount: (account) => set({ account }),

      refreshAccount: async () => {
        if (!get().isConnected) return;

        try {
          // TODO: Fetch latest account info from blockchain
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Account info would be refreshed here
          console.log('Account refreshed');

        } catch (error) {
          console.error('Failed to refresh account:', error);
        }
      },

      // Network Management
      setNetwork: (network) => set({ network }),

      switchNetwork: async (networkName) => {
        try {
          const network = defaultNetworks.find(n => n.name === networkName);
          if (!network) {
            throw new Error(`Network ${networkName} not found`);
          }

          // TODO: Integrate with wallet adapter to switch network
          await new Promise(resolve => setTimeout(resolve, 1000));

          set({ network });

          // Refresh balance on network switch
          get().refreshBalance();

        } catch (error) {
          set({
            connectionError: error instanceof Error ? error.message : 'Failed to switch network',
          });
        }
      },

      // Transaction Management
      signAndSubmitTransaction: async (transaction) => {
        try {
          set({ isSigning: true, signingError: null });

          // TODO: Integrate with wallet adapter to sign and submit
          await new Promise(resolve => setTimeout(resolve, 2000));

          const hash = `0x${Math.random().toString(16).slice(2)}`;
          
          const walletTransaction: WalletTransaction = {
            hash,
            sender: get().account?.address || '',
            sequenceNumber: '1',
            maxGasAmount: '1000',
            gasUnitPrice: '100',
            timestamp: new Date().toISOString(),
            type: transaction.type || 'unknown',
            payload: transaction,
          };

          get().addPendingTransaction(walletTransaction);
          set({ isSigning: false });

          // Simulate transaction confirmation
          setTimeout(() => {
            get().updateTransactionStatus(hash, true, '150');
          }, 3000);

          return hash;

        } catch (error) {
          set({
            signingError: error instanceof Error ? error.message : 'Failed to sign transaction',
            isSigning: false,
          });
          throw error;
        }
      },

      signMessage: async (message) => {
        try {
          set({ isSigning: true, signingError: null });

          // TODO: Integrate with wallet adapter to sign message
          await new Promise(resolve => setTimeout(resolve, 1500));

          const signature = `0x${Math.random().toString(16).slice(2)}`;
          set({ isSigning: false });

          return signature;

        } catch (error) {
          set({
            signingError: error instanceof Error ? error.message : 'Failed to sign message',
            isSigning: false,
          });
          throw error;
        }
      },

      addPendingTransaction: (transaction) => {
        const pendingTransactions = [...get().pendingTransactions, transaction];
        set({ pendingTransactions });
      },

      updateTransactionStatus: (hash, success, gasUsed) => {
        const { pendingTransactions, transactionHistory } = get();
        
        const transaction = pendingTransactions.find(tx => tx.hash === hash);
        if (!transaction) return;

        const updatedTransaction = {
          ...transaction,
          success,
          gasUsed,
        };

        const newPending = pendingTransactions.filter(tx => tx.hash !== hash);
        const newHistory = [updatedTransaction, ...transactionHistory];

        set({
          pendingTransactions: newPending,
          transactionHistory: newHistory,
        });

        // Refresh balance after transaction
        if (success) {
          get().refreshBalance();
        }
      },

      setTransactionHistory: (history) => set({ transactionHistory: history }),
      clearPendingTransactions: () => set({ pendingTransactions: [] }),

      // Signing State
      setSigning: (signing) => set({ isSigning: signing }),
      setSigningError: (error) => set({ signingError: error }),

      // Balance Management
      setAptBalance: (balance) => set({ aptBalance: balance }),

      refreshBalance: async () => {
        if (!get().account?.address) return;

        try {
          set({ balanceLoading: true });

          // TODO: Fetch actual balance from blockchain
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Mock balance
          const mockBalance = 123.45;
          set({ aptBalance: mockBalance, balanceLoading: false });

        } catch (error) {
          set({ balanceLoading: false });
          console.error('Failed to refresh balance:', error);
        }
      },

      setBalanceLoading: (loading) => set({ balanceLoading: loading }),

      // Auto-connect
      setAutoConnect: (autoConnect) => set({ autoConnect }),
      setLastConnectedWallet: (walletName) => set({ lastConnectedWallet: walletName }),

      // Error Handling
      clearErrors: () => set({ connectionError: null, signingError: null }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        autoConnect: state.autoConnect,
        lastConnectedWallet: state.lastConnectedWallet,
        network: state.network,
        transactionHistory: state.transactionHistory.slice(0, 50), // Only persist last 50 transactions
      }),
    },
  ),
);