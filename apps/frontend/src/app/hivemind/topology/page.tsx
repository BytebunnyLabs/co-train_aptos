'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Button } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { Tabs, Tab } from '@heroui/react';
import { Switch } from '@heroui/react';
import { Slider } from '@heroui/react';
import { Badge } from '@heroui/react';
import { 
  Network, 
  Cpu, 
  Wifi, 
  Activity, 
  Search, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Play,
  Pause,
  Settings,
  Eye,
  EyeOff,
  Layers,
  Globe,
  Server,
  Link,
  Target,
  Zap
} from 'lucide-react';

interface NetworkNode {
  id: string;
  type: 'validator' | 'compute' | 'storage' | 'gateway';
  status: 'active' | 'inactive' | 'busy' | 'maintenance';
  position: { x: number; y: number };
  connections: string[];
  metadata: {
    computePower: number;
    bandwidth: number;
    reputation: number;
    uptime: number;
    region: string;
  };
}

interface NetworkConnection {
  source: string;
  target: string;
  strength: number;
  latency: number;
  bandwidth: number;
  type: 'primary' | 'secondary' | 'backup';
}

interface TopologyFilters {
  nodeTypes: string[];
  minReputation: number;
  showInactive: boolean;
  showConnections: boolean;
  connectionType: string;
}

