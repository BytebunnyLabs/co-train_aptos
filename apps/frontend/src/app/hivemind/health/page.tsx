'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Button } from '@heroui/react';
import { Progress } from '@heroui/react';
import { Tabs, Tab } from '@heroui/react';
import { 
  Activity, 
  Wifi, 
  Cpu, 
  HardDrive, 
  Zap, 
  Globe, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Shield,
  Server,
  Users
} from 'lucide-react';

interface NetworkMetrics {
  totalNodes: number;
  activeNodes: number;
  networkLatency: number;
  totalBandwidth: number;
  totalComputePower: number;
  networkUptime: number;
  consensusHealth: number;
  blockchainSync: number;
}

interface NodeHealth {
  nodeId: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  uptime: number;
  lastHeartbeat: string;
  syncStatus: number;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  source: string;
  resolved: boolean;
}

export default function NetworkHealthPage() {
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics | null>(null);
  const [nodeHealth, setNodeHealth] = useState<NodeHealth[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 15000); // 15秒更新一次
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const [metricsResponse, nodesResponse, alertsResponse] = await Promise.all([
        fetch('/api/hivemind/health/metrics'),
        fetch('/api/hivemind/health/nodes'),
        fetch('/api/hivemind/health/alerts'),
      ]);

      const [metrics, nodes, alerts] = await Promise.all([
        metricsResponse.json(),
        nodesResponse.json(),
        alertsResponse.json(),
      ]);

      setNetworkMetrics(metrics);
      setNodeHealth(nodes);
      setSystemAlerts(alerts);
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      setIsLoading(false);
    }
  };

  const getHealthStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return { color: 'danger', text: 'Critical' };
    if (value >= thresholds.warning) return { color: 'warning', text: 'Warning' };
    return { color: 'success', text: 'Healthy' };
  };

  const getNetworkHealth = () => {
    if (!networkMetrics) return { score: 0, status: 'Unknown' };
    
    const activeRatio = networkMetrics.activeNodes / networkMetrics.totalNodes;
    const latencyScore = Math.max(0, 100 - networkMetrics.networkLatency);
    const uptimeScore = networkMetrics.networkUptime;
    const consensusScore = networkMetrics.consensusHealth;
    
    const overallScore = (activeRatio * 100 * 0.3) + (latencyScore * 0.2) + (uptimeScore * 0.3) + (consensusScore * 0.2);
    
    if (overallScore >= 90) return { score: overallScore, status: 'Excellent' };
    if (overallScore >= 75) return { score: overallScore, status: 'Good' };
    if (overallScore >= 60) return { score: overallScore, status: 'Fair' };
    return { score: overallScore, status: 'Poor' };
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading network health data...</p>
          </div>
        </div>
      </div>
    );
  }

  const networkHealth = getNetworkHealth();

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Network Health Monitor</h1>
          <p className="text-default-400">Real-time P2P network status and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-default-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button 
            variant="bordered" 
            size="sm"
            onClick={fetchHealthData}
            startContent={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card className="border-2 border-primary/20">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {Math.round(networkHealth.score)}
              </div>
              <div className="text-xl font-semibold mb-1">Overall Health Score</div>
              <Chip 
                color={networkHealth.score >= 75 ? 'success' : networkHealth.score >= 60 ? 'warning' : 'danger'}
                variant="flat"
                size="lg"
              >
                {networkHealth.status}
              </Chip>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Network Activity</span>
                <Progress 
                  value={networkMetrics ? (networkMetrics.activeNodes / networkMetrics.totalNodes) * 100 : 0} 
                  color="primary"
                  className="flex-1 mx-3"
                />
                <span className="text-sm font-medium">
                  {networkMetrics ? Math.round((networkMetrics.activeNodes / networkMetrics.totalNodes) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Network Uptime</span>
                <Progress 
                  value={networkMetrics?.networkUptime || 0} 
                  color="success"
                  className="flex-1 mx-3"
                />
                <span className="text-sm font-medium">{networkMetrics?.networkUptime || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Consensus Health</span>
                <Progress 
                  value={networkMetrics?.consensusHealth || 0} 
                  color="warning"
                  className="flex-1 mx-3"
                />
                <span className="text-sm font-medium">{networkMetrics?.consensusHealth || 0}%</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Nodes</h3>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{networkMetrics?.activeNodes || 0}</div>
            <p className="text-xs text-default-400">
              of {networkMetrics?.totalNodes || 0} total
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Network Latency</h3>
            <Wifi className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{networkMetrics?.networkLatency || 0}ms</div>
            <p className="text-xs text-default-400">Avg response time</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Bandwidth</h3>
            <Globe className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {formatBytes(networkMetrics?.totalBandwidth || 0)}
            </div>
            <p className="text-xs text-default-400">Combined capacity</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Compute Power</h3>
            <Cpu className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {(networkMetrics?.totalComputePower || 0).toLocaleString()}
            </div>
            <p className="text-xs text-default-400">Total FLOPS</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Sync Status</h3>
            <Shield className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{networkMetrics?.blockchainSync || 0}%</div>
            <p className="text-xs text-default-400">Blockchain sync</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Alerts</h3>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {systemAlerts.filter(alert => !alert.resolved).length}
            </div>
            <p className="text-xs text-default-400">Unresolved issues</p>
          </CardBody>
        </Card>
      </div>

      {/* Detailed Monitoring */}
      <Tabs aria-label="Health Monitoring Tabs" className="space-y-4">
        <Tab key="nodes" title="Node Health">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Individual Node Health</h3>
                <p className="text-default-400">
                  Detailed performance metrics for each network node
                </p>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {nodeHealth.map((node) => (
                    <div
                      key={node.nodeId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className={`w-3 h-3 rounded-full ${
                            node.status === 'healthy' ? 'bg-green-500' :
                            node.status === 'warning' ? 'bg-yellow-500' :
                            node.status === 'critical' ? 'bg-red-500' : 'bg-gray-500'
                          }`} />
                          {node.status === 'healthy' && (
                            <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                          )}
                        </div>
                        
                        <div>
                          <div className="font-medium">{node.nodeId}</div>
                          <div className="text-sm text-default-400">
                            Last seen: {new Date(node.lastHeartbeat).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-6 flex-1 mx-8">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Cpu className="h-3 w-3" />
                            <span className="text-sm font-medium">{node.cpuUsage}%</span>
                          </div>
                          <Progress value={node.cpuUsage} color="primary" size="sm" />
                          <div className="text-xs text-default-400 mt-1">CPU</div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <HardDrive className="h-3 w-3" />
                            <span className="text-sm font-medium">{node.memoryUsage}%</span>
                          </div>
                          <Progress value={node.memoryUsage} color="secondary" size="sm" />
                          <div className="text-xs text-default-400 mt-1">Memory</div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Zap className="h-3 w-3" />
                            <span className="text-sm font-medium">{node.networkLatency}ms</span>
                          </div>
                          <Progress 
                            value={Math.max(0, 100 - node.networkLatency / 10)} 
                            color="warning" 
                            size="sm" 
                          />
                          <div className="text-xs text-default-400 mt-1">Latency</div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-sm font-medium">{formatUptime(node.uptime)}</span>
                          </div>
                          <div className="text-xs text-default-400 mt-1">Uptime</div>
                        </div>
                      </div>

                      <Chip
                        color={
                          node.status === 'healthy' ? 'success' :
                          node.status === 'warning' ? 'warning' :
                          node.status === 'critical' ? 'danger' : 'default'
                        }
                        variant="flat"
                        size="sm"
                      >
                        {node.status.toUpperCase()}
                      </Chip>
                    </div>
                  ))}

                  {nodeHealth.length === 0 && (
                    <div className="text-center py-8 text-default-400">
                      <Server className="h-8 w-8 mx-auto mb-2" />
                      <p>No nodes detected</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="alerts" title="System Alerts">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">System Alerts & Notifications</h3>
                <p className="text-default-400">
                  Network issues, warnings, and status updates
                </p>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {systemAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${
                        alert.resolved ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                          {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                          {alert.type === 'info' && <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />}
                          
                          <div className="flex-1">
                            <div className="font-medium">{alert.message}</div>
                            <div className="text-sm text-default-400 mt-1">
                              Source: {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <Chip
                          color={alert.resolved ? 'success' : 
                                alert.type === 'error' ? 'danger' :
                                alert.type === 'warning' ? 'warning' : 'primary'}
                          variant="flat"
                          size="sm"
                        >
                          {alert.resolved ? 'Resolved' : alert.type.toUpperCase()}
                        </Chip>
                      </div>
                    </div>
                  ))}

                  {systemAlerts.length === 0 && (
                    <div className="text-center py-8 text-default-400">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>All systems operating normally</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="performance" title="Performance">
          <div className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Network Performance Trends</h3>
                </CardHeader>
                <CardBody>
                  <div className="h-64 flex items-center justify-center text-default-400">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                      <p>Performance charts will be displayed here</p>
                      <p className="text-sm">Latency, throughput, and node activity over time</p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Resource Utilization</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Network CPU Utilization</span>
                        <span>68%</span>
                      </div>
                      <Progress value={68} color="primary" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Memory Usage</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} color="secondary" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Bandwidth Utilization</span>
                        <span>82%</span>
                      </div>
                      <Progress value={82} color="warning" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Storage Usage</span>
                        <span>34%</span>
                      </div>
                      <Progress value={34} color="success" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}