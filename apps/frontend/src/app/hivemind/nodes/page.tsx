'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Button } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { Tabs, Tab } from '@heroui/react';
import { Progress } from '@heroui/react';
import { Badge } from '@heroui/react';
import { Switch } from '@heroui/react';
import { Tooltip } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
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
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  HardDrive,
  Globe,
  Eye,
  BarChart3,
  Star,
  Medal,
  Target,
  Gauge,
  RefreshCw
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
  performanceMetrics: {
    avgComputeTime: number;
    avgGradientQuality: number;
    avgUptimeRatio: number;
    totalSessions: number;
    weeklyEarnings: number;
    totalEarnings: number;
    efficiency: number;
    responseTime: number;
  };
  rankingData: {
    currentRank: number;
    previousRank: number;
    rankChange: number;
    category: 'elite' | 'performer' | 'standard' | 'newcomer';
  };
  resourceUsage: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
  };
}

export default function NodesPage() {
  const [nodes, setNodes] = useState<P2PNode[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<P2PNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('reputation');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [selectedNode, setSelectedNode] = useState<P2PNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen: isRegisterOpen, onOpen: onRegisterOpen, onOpenChange: onRegisterOpenChange } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAndSortNodes();
  }, [nodes, searchTerm, statusFilter, categoryFilter, showOnlyActive, sortBy, sortOrder]);

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

  const filterAndSortNodes = () => {
    let filtered = nodes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(node => 
        node.nodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(node => node.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(node => node.rankingData.category === categoryFilter);
    }

    // Active only filter
    if (showOnlyActive) {
      filtered = filtered.filter(node => node.isActive);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'reputation':
          aValue = a.reputationScore;
          bValue = b.reputationScore;
          break;
        case 'earnings':
          aValue = a.performanceMetrics.totalEarnings;
          bValue = b.performanceMetrics.totalEarnings;
          break;
        case 'efficiency':
          aValue = a.performanceMetrics.efficiency;
          bValue = b.performanceMetrics.efficiency;
          break;
        case 'sessions':
          aValue = a.performanceMetrics.totalSessions;
          bValue = b.performanceMetrics.totalSessions;
          break;
        case 'compute':
          aValue = a.computeCapacity;
          bValue = b.computeCapacity;
          break;
        case 'bandwidth':
          aValue = a.bandwidth;
          bValue = b.bandwidth;
          break;
        case 'rank':
          aValue = a.rankingData.currentRank;
          bValue = b.rankingData.currentRank;
          // For rank, lower is better, so reverse the logic
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        default:
          aValue = a.reputationScore;
          bValue = b.reputationScore;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredNodes(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: 'success' as const, variant: 'flat' as const };
      case 'INACTIVE': return { color: 'default' as const, variant: 'flat' as const };
      case 'QUARANTINED': return { color: 'danger' as const, variant: 'flat' as const };
      case 'MAINTENANCE': return { color: 'warning' as const, variant: 'bordered' as const };
      default: return { color: 'default' as const, variant: 'flat' as const };
    }
  };

  const getReputationColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'elite':
        return { color: 'warning', icon: <Medal className="h-4 w-4" />, label: 'Elite' };
      case 'performer':
        return { color: 'secondary', icon: <Award className="h-4 w-4" />, label: 'Performer' };
      case 'standard':
        return { color: 'primary', icon: <Target className="h-4 w-4" />, label: 'Standard' };
      case 'newcomer':
        return { color: 'default', icon: <Star className="h-4 w-4" />, label: 'Newcomer' };
      default:
        return { color: 'default', icon: <Star className="h-4 w-4" />, label: 'Unknown' };
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <span className="w-3 h-3 text-gray-400">—</span>;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const openNodeDetails = (node: P2PNode) => {
    setSelectedNode(node);
    onDetailOpen();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Node Performance Leaderboard</h1>
          <p className="text-default-400">Real-time rankings and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="bordered" size="sm" startContent={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          <Button color="primary" onPress={onRegisterOpen} startContent={<Plus className="h-4 w-4" />}>
            Register Node
          </Button>
        </div>
      </div>

      {/* Top Performers Banner */}
      {filteredNodes.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((index) => {
                const node = filteredNodes[index];
                if (!node) return null;
                
                const categoryInfo = getCategoryInfo(node.rankingData.category);
                return (
                  <div key={node.nodeId} className="flex items-center space-x-4">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        'bg-amber-600 text-white'
                      }`}>
                        <span className="font-bold">#{index + 1}</span>
                      </div>
                      {index === 0 && <Medal className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg">{node.nodeId}</div>
                      <div className="flex items-center space-x-2 text-sm text-default-400">
                        <Chip
                          color={categoryInfo.color as any}
                          variant="flat"
                          size="sm"
                          startContent={categoryInfo.icon}
                        >
                          {categoryInfo.label}
                        </Chip>
                        <span>{node.reputationScore}% reputation</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(node.performanceMetrics.totalEarnings)}
                      </div>
                      <div className="text-xs text-default-400">Total Earned</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search nodes..."
                startContent={<Search className="h-4 w-4 text-default-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
              />
            </div>
            
            <div>
              <Select
                selectedKeys={sortBy ? [sortBy] : []}
                onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                placeholder="Sort by"
                size="sm"
              >
                <SelectItem key="reputation">Reputation</SelectItem>
                <SelectItem key="earnings">Earnings</SelectItem>
                <SelectItem key="efficiency">Efficiency</SelectItem>
                <SelectItem key="sessions">Sessions</SelectItem>
                <SelectItem key="compute">Compute Power</SelectItem>
                <SelectItem key="rank">Rank</SelectItem>
              </Select>
            </div>

            <div>
              <Select
                selectedKeys={categoryFilter !== 'ALL' ? [categoryFilter] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setCategoryFilter(selected || 'ALL');
                }}
                placeholder="Category"
                size="sm"
              >
                <SelectItem key="ALL">All Categories</SelectItem>
                <SelectItem key="elite">Elite</SelectItem>
                <SelectItem key="performer">Performer</SelectItem>
                <SelectItem key="standard">Standard</SelectItem>
                <SelectItem key="newcomer">Newcomer</SelectItem>
              </Select>
            </div>

            <div>
              <Select
                selectedKeys={statusFilter !== 'ALL' ? [statusFilter] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setStatusFilter(selected || 'ALL');
                }}
                placeholder="Status"
                size="sm"
              >
                <SelectItem key="ALL">All Status</SelectItem>
                <SelectItem key="ACTIVE">Active</SelectItem>
                <SelectItem key="INACTIVE">Inactive</SelectItem>
                <SelectItem key="QUARANTINED">Quarantined</SelectItem>
                <SelectItem key="MAINTENANCE">Maintenance</SelectItem>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                size="sm"
                isSelected={showOnlyActive}
                onValueChange={setShowOnlyActive}
              />
              <span className="text-sm whitespace-nowrap">Active Only</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Network Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Nodes</h3>
            <Activity className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{nodes.length}</div>
            <p className="text-xs text-default-400">Registered</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Nodes</h3>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-green-600">
              {nodes.filter(n => n.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-default-400">
              {nodes.length > 0 ? Math.round((nodes.filter(n => n.status === 'ACTIVE').length / nodes.length) * 100) : 0}% online
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Avg Reputation</h3>
            <TrendingUp className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {nodes.length > 0 
                ? Math.round(nodes.reduce((sum, n) => sum + n.reputationScore, 0) / nodes.length)
                : 0
              }%
            </div>
            <p className="text-xs text-default-400">Network score</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Compute</h3>
            <Cpu className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {(nodes.reduce((sum, n) => sum + n.computeCapacity, 0) / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-default-400">FLOPS capacity</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Earnings</h3>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(nodes.reduce((sum, n) => sum + (n.performanceMetrics?.totalEarnings || 0), 0))}
            </div>
            <p className="text-xs text-default-400">Distributed</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Elite Nodes</h3>
            <Medal className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-yellow-600">
              {nodes.filter(n => n.rankingData?.category === 'elite').length}
            </div>
            <p className="text-xs text-default-400">Top performers</p>
          </CardBody>
        </Card>
      </div>

      {/* Advanced Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div>
              <h3 className="text-lg font-semibold">Performance Leaderboard</h3>
              <p className="text-default-400">
                Ranked by {sortBy === 'rank' ? 'overall ranking' : sortBy} • {filteredNodes.length} nodes shown
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="bordered" 
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                startContent={sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              >
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading performance data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNodes.map((node, index) => {
                const categoryInfo = getCategoryInfo(node.rankingData?.category || 'standard');
                const globalRank = sortBy === 'rank' ? node.rankingData?.currentRank || index + 1 : index + 1;
                
                return (
                  <div
                    key={node.nodeId}
                    className="group relative p-4 border rounded-lg hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => openNodeDetails(node)}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank & Status */}
                      <div className="flex flex-col items-center space-y-1 min-w-[60px]">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          globalRank <= 3 
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' 
                            : globalRank <= 10
                            ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                            : 'bg-gradient-to-br from-primary/20 to-primary/30 text-primary'
                        }`}>
                          #{globalRank}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {getRankChangeIcon(node.rankingData?.rankChange || 0)}
                          {node.rankingData?.rankChange !== undefined && (
                            <span className="text-xs text-default-400">
                              {Math.abs(node.rankingData.rankChange)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Node Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${
                              node.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            {node.isActive && (
                              <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                            )}
                          </div>
                          
                          <div className="font-bold text-lg">{node.nodeId}</div>
                          
                          <Chip
                            color={categoryInfo.color as any}
                            variant="flat"
                            size="sm"
                            startContent={categoryInfo.icon}
                          >
                            {categoryInfo.label}
                          </Chip>
                          
                          <Chip {...getStatusColor(node.status)} size="sm">
                            {node.status}
                          </Chip>
                        </div>

                        <div className="text-sm text-default-400 mb-3">
                          {node.address.slice(0, 16)}...{node.address.slice(-12)} • Last seen: {formatLastSeen(node.lastSeen)}
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-sm font-bold">{node.reputationScore}%</span>
                            </div>
                            <div className="text-xs text-default-400">Reputation</div>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <Award className="h-3 w-3 text-green-500" />
                              <span className="text-sm font-bold">
                                {formatCurrency(node.performanceMetrics?.totalEarnings || 0)}
                              </span>
                            </div>
                            <div className="text-xs text-default-400">Total Earned</div>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <Gauge className="h-3 w-3 text-blue-500" />
                              <span className="text-sm font-bold">
                                {node.performanceMetrics?.efficiency || 0}%
                              </span>
                            </div>
                            <div className="text-xs text-default-400">Efficiency</div>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <BarChart3 className="h-3 w-3 text-purple-500" />
                              <span className="text-sm font-bold">
                                {node.performanceMetrics?.totalSessions || 0}
                              </span>
                            </div>
                            <div className="text-xs text-default-400">Sessions</div>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <Cpu className="h-3 w-3 text-orange-500" />
                              <span className="text-sm font-bold">{node.computeCapacity}</span>
                            </div>
                            <div className="text-xs text-default-400">Compute</div>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <Wifi className="h-3 w-3 text-indigo-500" />
                              <span className="text-sm font-bold">{node.bandwidth}</span>
                            </div>
                            <div className="text-xs text-default-400">Bandwidth</div>
                          </div>
                        </div>

                        {/* Resource Usage Progress Bars */}
                        {node.resourceUsage && (
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>CPU</span>
                                <span>{node.resourceUsage.cpuUsage}%</span>
                              </div>
                              <Progress value={node.resourceUsage.cpuUsage} color="primary" size="sm" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Memory</span>
                                <span>{node.resourceUsage.memoryUsage}%</span>
                              </div>
                              <Progress value={node.resourceUsage.memoryUsage} color="secondary" size="sm" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Disk</span>
                                <span>{node.resourceUsage.diskUsage}%</span>
                              </div>
                              <Progress value={node.resourceUsage.diskUsage} color="warning" size="sm" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Network</span>
                                <span>{node.resourceUsage.networkUsage}%</span>
                              </div>
                              <Progress value={node.resourceUsage.networkUsage} color="success" size="sm" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-center space-y-2">
                        <Tooltip content="View Details">
                          <Button 
                            variant="bordered" 
                            size="sm" 
                            isIconOnly
                            onClick={(e) => {
                              e.stopPropagation();
                              openNodeDetails(node);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        
                        {globalRank <= 10 && (
                          <Badge color="warning" variant="flat" size="sm">
                            Top 10
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredNodes.length === 0 && (
                <div className="text-center py-8 text-default-400">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>No nodes found matching your criteria</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Register Node Modal */}
      <Modal 
        isOpen={isRegisterOpen} 
        onOpenChange={onRegisterOpenChange}
        size="lg"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Register New Node</h3>
                    <p className="text-default-400 text-sm">Add a new P2P node to the network</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Node ID</label>
                    <Input 
                      placeholder="Enter unique node identifier"
                      variant="bordered"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Node Type</label>
                    <Select 
                      placeholder="Select node type"
                      variant="bordered"
                    >
                      <SelectItem key="validator">Validator</SelectItem>
                      <SelectItem key="compute">Compute</SelectItem>
                      <SelectItem key="storage">Storage</SelectItem>
                      <SelectItem key="gateway">Gateway</SelectItem>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Public Key</label>
                  <Input 
                    placeholder="Enter node public key"
                    variant="bordered"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Compute Capacity</label>
                    <Input 
                      type="number" 
                      placeholder="1000"
                      variant="bordered"
                      endContent={<span className="text-sm text-default-400">FLOPS</span>}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bandwidth</label>
                    <Input 
                      type="number" 
                      placeholder="100"
                      variant="bordered"
                      endContent={<span className="text-sm text-default-400">MB/s</span>}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Region</label>
                  <Select 
                    placeholder="Select region"
                    variant="bordered"
                  >
                    <SelectItem key="us-east">US East</SelectItem>
                    <SelectItem key="us-west">US West</SelectItem>
                    <SelectItem key="europe">Europe</SelectItem>
                    <SelectItem key="asia">Asia</SelectItem>
                    <SelectItem key="australia">Australia</SelectItem>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={onClose}>
                  Register Node
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Node Details Modal */}
      <Modal 
        isOpen={isDetailOpen} 
        onOpenChange={onDetailOpenChange}
        size="4xl"
        placement="center"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {selectedNode && (
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className={`w-4 h-4 rounded-full ${
                        selectedNode.isActive ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      {selectedNode.isActive && (
                        <div className="absolute top-0 left-0 w-4 h-4 bg-green-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedNode.nodeId}</h3>
                      <p className="text-default-400 text-sm">Detailed performance metrics</p>
                    </div>
                  </div>
                )}
              </ModalHeader>
              <ModalBody>
                {selectedNode && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h4 className="font-semibold mb-3">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-default-400">Address:</span>
                          <p className="font-mono text-sm break-all">{selectedNode.address}</p>
                        </div>
                        <div>
                          <span className="text-sm text-default-400">Public Key:</span>
                          <p className="font-mono text-sm break-all">{selectedNode.publicKey}</p>
                        </div>
                        <div>
                          <span className="text-sm text-default-400">Status:</span>
                          <div className="mt-1">
                            <Chip {...getStatusColor(selectedNode.status)}>
                              {selectedNode.status}
                            </Chip>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-default-400">Last Seen:</span>
                          <p className="text-sm">{formatLastSeen(selectedNode.lastSeen)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div>
                      <h4 className="font-semibold mb-3">Performance Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {selectedNode.reputationScore}%
                            </div>
                            <div className="text-sm text-default-400">Reputation</div>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(selectedNode.performanceMetrics?.totalEarnings || 0)}
                            </div>
                            <div className="text-sm text-default-400">Total Earnings</div>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {selectedNode.performanceMetrics?.efficiency || 0}%
                            </div>
                            <div className="text-sm text-default-400">Efficiency</div>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {selectedNode.performanceMetrics?.totalSessions || 0}
                            </div>
                            <div className="text-sm text-default-400">Total Sessions</div>
                          </CardBody>
                        </Card>
                      </div>
                    </div>

                    {/* Resource Usage */}
                    {selectedNode.resourceUsage && (
                      <div>
                        <h4 className="font-semibold mb-3">Resource Usage</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">CPU Usage</span>
                              <span className="text-sm font-medium">{selectedNode.resourceUsage.cpuUsage}%</span>
                            </div>
                            <Progress value={selectedNode.resourceUsage.cpuUsage} color="primary" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Memory Usage</span>
                              <span className="text-sm font-medium">{selectedNode.resourceUsage.memoryUsage}%</span>
                            </div>
                            <Progress value={selectedNode.resourceUsage.memoryUsage} color="secondary" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Disk Usage</span>
                              <span className="text-sm font-medium">{selectedNode.resourceUsage.diskUsage}%</span>
                            </div>
                            <Progress value={selectedNode.resourceUsage.diskUsage} color="warning" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Network Usage</span>
                              <span className="text-sm font-medium">{selectedNode.resourceUsage.networkUsage}%</span>
                            </div>
                            <Progress value={selectedNode.resourceUsage.networkUsage} color="success" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ranking Information */}
                    {selectedNode.rankingData && (
                      <div>
                        <h4 className="font-semibold mb-3">Ranking Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardBody className="text-center">
                              <div className="text-2xl font-bold">#{selectedNode.rankingData.currentRank}</div>
                              <div className="text-sm text-default-400">Current Rank</div>
                            </CardBody>
                          </Card>
                          <Card>
                            <CardBody className="text-center">
                              <div className="flex items-center justify-center space-x-1">
                                {getRankChangeIcon(selectedNode.rankingData.rankChange)}
                                <span className="text-2xl font-bold">
                                  {Math.abs(selectedNode.rankingData.rankChange)}
                                </span>
                              </div>
                              <div className="text-sm text-default-400">Rank Change</div>
                            </CardBody>
                          </Card>
                          <Card>
                            <CardBody className="text-center">
                              <div className="flex justify-center mb-1">
                                {getCategoryInfo(selectedNode.rankingData.category).icon}
                              </div>
                              <div className="text-sm font-medium">
                                {getCategoryInfo(selectedNode.rankingData.category).label}
                              </div>
                              <div className="text-xs text-default-400">Category</div>
                            </CardBody>
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}