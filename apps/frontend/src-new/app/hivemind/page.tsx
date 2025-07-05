'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Progress } from '@heroui/react';
import { Tabs, Tab } from '@heroui/react';
import { Switch } from '@heroui/react';
import { 
  Network, 
  Activity, 
  Users, 
  Cpu, 
  Zap, 
  Globe,
  Signal,
  Clock,
  TrendingUp,
  Shield,
  Database,
  Settings,
  Play,
  Pause,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useHivemindStore, useUIStore } from '@/lib/stores';
import { NetworkTopology } from '@/components/hivemind/network-topology';
import { NodeManagement } from '@/components/hivemind/node-management';
import { SystemLogs } from '@/components/hivemind/system-logs';
import { P2PMonitor } from '@/components/hivemind/p2p-monitor';

export default function HivemindPage() {
  const { setPageTitle, setPageDescription, setBreadcrumbs } = useUIStore();
  const { 
    isConnected,
    nodeId,
    stats,
    myNode,
    connect,
    disconnect,
    connectionLoading,
    error,
    lastUpdate,
    isStreaming,
    startTraining,
    stopTraining
  } = useHivemindStore();

  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    setPageTitle('Hivemind Network');
    setPageDescription('Monitor and manage your participation in the distributed AI training network');
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Hivemind', href: '/hivemind' }
    ]);
  }, [setPageTitle, setPageDescription, setBreadcrumbs]);

  // Auto refresh simulation
  useEffect(() => {
    if (!autoRefresh || !isConnected) return;

    const interval = setInterval(() => {
      // TODO: Refresh network data
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, isConnected]);

  const getNetworkHealthColor = (health: number) => {
    if (health >= 90) return 'success';
    if (health >= 70) return 'warning';
    return 'danger';
  };

  const getConnectionStatusIcon = () => {
    if (connectionLoading) return <RefreshCw className="h-5 w-5 animate-spin" />;
    if (isConnected) return <CheckCircle className="h-5 w-5 text-success" />;
    return <XCircle className="h-5 w-5 text-danger" />;
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect to network:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect from network:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Hivemind Network</h1>
          <p className="text-foreground-600 mt-1">
            Distributed AI training network monitoring and control
          </p>
        </div>

        {/* Connection Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-foreground-600">Auto-refresh:</span>
            <Switch 
              size="sm" 
              isSelected={autoRefresh}
              onValueChange={setAutoRefresh}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getConnectionStatusIcon()}
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {nodeId && (
                <Chip size="sm" variant="flat" color="primary">
                  {nodeId.slice(-8)}
                </Chip>
              )}
            </div>
            
            <Button
              color={isConnected ? "danger" : "primary"}
              variant={isConnected ? "flat" : "solid"}
              size="sm"
              startContent={isConnected ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
              onClick={isConnected ? handleDisconnect : handleConnect}
              isLoading={connectionLoading}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-l-4 border-l-danger bg-danger/5">
          <CardBody>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-danger" />
              <div>
                <p className="font-medium text-danger">Network Error</p>
                <p className="text-sm text-foreground-600">{error}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Network className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.totalNodes.toLocaleString()}</p>
            <p className="text-sm text-foreground-600">Total Nodes</p>
            <div className="mt-2">
              <p className="text-xs text-success">
                {stats.activeNodes} active
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-success/10">
                <Activity className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.networkHealth.toFixed(1)}%</p>
            <p className="text-sm text-foreground-600">Network Health</p>
            <div className="mt-2">
              <Progress 
                value={stats.networkHealth} 
                color={getNetworkHealthColor(stats.networkHealth)} 
                size="sm"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-warning/10">
                <Cpu className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.totalComputeHours.toLocaleString()}</p>
            <p className="text-sm text-foreground-600">Compute Hours</p>
            <div className="mt-2">
              <p className="text-xs text-warning">
                {stats.trainingNodes} nodes training
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-secondary/10">
                <Signal className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.avgLatency.toFixed(0)}ms</p>
            <p className="text-sm text-foreground-600">Avg Latency</p>
            <div className="mt-2">
              <p className="text-xs text-secondary">
                {(stats.totalBandwidth / 1000).toFixed(1)}GB/s total
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* My Node Status */}
      {isConnected && myNode && (
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">My Node Status</h3>
                  <p className="text-sm text-foreground-600">
                    Node ID: {nodeId}
                  </p>
                </div>
              </div>
              <Chip 
                color={
                  myNode.status === 'training' ? 'success' :
                  myNode.status === 'online' ? 'primary' : 'default'
                } 
                variant="flat"
              >
                {myNode.status.toUpperCase()}
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-lg font-semibold">{myNode.performance.uptime.toFixed(1)}%</p>
                <p className="text-xs text-foreground-600">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{myNode.performance.reliability.toFixed(1)}%</p>
                <p className="text-xs text-foreground-600">Reliability</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{myNode.reputation}</p>
                <p className="text-xs text-foreground-600">Reputation</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{myNode.contributions}</p>
                <p className="text-xs text-foreground-600">Contributions</p>
              </div>
            </div>
            
            <div className="flex justify-center space-x-3">
              {myNode.status === 'training' ? (
                <Button
                  color="warning"
                  variant="flat"
                  startContent={<Pause className="h-4 w-4" />}
                  onClick={stopTraining}
                >
                  Stop Training
                </Button>
              ) : (
                <Button
                  color="success"
                  variant="flat"
                  startContent={<Play className="h-4 w-4" />}
                  onClick={startTraining}
                >
                  Start Training
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs aria-label="Hivemind monitoring" size="lg" color="primary">
        <Tab 
          key="topology" 
          title={
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Network Topology</span>
            </div>
          }
        >
          <div className="mt-6">
            <NetworkTopology />
          </div>
        </Tab>

        <Tab 
          key="nodes" 
          title={
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Node Management</span>
            </div>
          }
        >
          <div className="mt-6">
            <NodeManagement />
          </div>
        </Tab>

        <Tab 
          key="p2p" 
          title={
            <div className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span>P2P Monitor</span>
            </div>
          }
        >
          <div className="mt-6">
            <P2PMonitor />
          </div>
        </Tab>

        <Tab 
          key="logs" 
          title={
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>System Logs</span>
            </div>
          }
        >
          <div className="mt-6">
            <SystemLogs />
          </div>
        </Tab>
      </Tabs>

      {/* Last Update Info */}
      {lastUpdate && (
        <div className="text-center">
          <p className="text-xs text-foreground-500">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            {isStreaming && (
              <span className="ml-2 inline-flex items-center">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse mr-1"></div>
                Live
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}