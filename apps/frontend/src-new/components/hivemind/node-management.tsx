'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { Pagination } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { 
  Search,
  Filter,
  Users,
  Cpu,
  HardDrive,
  Wifi,
  MapPin,
  Clock,
  TrendingUp,
  Award,
  Settings,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Pause,
  Activity
} from 'lucide-react';
import { useHivemindStore, type NetworkNode } from '@/lib/stores';
import { formatDistanceToNow } from 'date-fns';

export function NodeManagement() {
  const { nodes, updateNode, removeNode } = useHivemindStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('joinDate');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock additional node data for demonstration
  const enhancedNodes: NetworkNode[] = nodes.length > 0 ? nodes : [
    {
      id: 'node_001',
      address: '192.168.1.100:8080',
      status: 'training',
      location: 'San Francisco, CA',
      joinDate: '2024-01-15T10:00:00Z',
      lastSeen: '2024-01-20T14:30:00Z',
      hardware: {
        gpu: 'RTX 4090',
        memory: '32GB DDR5',
        cores: 16,
        bandwidth: 1000
      },
      performance: {
        uptime: 98.5,
        reliability: 96.2,
        avgLatency: 45,
        computeContributed: 127.5
      },
      reputation: 2850,
      contributions: 42
    },
    {
      id: 'node_002',
      address: '10.0.0.25:8080',
      status: 'online',
      location: 'London, UK',
      joinDate: '2024-01-12T08:15:00Z',
      lastSeen: '2024-01-20T14:28:00Z',
      hardware: {
        gpu: 'RTX 3080',
        memory: '16GB DDR4',
        cores: 12,
        bandwidth: 500
      },
      performance: {
        uptime: 94.1,
        reliability: 92.8,
        avgLatency: 78,
        computeContributed: 89.2
      },
      reputation: 1940,
      contributions: 28
    },
    {
      id: 'node_003',
      address: '172.16.0.45:8080',
      status: 'offline',
      location: 'Tokyo, Japan',
      joinDate: '2024-01-18T16:20:00Z',
      lastSeen: '2024-01-19T22:15:00Z',
      hardware: {
        gpu: 'RTX 4070',
        memory: '24GB DDR5',
        cores: 14,
        bandwidth: 750
      },
      performance: {
        uptime: 87.3,
        reliability: 89.1,
        avgLatency: 120,
        computeContributed: 34.7
      },
      reputation: 890,
      contributions: 12
    },
    {
      id: 'node_004',
      address: '203.0.113.50:8080',
      status: 'connecting',
      location: 'Sydney, Australia',
      joinDate: '2024-01-20T12:45:00Z',
      lastSeen: '2024-01-20T14:25:00Z',
      hardware: {
        gpu: 'RTX 3070',
        memory: '16GB DDR4',
        cores: 10,
        bandwidth: 300
      },
      performance: {
        uptime: 100,
        reliability: 100,
        avgLatency: 180,
        computeContributed: 2.1
      },
      reputation: 150,
      contributions: 1
    },
    {
      id: 'node_005',
      address: '198.51.100.75:8080',
      status: 'training',
      location: 'Toronto, Canada',
      joinDate: '2024-01-14T09:30:00Z',
      lastSeen: '2024-01-20T14:32:00Z',
      hardware: {
        gpu: 'RTX 4080',
        memory: '32GB DDR5',
        cores: 16,
        bandwidth: 800
      },
      performance: {
        uptime: 95.7,
        reliability: 94.3,
        avgLatency: 65,
        computeContributed: 98.3
      },
      reputation: 2240,
      contributions: 35
    }
  ];

  const getStatusIcon = (status: NetworkNode['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'training':
        return <Activity className="h-4 w-4 text-primary" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-danger" />;
      case 'connecting':
        return <Pause className="h-4 w-4 text-warning" />;
      default:
        return <XCircle className="h-4 w-4 text-default" />;
    }
  };

  const getStatusColor = (status: NetworkNode['status']) => {
    switch (status) {
      case 'online': return 'success';
      case 'training': return 'primary';
      case 'offline': return 'danger';
      case 'connecting': return 'warning';
      default: return 'default';
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 95) return 'text-success';
    if (value >= 85) return 'text-warning';
    return 'text-danger';
  };

  // Filter and search logic
  const filteredNodes = enhancedNodes.filter(node => {
    const matchesSearch = 
      node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || node.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort logic
  const sortedNodes = [...filteredNodes].sort((a, b) => {
    switch (sortBy) {
      case 'joinDate':
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      case 'reputation':
        return b.reputation - a.reputation;
      case 'reliability':
        return b.performance.reliability - a.performance.reliability;
      case 'computeContributed':
        return b.performance.computeContributed - a.performance.computeContributed;
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedNodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNodes = sortedNodes.slice(startIndex, startIndex + itemsPerPage);

  const handleNodeAction = (nodeId: string, action: 'view' | 'ban' | 'promote') => {
    console.log(`${action} node:`, nodeId);
    // TODO: Implement node actions
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="h-4 w-4 text-foreground-400" />}
              className="md:max-w-xs"
            />
            
            <Select
              placeholder="Filter by status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || 'all')}
              className="md:max-w-xs"
              startContent={<Filter className="h-4 w-4" />}
            >
              <SelectItem key="all" value="all">All Status</SelectItem>
              <SelectItem key="online" value="online">Online</SelectItem>
              <SelectItem key="training" value="training">Training</SelectItem>
              <SelectItem key="offline" value="offline">Offline</SelectItem>
              <SelectItem key="connecting" value="connecting">Connecting</SelectItem>
            </Select>

            <Select
              placeholder="Sort by"
              selectedKeys={sortBy ? [sortBy] : []}
              onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string || 'joinDate')}
              className="md:max-w-xs"
            >
              <SelectItem key="joinDate" value="joinDate">Join Date</SelectItem>
              <SelectItem key="reputation" value="reputation">Reputation</SelectItem>
              <SelectItem key="reliability" value="reliability">Reliability</SelectItem>
              <SelectItem key="computeContributed" value="computeContributed">Compute Hours</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Nodes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Network Nodes</h3>
                <p className="text-sm text-foreground-600">
                  {filteredNodes.length} nodes found
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table aria-label="Network nodes table">
            <TableHeader>
              <TableColumn>NODE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>LOCATION</TableColumn>
              <TableColumn>HARDWARE</TableColumn>
              <TableColumn>PERFORMANCE</TableColumn>
              <TableColumn>REPUTATION</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedNodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{node.id}</p>
                      <p className="text-sm text-foreground-600">{node.address}</p>
                      <p className="text-xs text-foreground-500">
                        Joined {formatDistanceToNow(new Date(node.joinDate), { addSuffix: true })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <Chip 
                        size="sm" 
                        color={getStatusColor(node.status) as any}
                        variant="flat"
                        startContent={getStatusIcon(node.status)}
                      >
                        {node.status.toUpperCase()}
                      </Chip>
                      <p className="text-xs text-foreground-600">
                        Last seen {formatDistanceToNow(new Date(node.lastSeen), { addSuffix: true })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-foreground-600" />
                      <span className="text-sm">{node.location || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-1">
                        <Cpu className="h-3 w-3" />
                        <span>{node.hardware?.gpu || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <HardDrive className="h-3 w-3" />
                        <span>{node.hardware?.memory || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Wifi className="h-3 w-3" />
                        <span>{node.hardware?.bandwidth || 0} Mbps</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Uptime:</span>
                        <span className={getPerformanceColor(node.performance.uptime)}>
                          {node.performance.uptime.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reliability:</span>
                        <span className={getPerformanceColor(node.performance.reliability)}>
                          {node.performance.reliability.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span>{node.performance.avgLatency}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compute:</span>
                        <span>{node.performance.computeContributed.toFixed(1)}h</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="flex items-center space-x-1 mb-1">
                        <Award className="h-3 w-3 text-warning" />
                        <span className="font-semibold">{node.reputation}</span>
                      </div>
                      <p className="text-xs text-foreground-600">
                        {node.contributions} contributions
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="light"
                        size="sm"
                        isIconOnly
                        onClick={() => handleNodeAction(node.id, 'view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        isIconOnly
                        onClick={() => handleNodeAction(node.id, 'ban')}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        isIconOnly
                        onClick={() => handleNodeAction(node.id, 'promote')}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            showShadow
            color="primary"
          />
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <p className="text-lg font-semibold">
              {enhancedNodes.filter(n => n.status === 'online' || n.status === 'training').length}
            </p>
            <p className="text-sm text-foreground-600">Active Nodes</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <p className="text-lg font-semibold">
              {enhancedNodes.filter(n => n.status === 'training').length}
            </p>
            <p className="text-sm text-foreground-600">Training Nodes</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <p className="text-lg font-semibold">
              {(enhancedNodes.reduce((sum, n) => sum + n.performance.reliability, 0) / enhancedNodes.length).toFixed(1)}%
            </p>
            <p className="text-sm text-foreground-600">Avg Reliability</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-secondary" />
            </div>
            <p className="text-lg font-semibold">
              {enhancedNodes.reduce((sum, n) => sum + n.performance.computeContributed, 0).toFixed(1)}h
            </p>
            <p className="text-sm text-foreground-600">Total Compute</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}