'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { Pagination } from '@heroui/react';
import { 
  Search,
  Filter,
  Database,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
  Eye,
  Clock,
  User,
  Network,
  Cpu,
  Settings
} from 'lucide-react';
import { useHivemindStore, type SystemLog } from '@/lib/stores';
import { formatDistanceToNow } from 'date-fns';

export function SystemLogs() {
  const { logs, clearLogs } = useHivemindStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Mock logs for demonstration if none exist
  const mockLogs: SystemLog[] = logs.length > 0 ? logs : [
    {
      id: 'log_001',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      message: 'Successfully connected to hivemind network',
      type: 'success',
      category: 'network',
      nodeId: 'node_001',
      details: { latency: 45, peers: 12 }
    },
    {
      id: 'log_002',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      message: 'Started training session for LLM model',
      type: 'info',
      category: 'training',
      nodeId: 'node_001',
      details: { modelId: 'llm_v2.1', expectedDuration: '4-6 hours' }
    },
    {
      id: 'log_003',
      timestamp: new Date(Date.now() - 240000).toISOString(),
      message: 'High memory usage detected: 87%',
      type: 'warning',
      category: 'system',
      details: { memoryUsage: 87, threshold: 85 }
    },
    {
      id: 'log_004',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      message: 'Failed to connect to peer node_045_tokyo',
      type: 'error',
      category: 'network',
      nodeId: 'node_045',
      details: { reason: 'connection timeout', retryCount: 3 }
    },
    {
      id: 'log_005',
      timestamp: new Date(Date.now() - 360000).toISOString(),
      message: 'User updated resource sharing preferences',
      type: 'info',
      category: 'user',
      details: { gpu: true, cpu: true, bandwidth: 500 }
    },
    {
      id: 'log_006',
      timestamp: new Date(Date.now() - 420000).toISOString(),
      message: 'Training session completed successfully',
      type: 'success',
      category: 'training',
      nodeId: 'node_001',
      details: { duration: '3h 45m', tokensEarned: 125, efficiency: 94.2 }
    },
    {
      id: 'log_007',
      timestamp: new Date(Date.now() - 480000).toISOString(),
      message: 'Network latency spike detected',
      type: 'warning',
      category: 'network',
      details: { avgLatency: 340, threshold: 200 }
    },
    {
      id: 'log_008',
      timestamp: new Date(Date.now() - 540000).toISOString(),
      message: 'GPU temperature reached critical level',
      type: 'error',
      category: 'system',
      details: { temperature: 92, maxTemp: 90, action: 'throttling' }
    },
    {
      id: 'log_009',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      message: 'New peer connected: node_127_berlin',
      type: 'info',
      category: 'network',
      nodeId: 'node_127',
      details: { location: 'Berlin, Germany', reputation: 250 }
    },
    {
      id: 'log_010',
      timestamp: new Date(Date.now() - 660000).toISOString(),
      message: 'Security check passed for incoming connection',
      type: 'success',
      category: 'system',
      details: { peerId: 'peer_089', verificationTime: 1.2 }
    }
  ];

  const getLogIcon = (type: SystemLog['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-danger" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getLogColor = (type: SystemLog['type']) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      case 'info':
      default: return 'primary';
    }
  };

  const getCategoryIcon = (category: SystemLog['category']) => {
    switch (category) {
      case 'network':
        return <Network className="h-3 w-3" />;
      case 'training':
        return <Cpu className="h-3 w-3" />;
      case 'system':
        return <Settings className="h-3 w-3" />;
      case 'user':
        return <User className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  // Filter and search logic
  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.nodeId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Sort by timestamp (newest first)
  const sortedLogs = [...filteredLogs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + itemsPerPage);

  const handleExportLogs = () => {
    const csvContent = [
      'Timestamp,Type,Category,Message,Node ID,Details',
      ...sortedLogs.map(log => [
        log.timestamp,
        log.type,
        log.category,
        `"${log.message}"`,
        log.nodeId || '',
        `"${JSON.stringify(log.details || {})}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hivemind-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logTypeCounts = {
    info: mockLogs.filter(log => log.type === 'info').length,
    success: mockLogs.filter(log => log.type === 'success').length,
    warning: mockLogs.filter(log => log.type === 'warning').length,
    error: mockLogs.filter(log => log.type === 'error').length,
  };

  return (
    <div className="space-y-6">
      {/* Log Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <p className="text-lg font-semibold">{logTypeCounts.info}</p>
            <p className="text-sm text-foreground-600">Info</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <p className="text-lg font-semibold">{logTypeCounts.success}</p>
            <p className="text-sm text-foreground-600">Success</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <p className="text-lg font-semibold">{logTypeCounts.warning}</p>
            <p className="text-sm text-foreground-600">Warnings</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-5 w-5 text-danger" />
            </div>
            <p className="text-lg font-semibold">{logTypeCounts.error}</p>
            <p className="text-sm text-foreground-600">Errors</p>
          </CardBody>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="h-4 w-4 text-foreground-400" />}
              className="md:max-w-xs"
            />
            
            <Select
              placeholder="Filter by type"
              selectedKeys={typeFilter ? [typeFilter] : []}
              onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0] as string || 'all')}
              className="md:max-w-xs"
              startContent={<Filter className="h-4 w-4" />}
            >
              <SelectItem key="all" value="all">All Types</SelectItem>
              <SelectItem key="info" value="info">Info</SelectItem>
              <SelectItem key="success" value="success">Success</SelectItem>
              <SelectItem key="warning" value="warning">Warning</SelectItem>
              <SelectItem key="error" value="error">Error</SelectItem>
            </Select>

            <Select
              placeholder="Filter by category"
              selectedKeys={categoryFilter ? [categoryFilter] : []}
              onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] as string || 'all')}
              className="md:max-w-xs"
            >
              <SelectItem key="all" value="all">All Categories</SelectItem>
              <SelectItem key="network" value="network">Network</SelectItem>
              <SelectItem key="training" value="training">Training</SelectItem>
              <SelectItem key="system" value="system">System</SelectItem>
              <SelectItem key="user" value="user">User</SelectItem>
            </Select>

            <div className="flex items-center space-x-2 ml-auto">
              <Button
                variant="flat"
                size="sm"
                startContent={<Download className="h-4 w-4" />}
                onClick={handleExportLogs}
              >
                Export
              </Button>
              <Button
                variant="flat"
                size="sm"
                color="danger"
                startContent={<Trash2 className="h-4 w-4" />}
                onClick={clearLogs}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">System Logs</h3>
                <p className="text-sm text-foreground-600">
                  {filteredLogs.length} logs found
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="space-y-1">
            {paginatedLogs.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-foreground-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Logs Found</h3>
                <p className="text-foreground-600">
                  {searchQuery || typeFilter !== 'all' || categoryFilter !== 'all'
                    ? 'No logs match your current filters'
                    : 'No system logs available'
                  }
                </p>
              </div>
            ) : (
              paginatedLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="border-b border-divider last:border-b-0 p-4 hover:bg-foreground/5 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Chip 
                              size="sm" 
                              color={getLogColor(log.type) as any}
                              variant="flat"
                            >
                              {log.type.toUpperCase()}
                            </Chip>
                            
                            <Chip 
                              size="sm" 
                              variant="dot"
                              startContent={getCategoryIcon(log.category)}
                            >
                              {log.category}
                            </Chip>
                            
                            {log.nodeId && (
                              <Chip size="sm" variant="flat" color="default">
                                {log.nodeId}
                              </Chip>
                            )}
                          </div>
                          
                          <p className="text-sm mb-2">{log.message}</p>
                          
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="text-xs text-foreground-600 bg-foreground/5 rounded p-2 font-mono">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-foreground-600 ml-4">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
    </div>
  );
}