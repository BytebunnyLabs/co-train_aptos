'use client';

import React from 'react';
import { useServiceWorker, OfflineAction } from '@/lib/service-worker';

interface QueuedAction extends OfflineAction {
  id: string;
  description: string;
  retryCount?: number;
  maxRetries?: number;
}

interface UseOfflineQueueOptions {
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: (action: QueuedAction) => void;
  onError?: (action: QueuedAction, error: Error) => void;
}

export function useOfflineQueue(options: UseOfflineQueueOptions = {}) {
  const { isOnline, queueOfflineAction } = useServiceWorker();
  const [queue, setQueue] = React.useState<QueuedAction[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const {
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  // Add action to queue
  const addToQueue = React.useCallback(async (
    action: Omit<QueuedAction, 'id'>,
    executeImmediately = true
  ) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    setQueue(prev => [...prev, queuedAction]);

    if (isOnline && executeImmediately) {
      // Try to execute immediately if online
      await executeAction(queuedAction);
    } else {
      // Queue for later execution
      try {
        await queueOfflineAction({
          url: action.url,
          method: action.method,
          headers: action.headers,
          body: action.body,
          timestamp: action.timestamp,
          description: action.description
        });
      } catch (error) {
        console.error('Failed to queue offline action:', error);
      }
    }

    return queuedAction.id;
  }, [isOnline, queueOfflineAction, maxRetries]);

  // Execute a single action
  const executeAction = React.useCallback(async (action: QueuedAction): Promise<boolean> => {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Remove from queue on success
      setQueue(prev => prev.filter(item => item.id !== action.id));
      
      onSuccess?.(action);
      return true;
    } catch (error) {
      console.error(`Failed to execute action ${action.id}:`, error);
      
      // Update retry count
      setQueue(prev => prev.map(item => 
        item.id === action.id 
          ? { ...item, retryCount: (item.retryCount || 0) + 1 }
          : item
      ));

      const shouldRetry = (action.retryCount || 0) < (action.maxRetries || maxRetries);
      
      if (!shouldRetry) {
        // Remove from queue if max retries reached
        setQueue(prev => prev.filter(item => item.id !== action.id));
        onError?.(action, error as Error);
      }

      return false;
    }
  }, [onSuccess, onError, maxRetries]);

  // Process entire queue
  const processQueue = React.useCallback(async () => {
    if (isProcessing || !isOnline || queue.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      const actionsToProcess = queue.filter(action => 
        (action.retryCount || 0) < (action.maxRetries || maxRetries)
      );

      for (const action of actionsToProcess) {
        const success = await executeAction(action);
        
        if (!success && (action.retryCount || 0) < (action.maxRetries || maxRetries)) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, isOnline, queue, executeAction, maxRetries, retryDelay]);

  // Clear queue
  const clearQueue = React.useCallback(() => {
    setQueue([]);
  }, []);

  // Remove specific action from queue
  const removeFromQueue = React.useCallback((actionId: string) => {
    setQueue(prev => prev.filter(item => item.id !== actionId));
  }, []);

  // Get queue stats
  const queueStats = React.useMemo(() => {
    const total = queue.length;
    const pending = queue.filter(action => (action.retryCount || 0) === 0).length;
    const retrying = queue.filter(action => (action.retryCount || 0) > 0).length;
    const failed = queue.filter(action => 
      (action.retryCount || 0) >= (action.maxRetries || maxRetries)
    ).length;

    return { total, pending, retrying, failed };
  }, [queue, maxRetries]);

  // Auto-process queue when coming back online
  React.useEffect(() => {
    if (isOnline && queue.length > 0) {
      const timer = setTimeout(() => {
        processQueue();
      }, 1000); // Small delay to ensure connection is stable

      return () => clearTimeout(timer);
    }
  }, [isOnline, queue.length, processQueue]);

  // Convenient methods for common actions
  const queueApiCall = React.useCallback(async (
    endpoint: string,
    options: RequestInit & { description: string }
  ) => {
    const { description, ...fetchOptions } = options;
    
    return addToQueue({
      url: endpoint,
      method: fetchOptions.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers as Record<string, string>
      },
      body: fetchOptions.body as string,
      description,
      timestamp: Date.now()
    });
  }, [addToQueue]);

  const queueBlockchainTransaction = React.useCallback(async (
    transactionData: any,
    description: string
  ) => {
    return queueApiCall('/api/blockchain/transaction', {
      method: 'POST',
      body: JSON.stringify(transactionData),
      description
    });
  }, [queueApiCall]);

  const queueContributionSubmission = React.useCallback(async (
    sessionId: string,
    contributionData: any,
    description: string
  ) => {
    return queueApiCall('/api/hivemind/contributions/submit', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        ...contributionData
      }),
      description
    });
  }, [queueApiCall]);

  const queueRewardClaim = React.useCallback(async (
    rewardId: string,
    description: string
  ) => {
    return queueApiCall(`/api/rewards/${rewardId}/claim`, {
      method: 'POST',
      description
    });
  }, [queueApiCall]);

  return {
    // Queue state
    queue,
    isProcessing,
    queueStats,
    
    // Queue operations
    addToQueue,
    processQueue,
    clearQueue,
    removeFromQueue,
    
    // Convenience methods
    queueApiCall,
    queueBlockchainTransaction,
    queueContributionSubmission,
    queueRewardClaim,
    
    // Status
    isOnline,
    hasQueuedActions: queue.length > 0
  };
}

// Types
export type { QueuedAction, UseOfflineQueueOptions };