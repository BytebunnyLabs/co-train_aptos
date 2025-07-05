import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrainingOption {
  id: string;
  title: string;
  description: string;
  iconName: string;
  status: 'available' | 'training' | 'completed' | 'coming-soon';
  participants?: number;
  progress?: number;
  estimatedDuration?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  rewards?: {
    tokens: number;
    reputation: number;
    nfts?: number;
  };
  requirements?: {
    minGPU?: string;
    minRAM?: string;
    bandwidth?: string;
  };
}

export interface TrainingSession {
  id: string;
  trainingOptionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  progress: number;
  computeContributed: number;
  tokensEarned: number;
  reputationEarned: number;
  metrics: TrainingMetrics;
}

export interface TrainingMetrics {
  accuracy?: number;
  loss?: number;
  throughput: number;
  efficiency: number;
  uptime: number;
  errorRate: number;
}

export interface TrainingHistory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  startDate: string;
  endDate?: string;
  status: 'completed' | 'active' | 'paused' | 'failed';
  contribution: {
    computeHours: number;
    tokensProcessed: number;
    rank: number;
    totalParticipants: number;
    efficiency: number;
  };
  rewards: {
    tokens: number;
    nfts: number;
    reputation: number;
  };
  progress: number;
  duration: string;
  tags?: string[];
}

interface TrainingState {
  // Training Options
  options: TrainingOption[];
  selectedOption: TrainingOption | null;
  optionsLoading: boolean;

  // Active Sessions
  currentSession: TrainingSession | null;
  sessions: TrainingSession[];
  sessionsLoading: boolean;

  // History
  history: TrainingHistory[];
  historyLoading: boolean;

  // Metrics
  totalComputeHours: number;
  totalTokensEarned: number;
  totalReputationEarned: number;
  currentRank: number;

  // UI State
  isTraining: boolean;
  error: string | null;
}

interface TrainingActions {
  // Training Options
  setOptions: (options: TrainingOption[]) => void;
  selectOption: (option: TrainingOption) => void;
  setOptionsLoading: (loading: boolean) => void;

  // Sessions
  startTraining: (optionId: string) => Promise<void>;
  pauseTraining: () => Promise<void>;
  resumeTraining: () => Promise<void>;
  stopTraining: () => Promise<void>;
  setCurrentSession: (session: TrainingSession | null) => void;
  setSessions: (sessions: TrainingSession[]) => void;
  updateSessionMetrics: (sessionId: string, metrics: Partial<TrainingMetrics>) => void;
  setSessionsLoading: (loading: boolean) => void;

  // History
  setHistory: (history: TrainingHistory[]) => void;
  addHistoryItem: (item: TrainingHistory) => void;
  setHistoryLoading: (loading: boolean) => void;

  // Metrics
  updateMetrics: (metrics: {
    totalComputeHours?: number;
    totalTokensEarned?: number;
    totalReputationEarned?: number;
    currentRank?: number;
  }) => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Reset
  reset: () => void;
}

export type TrainingStore = TrainingState & TrainingActions;

const initialState: TrainingState = {
  options: [],
  selectedOption: null,
  optionsLoading: false,
  currentSession: null,
  sessions: [],
  sessionsLoading: false,
  history: [],
  historyLoading: false,
  totalComputeHours: 0,
  totalTokensEarned: 0,
  totalReputationEarned: 0,
  currentRank: 0,
  isTraining: false,
  error: null,
};

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Training Options
      setOptions: (options) => set({ options }),
      selectOption: (option) => set({ selectedOption: option }),
      setOptionsLoading: (loading) => set({ optionsLoading: loading }),

      // Sessions
      startTraining: async (optionId) => {
        const { selectedOption } = get();
        if (!selectedOption) return;

        try {
          set({ isTraining: true, error: null });
          
          // Create new session
          const newSession: TrainingSession = {
            id: `session_${Date.now()}`,
            trainingOptionId: optionId,
            userId: 'current-user', // This should come from auth store
            startTime: new Date().toISOString(),
            status: 'active',
            progress: 0,
            computeContributed: 0,
            tokensEarned: 0,
            reputationEarned: 0,
            metrics: {
              throughput: 0,
              efficiency: 0,
              uptime: 0,
              errorRate: 0,
            },
          };

          set({ currentSession: newSession });

          // TODO: Integrate with backend API
          console.log('Starting training session:', newSession);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to start training',
            isTraining: false 
          });
        }
      },

      pauseTraining: async () => {
        const { currentSession } = get();
        if (!currentSession) return;

        try {
          set({ 
            currentSession: { 
              ...currentSession, 
              status: 'paused' 
            },
            isTraining: false 
          });
          // TODO: Integrate with backend API
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to pause training' });
        }
      },

      resumeTraining: async () => {
        const { currentSession } = get();
        if (!currentSession) return;

        try {
          set({ 
            currentSession: { 
              ...currentSession, 
              status: 'active' 
            },
            isTraining: true 
          });
          // TODO: Integrate with backend API
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to resume training' });
        }
      },

      stopTraining: async () => {
        const { currentSession } = get();
        if (!currentSession) return;

        try {
          const completedSession = {
            ...currentSession,
            status: 'completed' as const,
            endTime: new Date().toISOString(),
          };

          set({ 
            currentSession: null,
            isTraining: false,
            sessions: [...get().sessions, completedSession]
          });

          // Add to history
          const historyItem: TrainingHistory = {
            id: completedSession.id,
            title: get().selectedOption?.title || 'Training Session',
            description: get().selectedOption?.description || '',
            iconName: get().selectedOption?.iconName || 'brain',
            startDate: completedSession.startTime,
            endDate: completedSession.endTime,
            status: 'completed',
            contribution: {
              computeHours: completedSession.computeContributed,
              tokensProcessed: completedSession.tokensEarned,
              rank: get().currentRank,
              totalParticipants: 100, // TODO: Get from API
              efficiency: completedSession.metrics.efficiency,
            },
            rewards: {
              tokens: completedSession.tokensEarned,
              nfts: 0,
              reputation: completedSession.reputationEarned,
            },
            progress: completedSession.progress,
            duration: '2h 30m', // TODO: Calculate from start/end time
          };

          get().addHistoryItem(historyItem);

          // TODO: Integrate with backend API
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to stop training' });
        }
      },

      setCurrentSession: (session) => set({ currentSession: session }),
      setSessions: (sessions) => set({ sessions }),
      
      updateSessionMetrics: (sessionId, metrics) => {
        const { currentSession, sessions } = get();
        
        if (currentSession?.id === sessionId) {
          set({
            currentSession: {
              ...currentSession,
              metrics: { ...currentSession.metrics, ...metrics }
            }
          });
        }

        const updatedSessions = sessions.map(session =>
          session.id === sessionId
            ? { ...session, metrics: { ...session.metrics, ...metrics } }
            : session
        );
        set({ sessions: updatedSessions });
      },

      setSessionsLoading: (loading) => set({ sessionsLoading: loading }),

      // History
      setHistory: (history) => set({ history }),
      addHistoryItem: (item) => set({ history: [item, ...get().history] }),
      setHistoryLoading: (loading) => set({ historyLoading: loading }),

      // Metrics
      updateMetrics: (metrics) => set({ ...metrics }),

      // Error handling
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'training-storage',
      partialize: (state) => ({
        history: state.history,
        totalComputeHours: state.totalComputeHours,
        totalTokensEarned: state.totalTokensEarned,
        totalReputationEarned: state.totalReputationEarned,
        currentRank: state.currentRank,
      }),
    },
  ),
);