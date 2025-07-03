'use client';

import React from 'react';
import { useServiceWorker } from '@/lib/service-worker';
import { Alert, AlertDescription } from '@/components/cotrain/ui/alert';
import { Button } from '@/components/cotrain/ui/button';
import { Badge } from '@/components/cotrain/ui/badge';
import { Card, CardContent } from '@/components/cotrain/ui/card';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Download, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

export function OfflineIndicator() {
  const {
    isOnline,
    isSupported,
    updateAvailable,
    updateServiceWorker,
    clearCache
  } = useServiceWorker();

  const [isClearing, setIsClearing] = React.useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearCache();
      // Show success message
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Offline Status Indicator */}
      {!isOnline && (
        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                You're offline
              </span>
              <Badge variant="secondary" className="text-xs">
                Limited features
              </Badge>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Some actions will be queued until you're back online
            </p>
          </CardContent>
        </Card>
      )}

      {/* Online Status Indicator (brief) */}
      {isOnline && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 animate-in slide-in-from-bottom">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Back online
              </span>
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Worker Update Available */}
      {updateAvailable && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                New version available!
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={updateServiceWorker}
                className="ml-2 h-7 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Update
              </Button>
            </div>
            <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
              Click update to get the latest features
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function ServiceWorkerStatus() {
  const {
    isOnline,
    isSupported,
    registration,
    clearCache
  } = useServiceWorker();

  const [cacheStatus, setCacheStatus] = React.useState<any>(null);
  const [isClearing, setIsClearing] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const refreshCacheStatus = async () => {
    if (!registration?.active) return;

    setIsRefreshing(true);
    try {
      // Get cache status via service worker message
      const messageChannel = new MessageChannel();
      
      const promise = new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
      });

      registration.active.postMessage(
        { type: 'GET_CACHE_STATUS' }, 
        [messageChannel.port2]
      );

      const status = await promise;
      setCacheStatus(status);
    } catch (error) {
      console.error('Failed to get cache status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearCache();
      await refreshCacheStatus();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  React.useEffect(() => {
    refreshCacheStatus();
  }, [registration]);

  if (!isSupported) {
    return (
      <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="font-medium text-red-800 dark:text-red-200">
              Service Workers Not Supported
            </span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Your browser doesn't support Service Workers. Offline functionality will be limited.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOnline 
                    ? 'All features available' 
                    : 'Limited functionality, actions will be queued'
                  }
                </p>
              </div>
            </div>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Service Worker Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Service Worker</h3>
              <p className="text-sm text-muted-foreground">
                Offline functionality and caching
              </p>
            </div>
            <Badge variant={registration ? 'default' : 'secondary'}>
              {registration ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {registration && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Registration Status</span>
                <Badge variant="outline" className="text-xs">
                  {registration.active ? 'Active' : 'Installing'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Scope</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {registration.scope}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Cache Status</h3>
              <p className="text-sm text-muted-foreground">
                Cached resources for offline access
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={refreshCacheStatus}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearCache}
                disabled={isClearing}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isClearing ? 'Clearing...' : 'Clear'}
              </Button>
            </div>
          </div>

          {cacheStatus && (
            <div className="space-y-2">
              {Object.entries(cacheStatus).map(([cacheName, count]) => (
                <div key={cacheName} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {cacheName.replace(/cotrain-|v\d+/g, '').replace(/-/g, ' ')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {count} items
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {!cacheStatus && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Loading cache status...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}