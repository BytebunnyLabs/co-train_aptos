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
import { Button, Chip, Card, CardBody, CardHeader, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
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
      <CardBody className="p-4">
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
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="light" size="sm" className="h-6 w-6 p-0 min-w-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    {onMarkAsRead ? (
                      <DropdownItem key="mark-read" onPress={onMarkAsRead}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark as read
                      </DropdownItem>
                    ) : null}
                    <DropdownItem key="dismiss" onPress={onDismiss}>
                      <X className="h-4 w-4 mr-2" />
                      Dismiss
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
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
        <CardBody className="p-6 text-center">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-medium text-muted-foreground">No notifications</h3>
          <p className="text-xs text-muted-foreground mt-1">
            You're all caught up! New notifications will appear here.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadNotifications > 0 && (
              <Chip color="danger" size="sm" className="h-5 text-xs">
                {unreadNotifications}
              </Chip>
            )}
          </h3>
          
          <div className="flex items-center gap-2">
            {/* Filter */}
            <Dropdown>
              <DropdownTrigger>
                <Button variant="bordered" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  {filter === 'all' ? 'All' : 'Unread'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="all" onPress={() => setFilter('all')}>
                  <Clock className="h-4 w-4 mr-2" />
                  All notifications
                </DropdownItem>
                <DropdownItem key="unread" onPress={() => setFilter('unread')}>
                  <Bell className="h-4 w-4 mr-2" />
                  Unread only
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* Settings */}
            <Button variant="bordered" size="sm">
              <Settings className="h-4 w-4" />
            </Button>

            {/* Clear All */}
            {notifications.length > 0 && (
              <Button variant="bordered" size="sm" onPress={clearNotifications}>
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-0">
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
      </CardBody>
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
      variant="light"
      size="sm"
      onPress={onClick}
      className={cn('relative', className)}
    >
      <Bell className="h-5 w-5" />
      {unreadNotifications > 0 && (
        <Chip 
          color="danger" 
          size="sm"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
        >
          {unreadNotifications > 9 ? '9+' : unreadNotifications}
        </Chip>
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
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <Card className={cn(
      'fixed bottom-4 right-4 w-80 shadow-lg border-l-4 transition-all duration-300 transform z-50',
      notification.type === 'error' && 'border-l-red-500 bg-red-50',
      notification.type === 'warning' && 'border-l-yellow-500 bg-yellow-50',
      notification.type === 'success' && 'border-l-green-500 bg-green-50',
      notification.type === 'info' && 'border-l-blue-500 bg-blue-50',
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    )}>
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          </div>
          
          <Button
            variant="light"
            size="sm"
            onPress={onDismiss}
            className="h-6 w-6 p-0 min-w-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};