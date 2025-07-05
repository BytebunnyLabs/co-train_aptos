import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NetworkNode {
  id: string;
  address: string;
  status: 'online' | 'offline' | 'training' | 'connecting';
  location?: string;
  joinDate: string;
  lastSeen: string;
  hardware?: {
    gpu: string;
    memory: string;
    cores: number;
    bandwidth: number;
  };
  performance: {
    uptime: number;
    reliability: number;
    avgLatency: number;
    computeContributed: number;
  };
  reputation: number;
  contributions: number;
}

export interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  trainingNodes: number;
  totalComputeHours: number;
  modelsTraining: number;
  totalContributors: number;
  networkHealth: number;
  avgLatency: number;
  totalBandwidth: number;
  rewardPool: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  category: 'network' | 'training' | 'system' | 'user';
  nodeId?: string;
  details?: Record<string, any>;
}

export interface NetworkEvent {
  id: string;
  type: 'node_joined' | 'node_left' | 'training_started' | 'training_completed' | 'reward_distributed';
  timestamp: string;
  nodeId?: string;
  data?: Record<string, any>;
}

export interface P2PConnection {
  peerId: string;
  status: 'connected' | 'connecting' | 'disconnected';
  latency: number;
  bandwidth: number;
  lastSeen: string;
  messageCount: number;
}

interface HivemindState {
  // Network State
  isConnected: boolean;
  nodeId: string | null;
  myNode: NetworkNode | null;
  
  // Network Data
  nodes: NetworkNode[];
  stats: NetworkStats;
  connections: P2PConnection[];
  
  // Logs and Events
  logs: SystemLog[];
  events: NetworkEvent[];
  
  // Loading States
  nodesLoading: boolean;
  statsLoading: boolean;
  connectionLoading: boolean;
  
  // Error State
  error: string | null;
  
  // Real-time Updates
  lastUpdate: string | null;
  isStreaming: boolean;
}

interface HivemindActions {
  // Connection Management
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setConnectionStatus: (connected: boolean) => void;
  setNodeId: (nodeId: string) => void;
  setMyNode: (node: NetworkNode) => void;
  
  // Network Data
  setNodes: (nodes: NetworkNode[]) => void;
  updateNode: (nodeId: string, updates: Partial<NetworkNode>) => void;
  removeNode: (nodeId: string) => void;
  addNode: (node: NetworkNode) => void;
  
  setStats: (stats: NetworkStats) => void;
  updateStats: (updates: Partial<NetworkStats>) => void;
  
  setConnections: (connections: P2PConnection[]) => void;
  updateConnection: (peerId: string, updates: Partial<P2PConnection>) => void;
  
  // Logs and Events
  addLog: (log: Omit<SystemLog, 'id'>) => void;
  clearLogs: () => void;
  setLogs: (logs: SystemLog[]) => void;
  
  addEvent: (event: Omit<NetworkEvent, 'id'>) => void;
  clearEvents: () => void;
  setEvents: (events: NetworkEvent[]) => void;
  
  // Loading States
  setNodesLoading: (loading: boolean) => void;
  setStatsLoading: (loading: boolean) => void;
  setConnectionLoading: (loading: boolean) => void;
  
  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Real-time Updates
  setLastUpdate: (timestamp: string) => void;
  setStreaming: (streaming: boolean) => void;
  
  // Actions
  startTraining: () => Promise<void>;
  stopTraining: () => Promise<void>;
  shareResources: (resources: { gpu: boolean; cpu: boolean; bandwidth: number }) => Promise<void>;
  
  // Reset
  reset: () => void;
}

export type HivemindStore = HivemindState & HivemindActions;

const initialStats: NetworkStats = {
  totalNodes: 0,
  activeNodes: 0,
  trainingNodes: 0,
  totalComputeHours: 0,
  modelsTraining: 0,
  totalContributors: 0,
  networkHealth: 0,
  avgLatency: 0,
  totalBandwidth: 0,
  rewardPool: 0,
};

const initialState: HivemindState = {
  isConnected: false,
  nodeId: null,
  myNode: null,
  nodes: [],
  stats: initialStats,
  connections: [],
  logs: [],
  events: [],
  nodesLoading: false,
  statsLoading: false,
  connectionLoading: false,
  error: null,
  lastUpdate: null,
  isStreaming: false,
};

