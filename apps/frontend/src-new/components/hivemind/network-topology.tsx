'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { 
  Globe,
  Cpu,
  Activity,
  Users,
  Zap,
  MapPin,
  Filter,
  Maximize,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useHivemindStore } from '@/lib/stores';

export function NetworkTopology() {
  const { nodes, stats, isConnected, updateStats } = useHivemindStore();
  const [viewMode, setViewMode] = useState('geographic');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetails, setShowDetails] = useState(true);

  // Mock geographic regions for demonstration
  const regions = [
    { name: 'North America', nodes: 342, color: 'bg-blue-500' },
    { name: 'Europe', nodes: 278, color: 'bg-green-500' },
    { name: 'Asia Pacific', nodes: 456, color: 'bg-purple-500' },
    { name: 'South America', nodes: 89, color: 'bg-orange-500' },
    { name: 'Africa', nodes: 67, color: 'bg-red-500' },
    { name: 'Oceania', nodes: 23, color: 'bg-yellow-500' }
  ];

  // Mock network connections data
  const connections = [
    { from: 'North America', to: 'Europe', strength: 85, latency: 120 },
    { from: 'North America', to: 'Asia Pacific', strength: 78, latency: 180 },
    { from: 'Europe', to: 'Asia Pacific', strength: 82, latency: 140 },
    { from: 'Asia Pacific', to: 'Oceania', strength: 90, latency: 80 },
    { from: 'Europe', to: 'Africa', strength: 75, latency: 160 },
    { from: 'North America', to: 'South America', strength: 88, latency: 110 }
  ];

  // Generate mock node positions for visualization
  const getNodePositions = () => {
    return nodes.slice(0, 20).map((node, index) => ({
      ...node,
      x: 50 + (index % 5) * 20 + Math.random() * 10,
      y: 20 + Math.floor(index / 5) * 25 + Math.random() * 10,
      region: regions[index % regions.length].name
    }));
  };

  const [nodePositions, setNodePositions] = useState(getNodePositions());

  useEffect(() => {
    setNodePositions(getNodePositions());
  }, [nodes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-success';
      case 'training': return 'text-primary';
      case 'offline': return 'text-default';
      case 'connecting': return 'text-warning';
      default: return 'text-default';
    }
  };

  const getConnectionStrengthColor = (strength: number) => {
    if (strength >= 85) return 'stroke-success';
    if (strength >= 70) return 'stroke-warning';
    return 'stroke-danger';
  };

  const filteredNodes = nodePositions.filter(node => 
    filterStatus === 'all' || node.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <Select
                placeholder="View Mode"
                selectedKeys={viewMode ? [viewMode] : []}
                onSelectionChange={(keys) => setViewMode(Array.from(keys)[0] as string)}
                className="md:max-w-xs"
                size="sm"
              >
                <SelectItem key="geographic" value="geographic">Geographic View</SelectItem>
                <SelectItem key="performance" value="performance">Performance View</SelectItem>
                <SelectItem key="connections" value="connections">Connection Graph</SelectItem>
              </Select>

              <Select
                placeholder="Filter Status"
                selectedKeys={filterStatus ? [filterStatus] : []}
                onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0] as string)}
                className="md:max-w-xs"
                size="sm"
                startContent={<Filter className="h-4 w-4" />}
              >
                <SelectItem key="all" value="all">All Nodes</SelectItem>
                <SelectItem key="online" value="online">Online</SelectItem>
                <SelectItem key="training" value="training">Training</SelectItem>
                <SelectItem key="offline" value="offline">Offline</SelectItem>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="flat"
                size="sm"
                startContent={showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              
              <Button
                variant="flat"
                size="sm"
                startContent={<Maximize className="h-4 w-4" />}
              >
                Fullscreen
              </Button>
              
              <Button
                variant="flat"
                size="sm"
                startContent={<RefreshCw className="h-4 w-4" />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Visualization */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold">
                  {viewMode === 'geographic' ? 'Geographic Distribution' :
                   viewMode === 'performance' ? 'Performance Overview' :
                   'Connection Graph'}
                </h3>
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <span className="text-sm text-foreground-600">
                    {filteredNodes.length} / {nodePositions.length} nodes
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
                {/* SVG Visualization */}
                <svg width="100%" height="100%" className="absolute inset-0">
                  {/* Background Grid */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Connection Lines */}
                  {viewMode === 'connections' && connections.map((conn, index) => {
                    const fromRegion = regions.find(r => r.name === conn.from);
                    const toRegion = regions.find(r => r.name === conn.to);
                    if (!fromRegion || !toRegion) return null;
                    
                    const fromIndex = regions.indexOf(fromRegion);
                    const toIndex = regions.indexOf(toRegion);
                    const x1 = 100 + (fromIndex % 3) * 200;
                    const y1 = 100 + Math.floor(fromIndex / 3) * 150;
                    const x2 = 100 + (toIndex % 3) * 200;
                    const y2 = 100 + Math.floor(toIndex / 3) * 150;
                    
                    return (
                      <g key={index}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          className={getConnectionStrengthColor(conn.strength)}
                          strokeWidth={Math.max(1, conn.strength / 30)}
                          opacity="0.6"
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2 - 5}
                          className="fill-current text-xs"
                          textAnchor="middle"
                        >
                          {conn.latency}ms
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Node Visualization */}
                  {filteredNodes.map((node, index) => {
                    const size = viewMode === 'performance' ? 
                      Math.max(8, node.performance.reliability / 10) : 12;
                    
                    return (
                      <g key={node.id}>
                        <circle
                          cx={`${node.x}%`}
                          cy={`${node.y}%`}
                          r={size}
                          className={`fill-current ${getStatusColor(node.status)}`}
                          opacity={node.status === 'offline' ? 0.4 : 0.8}
                        >
                          <animate
                            attributeName="r"
                            values={`${size};${size + 2};${size}`}
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        
                        {showDetails && (
                          <g>
                            <rect
                              x={`${node.x}%`}
                              y={`${node.y + 3}%`}
                              width="80"
                              height="40"
                              className="fill-current text-background"
                              opacity="0.9"
                              rx="4"
                            />
                            <text
                              x={`${node.x + 5}%`}
                              y={`${node.y + 5}%`}
                              className="fill-current text-foreground text-xs"
                            >
                              {node.id.slice(-6)}
                            </text>
                            <text
                              x={`${node.x + 5}%`}
                              y={`${node.y + 7.5}%`}
                              className="fill-current text-foreground-600 text-xs"
                            >
                              {node.performance.reliability.toFixed(1)}%
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Region Labels for Geographic View */}
                {viewMode === 'geographic' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {regions.map((region, index) => (
                      <div
                        key={region.name}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${20 + (index % 3) * 30}%`,
                          top: `${15 + Math.floor(index / 3) * 40}%`
                        }}
                      >
                        <div className="text-center">
                          <div className={`w-4 h-4 ${region.color} rounded-full mx-auto mb-1`}></div>
                          <p className="text-xs font-medium">{region.name}</p>
                          <p className="text-xs text-foreground-600">{region.nodes} nodes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Network Statistics */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Network Statistics</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-success" />
                  <span className="text-sm">Active Nodes</span>
                </div>
                <span className="font-semibold">{stats.activeNodes}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span className="text-sm">Training Nodes</span>
                </div>
                <span className="font-semibold">{stats.trainingNodes}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-warning" />
                  <span className="text-sm">Avg Latency</span>
                </div>
                <span className="font-semibold">{stats.avgLatency.toFixed(0)}ms</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-secondary" />
                  <span className="text-sm">Contributors</span>
                </div>
                <span className="font-semibold">{stats.totalContributors}</span>
              </div>
            </CardBody>
          </Card>

          {/* Regional Distribution */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Regional Distribution</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {regions.map((region) => (
                <div key={region.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${region.color} rounded-full`}></div>
                      <span className="text-sm">{region.name}</span>
                    </div>
                    <span className="text-sm font-medium">{region.nodes}</span>
                  </div>
                  <div className="w-full bg-foreground/10 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${region.color}`}
                      style={{ width: `${(region.nodes / stats.totalNodes) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Connection Quality */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Connection Quality</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {connections.slice(0, 4).map((conn, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{conn.from} → {conn.to}</span>
                    <Chip 
                      size="sm" 
                      variant="dot"
                      color={
                        conn.strength >= 85 ? 'success' :
                        conn.strength >= 70 ? 'warning' : 'danger'
                      }
                    >
                      {conn.strength}%
                    </Chip>
                  </div>
                  <div className="text-xs text-foreground-600">
                    Latency: {conn.latency}ms
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}