export default function NetworkTopologyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [filters, setFilters] = useState<TopologyFilters>({
    nodeTypes: ['validator', 'compute', 'storage', 'gateway'],
    minReputation: 0,
    showInactive: true,
    showConnections: true,
    connectionType: 'all'
  });
  const [isAnimating, setIsAnimating] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'force' | 'circular' | 'grid' | 'hierarchical'>('force');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopologyData();
    const interval = setInterval(fetchTopologyData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (nodes.length > 0) {
      drawTopology();
    }
  }, [nodes, connections, filters, zoom, viewMode, isAnimating]);

  const fetchTopologyData = async () => {
    try {
      const [nodesResponse, connectionsResponse] = await Promise.all([
        fetch('/api/hivemind/topology/nodes'),
        fetch('/api/hivemind/topology/connections'),
      ]);

      const [nodesData, connectionsData] = await Promise.all([
        nodesResponse.json(),
        connectionsResponse.json(),
      ]);

      setNodes(nodesData);
      setConnections(connectionsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch topology data:', error);
      // Mock data for demo
      setNodes(generateMockNodes());
      setConnections(generateMockConnections());
      setIsLoading(false);
    }
  };

  const generateMockNodes = (): NetworkNode[] => {
    const nodeTypes = ['validator', 'compute', 'storage', 'gateway'] as const;
    const regions = ['US-East', 'US-West', 'Europe', 'Asia', 'Australia'];
    const statuses = ['active', 'inactive', 'busy', 'maintenance'] as const;
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: `node-${i + 1}`,
      type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      position: {
        x: Math.random() * 800 + 100,
        y: Math.random() * 600 + 100
      },
      connections: [],
      metadata: {
        computePower: Math.floor(Math.random() * 1000) + 100,
        bandwidth: Math.floor(Math.random() * 1000) + 50,
        reputation: Math.floor(Math.random() * 100),
        uptime: Math.floor(Math.random() * 100),
        region: regions[Math.floor(Math.random() * regions.length)]
      }
    }));
  };

  const generateMockConnections = (): NetworkConnection[] => {
    const connectionTypes = ['primary', 'secondary', 'backup'] as const;
    return Array.from({ length: 80 }, (_, i) => ({
      source: `node-${Math.floor(Math.random() * 50) + 1}`,
      target: `node-${Math.floor(Math.random() * 50) + 1}`,
      strength: Math.random(),
      latency: Math.floor(Math.random() * 200) + 10,
      bandwidth: Math.floor(Math.random() * 1000) + 100,
      type: connectionTypes[Math.floor(Math.random() * connectionTypes.length)]
    }));
  };

  const drawTopology = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom
    ctx.save();
    ctx.scale(zoom, zoom);

    // Filter nodes and connections
    const filteredNodes = nodes.filter(node => {
      if (!filters.nodeTypes.includes(node.type)) return false;
      if (node.metadata.reputation < filters.minReputation) return false;
      if (!filters.showInactive && node.status === 'inactive') return false;
      if (searchTerm && !node.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    // Draw connections
    if (filters.showConnections) {
      connections.forEach(conn => {
        const sourceNode = filteredNodes.find(n => n.id === conn.source);
        const targetNode = filteredNodes.find(n => n.id === conn.target);
        
        if (!sourceNode || !targetNode) return;
        if (filters.connectionType !== 'all' && conn.type !== filters.connectionType) return;

        ctx.beginPath();
        ctx.moveTo(sourceNode.position.x, sourceNode.position.y);
        ctx.lineTo(targetNode.position.x, targetNode.position.y);
        
        // Connection styling based on type and strength
        const alpha = conn.strength * 0.8 + 0.2;
        switch (conn.type) {
          case 'primary':
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`; // Blue
            ctx.lineWidth = 2;
            break;
          case 'secondary':
            ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`; // Green
            ctx.lineWidth = 1.5;
            break;
          case 'backup':
            ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`; // Amber
            ctx.lineWidth = 1;
            break;
        }
        
        ctx.stroke();
      });
    }

    // Draw nodes
    filteredNodes.forEach(node => {
      const { x, y } = node.position;
      
      // Node size based on compute power
      const nodeSize = Math.max(6, Math.min(20, node.metadata.computePower / 50));
      
      // Node color based on type and status
      let nodeColor = '#6b7280'; // Default gray
      switch (node.type) {
        case 'validator':
          nodeColor = node.status === 'active' ? '#8b5cf6' : '#a78bfa'; // Purple
          break;
        case 'compute':
          nodeColor = node.status === 'active' ? '#3b82f6' : '#60a5fa'; // Blue
          break;
        case 'storage':
          nodeColor = node.status === 'active' ? '#22c55e' : '#4ade80'; // Green
          break;
        case 'gateway':
          nodeColor = node.status === 'active' ? '#f59e0b' : '#fbbf24'; // Amber
          break;
      }

      // Draw node
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor;
      ctx.fill();
      
      // Add border for selected node
      if (selectedNode?.id === node.id) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Add status indicator
      if (node.status === 'busy') {
        ctx.beginPath();
        ctx.arc(x + nodeSize - 3, y - nodeSize + 3, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      }
      
      // Add reputation indicator (small ring)
      if (node.metadata.reputation > 80) {
        ctx.beginPath();
        ctx.arc(x, y, nodeSize + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2)
      );
      const nodeSize = Math.max(6, Math.min(20, node.metadata.computePower / 50));
      return distance <= nodeSize;
    });

    setSelectedNode(clickedNode || null);
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'validator': return <Target className="h-4 w-4" />;
      case 'compute': return <Cpu className="h-4 w-4" />;
      case 'storage': return <Server className="h-4 w-4" />;
      case 'gateway': return <Globe className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'busy': return 'warning';
      case 'maintenance': return 'secondary';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Network className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading network topology...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Network Topology</h1>
          <p className="text-default-400">Real-time P2P network visualization and analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="bordered"
            size="sm"
            onClick={() => setIsAnimating(!isAnimating)}
            startContent={isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          >
            {isAnimating ? 'Pause' : 'Play'}
          </Button>
          <Button
            variant="bordered"
            size="sm"
            onClick={() => setZoom(1)}
            startContent={<RotateCcw className="h-4 w-4" />}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <Input
                placeholder="Search nodes..."
                startContent={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
              />
            </div>
            
            <div>
              <Select
                selectedKeys={[viewMode]}
                onSelectionChange={(keys) => setViewMode(Array.from(keys)[0] as any)}
                placeholder="View Mode"
                size="sm"
              >
                <SelectItem key="force">Force Layout</SelectItem>
                <SelectItem key="circular">Circular</SelectItem>
                <SelectItem key="grid">Grid</SelectItem>
                <SelectItem key="hierarchical">Hierarchical</SelectItem>
              </Select>
            </div>

            <div>
              <Select
                selectedKeys={filters.connectionType !== 'all' ? [filters.connectionType] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFilters(prev => ({ ...prev, connectionType: selected || 'all' }));
                }}
                placeholder="Connection Type"
                size="sm"
              >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="primary">Primary</SelectItem>
                <SelectItem key="secondary">Secondary</SelectItem>
                <SelectItem key="backup">Backup</SelectItem>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                size="sm"
                isSelected={filters.showConnections}
                onValueChange={(checked) => setFilters(prev => ({ ...prev, showConnections: checked }))}
              />
              <span className="text-sm">Connections</span>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                size="sm"
                isSelected={filters.showInactive}
                onValueChange={(checked) => setFilters(prev => ({ ...prev, showInactive: checked }))}
              />
              <span className="text-sm">Inactive</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="bordered"
                size="sm"
                onClick={() => setZoom(zoom * 1.2)}
                startContent={<ZoomIn className="h-4 w-4" />}
              >
                Zoom
              </Button>
              <Button
                variant="bordered"
                size="sm"
                onClick={() => setZoom(zoom * 0.8)}
                startContent={<ZoomOut className="h-4 w-4" />}
              >
                Out
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <h3 className="text-lg font-semibold">Network Graph</h3>
                <div className="flex items-center space-x-2">
                  <Badge color="primary" variant="flat">
                    {nodes.filter(n => n.status === 'active').length} Active
                  </Badge>
                  <Badge color="secondary" variant="flat">
                    {connections.length} Connections
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <canvas
                ref={canvasRef}
                width={900}
                height={600}
                className="border rounded-lg cursor-pointer w-full"
                onClick={handleCanvasClick}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Legend */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Legend</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Node Types</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs">Validator</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs">Compute</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs">Storage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs">Gateway</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Connection Types</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-blue-500"></div>
                    <span className="text-xs">Primary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-green-500"></div>
                    <span className="text-xs">Secondary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-amber-500"></div>
                    <span className="text-xs">Backup</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Node Details */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  {getNodeTypeIcon(selectedNode.type)}
                  <h3 className="text-lg font-semibold">Node Details</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <div>
                  <div className="font-medium">{selectedNode.id}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Chip
                      color={getStatusColor(selectedNode.status) as any}
                      variant="flat"
                      size="sm"
                    >
                      {selectedNode.status.toUpperCase()}
                    </Chip>
                    <Chip variant="bordered" size="sm">
                      {selectedNode.type}
                    </Chip>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Compute Power:</span>
                    <span className="font-medium">{selectedNode.metadata.computePower}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bandwidth:</span>
                    <span className="font-medium">{selectedNode.metadata.bandwidth} MB/s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Reputation:</span>
                    <span className="font-medium">{selectedNode.metadata.reputation}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Uptime:</span>
                    <span className="font-medium">{selectedNode.metadata.uptime}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Region:</span>
                    <span className="font-medium">{selectedNode.metadata.region}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm text-default-400 mb-1">
                    Connections: {connections.filter(c => c.source === selectedNode.id || c.target === selectedNode.id).length}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Network Stats */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Network Stats</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Nodes:</span>
                <span className="font-medium">{nodes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active Nodes:</span>
                <span className="font-medium text-green-600">
                  {nodes.filter(n => n.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Connections:</span>
                <span className="font-medium">{connections.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg Reputation:</span>
                <span className="font-medium">
                  {Math.round(nodes.reduce((sum, n) => sum + n.metadata.reputation, 0) / nodes.length)}%
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}