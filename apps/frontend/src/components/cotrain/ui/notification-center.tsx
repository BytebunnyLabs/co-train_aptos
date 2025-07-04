import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bell, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  XCircle,
  Clock,
  Settings,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/cotrain/ui/button';
import { Badge } from '@/components/cotrain/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/cotrain/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/cotrain/ui/dropdown-menu';
import { useWebSocket, Notification } from '@/hooks/useWebSocket';

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
  onMarkAsRead?: () => void;
  className?: string;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onMarkAsRead,
  className,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    }
  };

  const timeAgo = React.useMemo(() => {
    const now = new Date();
    const notificationTime = new Date(notification.timestamp);
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, [notification.timestamp]);

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', getBackgroundColor(), className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold">{notification.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                {notification.data && (
                  <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                    <pre className="whitespace-pre-wrap">
                      {typeof notification.data === 'string' 
                        ? notification.data 
                        : JSON.stringify(notification.data, null, 2)
                      }
                    </pre>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-2">
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onMarkAsRead && (
                      <DropdownMenuItem onClick={onMarkAsRead}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark as read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={onDismiss}>
                      <X className="h-4 w-4 mr-2" />
                      Dismiss
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface NotificationCenterProps {
  className?: string;
  maxHeight?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
  maxHeight = '400px',
}) => {
  const { 
    notifications, 
    unreadNotifications, 
    removeNotification, 
    clearNotifications 
  } = useWebSocket();
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = React.useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(notification => 
        Date.now() - new Date(notification.timestamp).getTime() < 5000
      );
    }
    return notifications;
  }, [notifications, filter]);

  const handleDismiss = (index: number) => {
    removeNotification(index);
  };

  if (notifications.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-medium text-muted-foreground">No notifications</h3>
          <p className="text-xs text-muted-foreground mt-1">
            You're all caught up! New notifications will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="h-5 text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  {filter === 'all' ? 'All' : 'Unread'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  <Clock className="h-4 w-4 mr-2" />
                  All notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('unread')}>
                  <Bell className="h-4 w-4 mr-2" />
                  Unread only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>

            {/* Clear All */}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearNotifications}>
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div 
          className="space-y-2 p-4 overflow-y-auto"
          style={{ maxHeight }}
        >
          {filteredNotifications.map((notification, index) => (
            <NotificationItem
              key={`${notification.timestamp}-${index}`}
              notification={notification}
              onDismiss={() => handleDismiss(index)}
              className="mb-2 last:mb-0"
            />
          ))}
          
          {filteredNotifications.length === 0 && filter === 'unread' && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No unread notifications</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Floating notification bell for navigation
interface NotificationBellProps {
  onClick?: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onClick,
  className,
}) => {
  const { unreadNotifications } = useWebSocket();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('relative', className)}
    >
      <Bell className="h-5 w-5" />
      {unreadNotifications > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
        >
          {unreadNotifications > 9 ? '9+' : unreadNotifications}
        </Badge>
      )}
    </Button>
  );
};

// Inline notification toast
interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
}) => {
  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(onDismiss, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <NotificationItem
        notification={notification}
        onDismiss={onDismiss}
        className="shadow-lg min-w-[300px] max-w-[400px]"
      />
    </div>
  );
};