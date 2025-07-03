'use client';

import React from 'react';
import { ServiceWorkerStatus } from '@/components/service-worker/offline-indicator';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/cotrain/ui/card';
import { Button } from '@/components/cotrain/ui/button';
import { Badge } from '@/components/cotrain/ui/badge';
import { Alert, AlertDescription } from '@/components/cotrain/ui/alert';
import { 
  Trash2, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  X,
  Play
} from 'lucide-react';

export default function OfflineSettingsPage() {
  const {
    queue,
    isProcessing,
    queueStats,
    processQueue,
    clearQueue,
    removeFromQueue,
    isOnline
  } = useOfflineQueue();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Offline Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage offline functionality, cached data, and queued actions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Worker Status */}
        <div className="space-y-6">
          <ServiceWorkerStatus />
        </div>

        {/* Offline Queue Management */}
        <div className="space-y-6">
          {/* Queue Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Offline Queue</span>
              </CardTitle>
              <CardDescription>
                Actions queued while offline will be executed when connection is restored
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{queueStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{queueStats.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{queueStats.retrying}</div>
                  <div className="text-sm text-muted-foreground">Retrying</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={processQueue}
                  disabled={isProcessing || !isOnline || queue.length === 0}
                  size="sm"
                >
                  <Play className={`h-4 w-4 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
                  {isProcessing ? 'Processing...' : 'Process Queue'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={clearQueue}
                  disabled={queue.length === 0}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>

              {!isOnline && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You're currently offline. Queued actions will be processed when connection is restored.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Queued Actions List */}
          {queue.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Queued Actions</CardTitle>
                <CardDescription>
                  Actions waiting to be executed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {queue.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{action.description}</span>
                          {action.retryCount && action.retryCount > 0 ? (
                            <Badge variant="outline" className="text-xs">
                              Retry {action.retryCount}/{action.maxRetries || 3}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="uppercase font-mono">{action.method}</span>
                          {' '}
                          <span>{action.url}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Queued {new Date(action.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromQueue(action.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {queue.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="font-medium mb-2">No Queued Actions</h3>
                <p className="text-sm text-muted-foreground">
                  All actions have been processed successfully
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Usage Guidelines */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How Offline Mode Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Available Offline:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• View cached training sessions</li>
                <li>• Browse reward history</li>
                <li>• Access P2P network statistics</li>
                <li>• View contribution metrics</li>
                <li>• Read documentation and guides</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Requires Online Connection:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Creating new training sessions</li>
                <li>• Claiming rewards</li>
                <li>• Submitting contributions</li>
                <li>• Real-time P2P communication</li>
                <li>• Blockchain transactions</li>
              </ul>
            </div>
          </div>
          
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Actions performed while offline are automatically queued and will be executed when you're back online. 
              You'll see notifications when queued actions are processed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}