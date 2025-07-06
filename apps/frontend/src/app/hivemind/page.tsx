'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Users, Activity } from 'lucide-react';
import { hivemindApi, type PeerInfo } from '@/lib/api/hivemind';
import { toast } from 'sonner';

export default function HivemindPage() {
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadServerStatus(), loadPeers()]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadServerStatus = async () => {
    try {
      const status = await hivemindApi.getStatus() as any;
      setServerStatus(status.data);
    } catch (error) {
      console.error('Failed to load server status:', error);
    }
  };

  const loadPeers = async () => {
    try {
      const peersData = await hivemindApi.getConnectedPeers();
      setPeers(peersData);
    } catch (error) {
      console.error('Failed to load peers:', error);
    }
  };

  const handleStartServer = async () => {
    setIsLoading(true);
    try {
      await hivemindApi.startServer();
      toast.success('Hivemind 服务器启动成功');
      await loadServerStatus();
    } catch (error) {
      toast.error('启动服务器失败');
      console.error('Failed to start server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      running: 'default' as const,
      stopped: 'secondary' as const,
      error: 'destructive' as const,
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hivemind 分布式训练</h1>
          <p className="text-muted-foreground mt-2">
            管理分布式深度学习网络和训练任务
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={loadData} 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button 
            onClick={handleStartServer} 
            disabled={isLoading || serverStatus?.status === 'running'}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isLoading ? '启动中...' : '启动服务器'}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">服务器状态</p>
                {serverStatus ? (
                  getStatusBadge(serverStatus.status)
                ) : (
                  <Badge variant="secondary">加载中...</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">连接节点数</p>
                <p className="text-2xl font-bold">{serverStatus?.connected_peers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium">DHT 网络大小</p>
              <p className="text-2xl font-bold">{serverStatus?.dht_size || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium">节点 ID</p>
              <p className="font-mono text-sm truncate">
                {serverStatus?.peer_id ? 
                  `${serverStatus.peer_id.slice(0, 12)}...` : 
                  'N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Server Details */}
      <Card>
        <CardHeader>
          <CardTitle>服务器详情</CardTitle>
        </CardHeader>
        <CardContent>
          {serverStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  {getStatusBadge(serverStatus.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">完整节点 ID</p>
                  <p className="font-mono text-sm break-all">
                    {serverStatus.peer_id || 'N/A'}
                  </p>
                </div>
              </div>
              
              {serverStatus.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>错误:</strong> {serverStatus.error}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">加载中...</p>
          )}
        </CardContent>
      </Card>

      {/* Connected Peers */}
      <Card>
        <CardHeader>
          <CardTitle>连接的节点</CardTitle>
        </CardHeader>
        <CardContent>
          {peers.length > 0 ? (
            <div className="space-y-3">
              {peers.map((peer, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium">
                      {peer.peer_id.slice(0, 20)}...
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {peer.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">最后连接</p>
                    <p className="text-sm">{formatTime(peer.last_seen)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无连接的节点</p>
              <p className="text-sm text-muted-foreground mt-2">
                启动服务器后，其他节点将自动连接到网络
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}