export const useHivemindStore = create<HivemindStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Connection Management
      connect: async () => {
        try {
          set({ connectionLoading: true, error: null });
          
          // TODO: Implement actual P2P connection logic
          // This would connect to the hivemind network
          
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
          
          const nodeId = `node_${Date.now()}`;
          const myNode: NetworkNode = {
            id: nodeId,
            address: '127.0.0.1:8080', // TODO: Get actual address
            status: 'online',
            joinDate: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            performance: {
              uptime: 100,
              reliability: 95,
              avgLatency: 50,
              computeContributed: 0,
            },
            reputation: 0,
            contributions: 0,
          };

          set({
            isConnected: true,
            nodeId,
            myNode,
            connectionLoading: false,
          });

          get().addLog({
            timestamp: new Date().toISOString(),
            message: `Connected to hivemind network as ${nodeId}`,
            type: 'success',
            category: 'network',
          });

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to connect to network',
            connectionLoading: false,
          });
        }
      },

      disconnect: async () => {
        try {
          set({ connectionLoading: true });
          
          // TODO: Implement actual disconnect logic
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          get().addLog({
            timestamp: new Date().toISOString(),
            message: 'Disconnected from hivemind network',
            type: 'info',
            category: 'network',
          });

          set({
            isConnected: false,
            nodeId: null,
            myNode: null,
            connectionLoading: false,
            isStreaming: false,
          });

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to disconnect',
            connectionLoading: false,
          });
        }
      },

      setConnectionStatus: (connected) => set({ isConnected: connected }),
      setNodeId: (nodeId) => set({ nodeId }),
      setMyNode: (node) => set({ myNode: node }),

      // Network Data
      setNodes: (nodes) => set({ nodes }),
      
      updateNode: (nodeId, updates) => {
        const nodes = get().nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        );
        set({ nodes });
      },

      removeNode: (nodeId) => {
        const nodes = get().nodes.filter(node => node.id !== nodeId);
        set({ nodes });
      },

      addNode: (node) => {
        const nodes = [...get().nodes, node];
        set({ nodes });
      },

      setStats: (stats) => set({ stats }),
      
      updateStats: (updates) => {
        const stats = { ...get().stats, ...updates };
        set({ stats });
      },

      setConnections: (connections) => set({ connections }),
      
      updateConnection: (peerId, updates) => {
        const connections = get().connections.map(conn =>
          conn.peerId === peerId ? { ...conn, ...updates } : conn
        );
        set({ connections });
      },

      // Logs and Events
      addLog: (log) => {
        const logs = [
          { ...log, id: `log_${Date.now()}_${Math.random()}` },
          ...get().logs.slice(0, 999) // Keep last 1000 logs
        ];
        set({ logs });
      },

      clearLogs: () => set({ logs: [] }),
      setLogs: (logs) => set({ logs }),

      addEvent: (event) => {
        const events = [
          { ...event, id: `event_${Date.now()}_${Math.random()}` },
          ...get().events.slice(0, 99) // Keep last 100 events
        ];
        set({ events });
      },

      clearEvents: () => set({ events: [] }),
      setEvents: (events) => set({ events }),

      // Loading States
      setNodesLoading: (loading) => set({ nodesLoading: loading }),
      setStatsLoading: (loading) => set({ statsLoading: loading }),
      setConnectionLoading: (loading) => set({ connectionLoading: loading }),

      // Error Handling
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Real-time Updates
      setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),

      // Actions
      startTraining: async () => {
        const { myNode } = get();
        if (!myNode) return;

        try {
          set({ myNode: { ...myNode, status: 'training' } });
          
          get().addLog({
            timestamp: new Date().toISOString(),
            message: 'Started contributing to training session',
            type: 'success',
            category: 'training',
          });

          // TODO: Integrate with training service
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to start training' });
        }
      },

      stopTraining: async () => {
        const { myNode } = get();
        if (!myNode) return;

        try {
          set({ myNode: { ...myNode, status: 'online' } });
          
          get().addLog({
            timestamp: new Date().toISOString(),
            message: 'Stopped contributing to training session',
            type: 'info',
            category: 'training',
          });

          // TODO: Integrate with training service
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to stop training' });
        }
      },

      shareResources: async (resources) => {
        try {
          get().addLog({
            timestamp: new Date().toISOString(),
            message: `Sharing resources: GPU(${resources.gpu}), CPU(${resources.cpu}), Bandwidth(${resources.bandwidth}Mbps)`,
            type: 'info',
            category: 'system',
          });

          // TODO: Integrate with resource sharing service
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to share resources' });
        }
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'hivemind-storage',
      partialize: (state) => ({
        nodeId: state.nodeId,
        logs: state.logs.slice(0, 100), // Only persist last 100 logs
        events: state.events.slice(0, 50), // Only persist last 50 events
      }),
    },
  ),
);