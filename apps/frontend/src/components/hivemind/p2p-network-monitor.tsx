'use client';

import React, { useState, useEffect } from 'react';
import { Button, Chip, Card, CardBody, CardHeader, Tabs, Tab, Progress, ScrollShadow } from '@heroui/react';
import { 
  Activity, 
  Users, 
  Cpu, 
  Wifi, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Network,
  Zap
} from 'lucide-react';

interface P2PNode {
  nodeId: string;
  address: string;
  publicKey: string;
  computeCapacity: number;
  bandwidth: number;
  reputationScore: number;
  isActive: boolean;
  lastSeen: string;
}

interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  totalComputePower: number;
  networkHealth: number;
}

interface ContributionMetrics {
  nodeId: string;
  totalScore: number;
  contributionCount: number;
}

export function P2PNetworkMonitor() {
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalNodes: 0,
    activeNodes: 0,
    totalComputePower: 0,
    networkHealth: 0,
  });
  
  const [nodes, setNodes] = useState<P2PNode[]>([]);
  const [topContributors, setTopContributors] = useState<ContributionMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch network stats
      const statsResponse = await fetch('/api/hivemind/network/stats');
      const stats = await statsResponse.json();
      setNetworkStats(stats);

      // Fetch active nodes
      const nodesResponse = await fetch('/api/hivemind/nodes');
      const nodesData = await nodesResponse.json();
      setNodes(nodesData);

      // Fetch top contributors
      const contributorsResponse = await fetch('/api/hivemind/contributors/top?limit=10');
      const contributorsData = await contributorsResponse.json();
      setTopContributors(contributorsData);

      setError(null);
    } catch (err) {
      setError('Failed to fetch network data');
      console.error('Error fetching network data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getNodeStatusColor = (node: P2PNode) => {
    if (!node.isActive) return 'danger';
    if (node.reputationScore >= 80) return 'success';
    if (node.reputationScore >= 60) return 'primary';
    return 'warning';
  };

  const getNodeStatusText = (node: P2PNode) => {
    if (!node.isActive) return 'Offline';
    if (node.reputationScore >= 80) return 'Excellent';
    if (node.reputationScore >= 60) return 'Good';
    return 'Fair';
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (isLoading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading P2P network data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Nodes</h3>
            <Users className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{networkStats.totalNodes}</div>
            <p className="text-xs text-default-400">
              {networkStats.activeNodes} active
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Network Health</h3>
            <Activity className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{networkStats.networkHealth.toFixed(1)}%</div>
            <Progress value={networkStats.networkHealth} className="mt-2" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Compute Power</h3>
            <Cpu className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{networkStats.totalComputePower.toLocaleString()}</div>
            <p className="text-xs text-default-400">Total units</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Network Status</h3>
            <Network className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Operational</span>
            </div>
            <p className="text-xs text-default-400 mt-1">
              All systems normal
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultSelectedKey="nodes" className="space-y-4">
        <div className="flex space-x-1 mb-4">
          <Tab key="nodes" title="Active Nodes" />
          <Tab key="contributors" title="Top Contributors" />
          <Tab key="metrics" title="Metrics" />
        </div>

        <div key="nodes" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">P2P Network Nodes</h3>
              <p className="text-sm text-default-400">
                Real-time status of all nodes in the Hivemind network
              </p>
            </CardHeader>
            <CardBody>
              <ScrollShadow className="h-96">
                <div className="space-y-4">
                  {nodes.map((node) => (
                    <div
                      key={node.nodeId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className={`w-3 h-3 rounded-full ${
                            node.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          {node.isActive && (
                            <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                          )}
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm">{node.nodeId}</div>
                          <div className="text-xs text-default-400">
                          {node.address.slice(0, 8)}...{node.address.slice(-6)}
                        </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Cpu className="h-3 w-3" />
                            <span className="text-xs">{node.computeCapacity}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Wifi className="h-3 w-3" />
                            <span className="text-xs">{node.bandwidth} MB/s</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <Chip variant="flat" color={getNodeStatusColor(node)}>
                          {getNodeStatusText(node)}
                        </Chip>
                        <div className="text-xs text-default-400 mt-1">
                          Rep: {node.reputationScore}
                        </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center space-x-1 text-xs text-default-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatLastSeen(node.lastSeen)}</span>
                        </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollShadow>

              {nodes.length === 0 && (
                <div className="text-center py-8 text-default-400">
                  <Network className="h-8 w-8 mx-auto mb-2" />
                  <p>No active nodes found</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div key="contributors" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Top Contributors</h3>
              <p className="text-sm text-default-400">
                Nodes with the highest contribution scores
              </p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div
                    key={contributor.nodeId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{contributor.nodeId}</div>
                        <div className="text-sm text-default-400">
                          {contributor.contributionCount} contributions
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-bold">{contributor.totalScore.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-default-400">Total Score</div>
                    </div>
                  </div>
                ))}
              </div>

              {topContributors.length === 0 && (
                <div className="text-center py-8 text-default-400">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                  <p>No contributions recorded yet</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div key="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Network Metrics</h3>
              <p className="text-sm text-default-400">
                Performance and health metrics for the P2P network
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Nodes Ratio</span>
                    <span className="text-sm">
                      {networkStats.totalNodes > 0 
                        ? ((networkStats.activeNodes / networkStats.totalNodes) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={networkStats.totalNodes > 0 
                      ? (networkStats.activeNodes / networkStats.totalNodes) * 100 
                      : 0} 
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network Health</span>
                    <span className="text-sm">{networkStats.networkHealth.toFixed(1)}%</span>
                  </div>
                  <Progress value={networkStats.networkHealth} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Compute Power</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {networkStats.totalComputePower.toLocaleString()} units
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Connected Nodes</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {networkStats.activeNodes} / {networkStats.totalNodes}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </Tabs>

      {error && (
        <Card className="border-danger">
          <CardBody className="pt-6">
            <div className="flex items-center space-x-2 text-danger">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onPress={fetchNetworkData} isDisabled={isLoading} variant="solid">
          <Activity className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
    </div>
  );
}