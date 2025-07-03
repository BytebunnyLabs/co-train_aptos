'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  totalComputePower: number;
  networkHealth: number;
}

interface P2PNode {
  nodeId: string;
  address: string;
  isActive: boolean;
  reputationScore: number;
  computeCapacity: number;
  bandwidth: number;
  lastSeen: string;
  status: string;
}

interface HivemindEvents {
  'network:stats': (data: NetworkStats) => void;
  'network:initial_state': (data: { stats: NetworkStats; nodes: P2PNode[] }) => void;
  'node:joined': (data: { nodeId: string; timestamp: string }) => void;
  'node:left': (data: { nodeId: string; timestamp: string }) => void;
  'node:status_update': (data: { nodeId: string; status: any; metrics: any }) => void;
  'gradient:received': (data: { nodeId: string; quality: number; timestamp: string }) => void;
  'training:metrics_update': (data: { nodeId: string; metrics: any; timestamp: string }) => void;
  'rewards:distributed': (data: any) => void;
  'node:failure': (data: { nodeId: string; failureType: string; details: any }) => void;
  'checkpoint:created': (data: { sessionId: string; checkpointId: string }) => void;
}

interface UseHivemindWebSocketOptions {
  nodeId?: string;
  sessionId?: string;
  type?: 'node' | 'monitor';
  autoConnect?: boolean;
}

export function useHivemindWebSocket(options: UseHivemindWebSocketOptions = {}) {
  const {
    nodeId,
    sessionId,
    type = 'monitor',
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [nodes, setNodes] = useState<P2PNode[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    const query: any = { type };
    if (nodeId) query.nodeId = nodeId;
    if (sessionId) query.sessionId = sessionId;

    socketRef.current = io('/hivemind', {
      query,
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Hivemind WebSocket');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from Hivemind WebSocket');
    });

    socket.on('connect_error', (error) => {
      console.error('Hivemind WebSocket connection error:', error);
    });

    // Network events
    socket.on('network:initial_state', (data) => {
      setNetworkStats(data.stats);
      setNodes(data.nodes);
    });

    socket.on('network:stats', (data) => {
      setNetworkStats(data);
    });

    // Node events
    socket.on('node:joined', (data) => {
      addEvent('node:joined', data);
      // Refresh nodes list
      requestNetworkStats();
    });

    socket.on('node:left', (data) => {
      addEvent('node:left', data);
      setNodes(prev => prev.filter(node => node.nodeId !== data.nodeId));
    });

    socket.on('node:status_update', (data) => {
      setNodes(prev => prev.map(node => 
        node.nodeId === data.nodeId
          ? { ...node, ...data.status, lastSeen: data.timestamp }
          : node
      ));
    });

    // Training events
    socket.on('gradient:received', (data) => {
      addEvent('gradient:received', data);
    });

    socket.on('training:metrics_update', (data) => {
      addEvent('training:metrics_update', data);
    });

    // Reward events
    socket.on('rewards:distributed', (data) => {
      addEvent('rewards:distributed', data);
    });

    // Node-specific events (when acting as a node)
    if (type === 'node') {
      socket.on('node:initialized', (data) => {
        console.log('Node initialized:', data);
      });

      socket.on('heartbeat:ack', (data) => {
        console.log('Heartbeat acknowledged:', data);
      });

      socket.on('gradient:acknowledged', (data) => {
        console.log('Gradient acknowledged:', data);
      });

      socket.on('reward:received', (data) => {
        console.log('Reward received:', data);
        addEvent('reward:received', data);
      });
    }

    // Error events
    socket.on('training:error', (data) => {
      console.error('Training error:', data);
      addEvent('error', data);
    });

    socket.on('gradient:error', (data) => {
      console.error('Gradient error:', data);
      addEvent('error', data);
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const addEvent = (type: string, data: any) => {
    setEvents(prev => [
      { type, data, timestamp: new Date() },
      ...prev.slice(0, 99) // Keep last 100 events
    ]);
  };

  // Methods for monitors
  const requestNetworkStats = () => {
    socketRef.current?.emit('monitor:request_network_stats');
  };

  const joinSession = (sessionId: string) => {
    socketRef.current?.emit('monitor:join_session', { sessionId });
  };

  const leaveSession = (sessionId: string) => {
    socketRef.current?.emit('monitor:leave_session', { sessionId });
  };

  const startTrainingSession = (sessionId: string, modelConfig: any) => {
    socketRef.current?.emit('training:start_session', { sessionId, modelConfig });
  };

  const stopTrainingSession = (sessionId: string) => {
    socketRef.current?.emit('training:stop_session', { sessionId });
  };

  // Methods for nodes
  const sendHeartbeat = (status: any, metrics: any) => {
    if (type === 'node') {
      socketRef.current?.emit('node:heartbeat', { status, metrics });
    }
  };

  const submitGradient = (gradientData: any) => {
    if (type === 'node' && sessionId) {
      socketRef.current?.emit('node:gradient_submission', {
        sessionId,
        ...gradientData,
      });
    }
  };

  const sendTrainingMetrics = (metrics: any) => {
    if (type === 'node' && sessionId) {
      socketRef.current?.emit('node:training_metrics', {
        sessionId,
        metrics,
      });
    }
  };

  // Custom event listeners
  const on = (event: string, listener: (...args: any[]) => void) => {
    socketRef.current?.on(event, listener);
  };

  const off = (event: string, listener: (...args: any[]) => void) => {
    socketRef.current?.off(event, listener);
  };

  const emit = (event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  };

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, nodeId, sessionId, type]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    // Connection state
    isConnected,
    connect,
    disconnect,

    // Data
    networkStats,
    nodes,
    events,

    // Monitor methods
    requestNetworkStats,
    joinSession,
    leaveSession,
    startTrainingSession,
    stopTrainingSession,

    // Node methods
    sendHeartbeat,
    submitGradient,
    sendTrainingMetrics,

    // Event handling
    on,
    off,
    emit,

    // Utils
    clearEvents: () => setEvents([]),
  };
}