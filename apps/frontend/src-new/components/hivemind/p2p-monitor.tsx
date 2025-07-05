'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Progress } from '@heroui/react';
import { 
  Network,
  Activity,
  Wifi,
  WifiOff,
  Users,
  MessageSquare,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Signal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useHivemindStore } from '@/lib/stores';

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  avgLatency: number;
  totalBandwidth: number;
  messagesPerSecond: number;
  errorRate: number;
  uptime: number;
}

export function P2PMonitor() {
  const { connections, isConnected, isStreaming } = useHivemindStore();
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    totalConnections: 0,
    activeConnections: 0,
    avgLatency: 0,
    totalBandwidth: 0,
    messagesPerSecond: 0,
    errorRate: 0,
    uptime: 0
  });

  // Mock P2P connections for demonstration
  const mockConnections = connections.length > 0 ? connections : [
    {
      peerId: 'peer_001_sf',
      status: 'connected' as const,
      latency: 45,
      bandwidth: 125.5,
      lastSeen: new Date(Date.now() - 2000).toISOString(),
      messageCount: 1247
    },
    {
      peerId: 'peer_002_london',
      status: 'connected' as const,
      latency: 78,
      bandwidth: 89.2,
      lastSeen: new Date(Date.now() - 1500).toISOString(),
      messageCount: 892
    },
    {
      peerId: 'peer_003_tokyo',
      status: 'disconnected' as const,
      latency: 180,
      bandwidth: 0,
      lastSeen: new Date(Date.now() - 300000).toISOString(),
      messageCount: 234
    },
    {
      peerId: 'peer_004_sydney',
      status: 'connecting' as const,
      latency: 220,
      bandwidth: 34.7,
      lastSeen: new Date(Date.now() - 5000).toISOString(),
      messageCount: 156
    },
    {
      peerId: 'peer_005_toronto',
      status: 'connected' as const,
      latency: 65,
      bandwidth: 98.3,
      lastSeen: new Date(Date.now() - 1000).toISOString(),
      messageCount: 567
    }
  ];

  // Calculate metrics from connections
  useEffect(() => {
    const activeConns = mockConnections.filter(c => c.status === 'connected');
    const totalLatency = activeConns.reduce((sum, c) => sum + c.latency, 0);
    const totalBandwidth = activeConns.reduce((sum, c) => sum + c.bandwidth, 0);
    const totalMessages = mockConnections.reduce((sum, c) => sum + c.messageCount, 0);

    setMetrics({
      totalConnections: mockConnections.length,
      activeConnections: activeConns.length,
      avgLatency: activeConns.length > 0 ? totalLatency / activeConns.length : 0,
      totalBandwidth,
      messagesPerSecond: totalMessages / 300, // Simulate messages per second
      errorRate: Math.random() * 5, // Random error rate for demo
      uptime: 98.7 + Math.random() * 1.3 // Random uptime for demo
    });
  }, [mockConnections]);

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-warning animate-spin" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-danger" />;
      default:
        return <XCircle className="h-4 w-4 text-default" />;
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'danger';
      default: return 'default';
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-success';
    if (latency < 200) return 'text-warning';
    return 'text-danger';
  };

  const getBandwidthColor = (bandwidth: number) => {
    if (bandwidth > 100) return 'text-success';
    if (bandwidth > 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">P2P Network Monitor</h3>
                <p className="text-sm text-foreground-600">
                  Real-time peer-to-peer connection monitoring
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isStreaming && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm text-success">Live</span>
                </div>
              )}
              <Button variant="flat" size="sm" startContent={<RefreshCw className="h-4 w-4" />}>
                Refresh
              </Button>
              <Button variant="flat" size="sm" startContent={<Settings className="h-4 w-4" />}>
                Settings
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.activeConnections}</p>
            <p className="text-sm text-foreground-600">Active Connections</p>
            <div className="mt-2">
              <p className="text-xs text-foreground-500">
                {metrics.totalConnections} total peers
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-success/10">
                <Signal className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.avgLatency.toFixed(0)}ms</p>
            <p className="text-sm text-foreground-600">Average Latency</p>
            <div className="mt-2">
              <Progress 
                value={Math.max(0, 100 - (metrics.avgLatency / 3))} 
                color="success" 
                size="sm"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-warning/10">
                <Zap className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.totalBandwidth.toFixed(1)}</p>
            <p className="text-sm text-foreground-600">Total Bandwidth (MB/s)</p>
            <div className="mt-2">
              <p className="text-xs text-foreground-500">
                {metrics.messagesPerSecond.toFixed(1)} msg/s
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-secondary/10">
                <Activity className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.uptime.toFixed(1)}%</p>
            <p className="text-sm text-foreground-600">Network Uptime</p>
            <div className="mt-2">
              <p className="text-xs text-danger">
                {metrics.errorRate.toFixed(2)}% error rate
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection List */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Active Connections</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {mockConnections.map((connection) => (
              <div key={connection.peerId} className="border border-divider rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getConnectionStatusIcon(connection.status)}
                    <span className="font-medium">{connection.peerId}</span>
                    <Chip 
                      size="sm" 
                      color={getConnectionStatusColor(connection.status) as any}
                      variant="flat"
                    >
                      {connection.status.toUpperCase()}
                    </Chip>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-foreground-600 mb-1">Latency</p>
                    <p className={`font-semibold ${getLatencyColor(connection.latency)}`}>
                      {connection.latency}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground-600 mb-1">Bandwidth</p>
                    <p className={`font-semibold ${getBandwidthColor(connection.bandwidth)}`}>
                      {connection.bandwidth.toFixed(1)} MB/s
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground-600 mb-1">Messages</p>
                    <p className="font-semibold">{connection.messageCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-foreground-600 mb-1">Last Seen</p>
                    <p className="font-semibold">
                      {Math.floor((Date.now() - new Date(connection.lastSeen).getTime()) / 1000)}s ago
                    </p>
                  </div>
                </div>

                {/* Connection Quality Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground-600">Connection Quality</span>
                    <span className="text-xs">
                      {connection.status === 'connected' 
                        ? Math.max(0, 100 - connection.latency / 3).toFixed(0)
                        : '0'
                      }%
                    </span>
                  </div>
                  <Progress 
                    value={connection.status === 'connected' ? Math.max(0, 100 - connection.latency / 3) : 0}
                    color={
                      connection.status === 'connected' && connection.latency < 100 ? 'success' :
                      connection.status === 'connected' && connection.latency < 200 ? 'warning' : 'danger'
                    }
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Network Statistics */}
        <div className="space-y-6">
          {/* Message Flow */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Message Flow</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Messages Sent</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="font-semibold">2,847</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Messages Received</span>
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <span className="font-semibold">3,156</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Failed Messages</span>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-danger" />
                  <span className="font-semibold">12</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Size</span>
                <span className="font-semibold">2.4 KB</span>
              </div>
            </CardBody>
          </Card>

          {/* Connection Health */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-success" />
                <h3 className="text-lg font-semibold">Connection Health</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Network Stability</span>
                  <span className="text-sm font-semibold">94.2%</span>
                </div>
                <Progress value={94.2} color="success" size="sm" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Peer Diversity</span>
                  <span className="text-sm font-semibold">87.1%</span>
                </div>
                <Progress value={87.1} color="primary" size="sm" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Redundancy Level</span>
                  <span className="text-sm font-semibold">76.8%</span>
                </div>
                <Progress value={76.8} color="warning" size="sm" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Security Score</span>
                  <span className="text-sm font-semibold">91.5%</span>
                </div>
                <Progress value={91.5} color="success" size="sm" />
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button 
                variant="flat" 
                color="primary" 
                className="w-full"
                startContent={<Wifi className="h-4 w-4" />}
              >
                Force Reconnect All
              </Button>
              <Button 
                variant="flat" 
                color="warning" 
                className="w-full"
                startContent={<WifiOff className="h-4 w-4" />}
              >
                Disconnect Inactive
              </Button>
              <Button 
                variant="flat" 
                color="secondary" 
                className="w-full"
                startContent={<Settings className="h-4 w-4" />}
              >
                Optimize Connections
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}