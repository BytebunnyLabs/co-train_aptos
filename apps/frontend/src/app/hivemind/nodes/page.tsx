'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/cotrain/ui/card';
import { Badge } from '@/components/cotrain/ui/badge';
import { Button } from '@/components/cotrain/ui/button';
import { Input } from '@/components/cotrain/ui/input';
import { Label } from '@/components/cotrain/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cotrain/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Activity, 
  Cpu, 
  Wifi, 
  CheckCircle, 
  AlertCircle,
  Clock,
  TrendingUp
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
  status: 'ACTIVE' | 'INACTIVE' | 'QUARANTINED' | 'MAINTENANCE';
  performanceMetrics?: {
    avgComputeTime?: number;
    avgGradientQuality?: number;
    avgUptimeRatio?: number;
    totalSessions?: number;
  };
}

export default function NodesPage() {
  const [nodes, setNodes] = useState<P2PNode[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<P2PNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterNodes();
  }, [nodes, searchTerm, statusFilter]);

  const fetchNodes = async () => {
    try {
      const response = await fetch('/api/hivemind/nodes');
      const data = await response.json();
      setNodes(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
      setIsLoading(false);
    }
  };

  const filterNodes = () => {
    let filtered = nodes;

    if (searchTerm) {
      filtered = filtered.filter(node => 
        node.nodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(node => node.status === statusFilter);
    }

    setFilteredNodes(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'INACTIVE': return 'secondary';
      case 'QUARANTINED': return 'destructive';
      case 'MAINTENANCE': return 'outline';
      default: return 'secondary';
    }
  };

  const getReputationColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">P2P Nodes</h1>
          <p className="text-muted-foreground">Manage and monitor network nodes</p>
        </div>
        <Button onClick={() => setShowRegisterForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Register Node
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Nodes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by node ID or address..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Filter by Status</Label>
              <select
                id="status"
                className="w-full p-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="QUARANTINED">Quarantined</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Node Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nodes.filter(n => n.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Reputation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nodes.length > 0 
                ? Math.round(nodes.reduce((sum, n) => sum + n.reputationScore, 0) / nodes.length)
                : 0
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Compute</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nodes.reduce((sum, n) => sum + n.computeCapacity, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nodes List */}
      <Card>
        <CardHeader>
          <CardTitle>Network Nodes</CardTitle>
          <CardDescription>
            All registered nodes in the P2P network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading nodes...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNodes.map((node) => (
                <div
                  key={node.nodeId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
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
                      <div className="font-medium">{node.nodeId}</div>
                      <div className="text-sm text-muted-foreground">
                        {node.address.slice(0, 12)}...{node.address.slice(-8)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Cpu className="h-3 w-3" />
                        <span className="text-sm">{node.computeCapacity}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Compute</div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Wifi className="h-3 w-3" />
                        <span className="text-sm">{node.bandwidth} MB/s</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Bandwidth</div>
                    </div>

                    <div className="text-center">
                      <div className={`text-sm font-medium ${getReputationColor(node.reputationScore)}`}>
                        {node.reputationScore}
                      </div>
                      <div className="text-xs text-muted-foreground">Reputation</div>
                    </div>

                    <div className="text-center">
                      <Badge variant={getStatusColor(node.status)}>
                        {node.status}
                      </Badge>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatLastSeen(node.lastSeen)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredNodes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>No nodes found matching your criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register Node Form Modal */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Register New Node</CardTitle>
              <CardDescription>
                Add a new P2P node to the network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nodeId">Node ID</Label>
                <Input id="nodeId" placeholder="Enter unique node identifier" />
              </div>
              <div>
                <Label htmlFor="publicKey">Public Key</Label>
                <Input id="publicKey" placeholder="Enter node public key" />
              </div>
              <div>
                <Label htmlFor="computeCapacity">Compute Capacity</Label>
                <Input id="computeCapacity" type="number" placeholder="1000" />
              </div>
              <div>
                <Label htmlFor="bandwidth">Bandwidth (MB/s)</Label>
                <Input id="bandwidth" type="number" placeholder="100" />
              </div>
              <div className="flex space-x-2">
                <Button className="flex-1">Register Node</Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRegisterForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}