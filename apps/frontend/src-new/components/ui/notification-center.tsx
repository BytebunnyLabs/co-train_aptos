'use client';

import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
  ScrollShadow,
  Divider
} from '@heroui/react';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  X,
  Check,
  Trash2,
  MarkAllAsRead
} from 'lucide-react';
import { useUIStore, type Notification } from '@/lib/stores';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount,
    removeNotification, 
    markNotificationRead, 
    markAllNotificationsRead,
    clearNotifications 
  } = useUIStore();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-danger" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'primary';
    }
  };

  const handleMarkAsRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleRemove = (id: string) => {
    removeNotification(id);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead();
  };

  const handleClearAll = () => {
    clearNotifications();
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      placement="top-center"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Chip size="sm" color="danger" variant="flat">
                  {unreadCount} new
                </Chip>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="light"
                  startContent={<Check className="h-4 w-4" />}
                  onClick={handleMarkAllAsRead}
                >
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  startContent={<Trash2 className="h-4 w-4" />}
                  onClick={handleClearAll}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="px-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-foreground-400 mb-4" />
              <p className="text-foreground-600 text-lg">No notifications yet</p>
              <p className="text-foreground-400 text-sm">
                You'll see training updates, rewards, and system notifications here
              </p>
            </div>
          ) : (
            <ScrollShadow className="max-h-96 px-6">
              <div className="space-y-4">
                {/* Unread Notifications */}
                {unreadNotifications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground-600 mb-3">
                      Unread ({unreadNotifications.length})
                    </p>
                    <div className="space-y-2">
                      {unreadNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onRemove={handleRemove}
                          getIcon={getNotificationIcon}
                          getColor={getNotificationColor}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider between unread and read */}
                {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                  <Divider className="my-4" />
                )}

                {/* Read Notifications */}
                {readNotifications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground-600 mb-3">
                      Read ({readNotifications.length})
                    </p>
                    <div className="space-y-2">
                      {readNotifications.slice(0, 10).map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onRemove={handleRemove}
                          getIcon={getNotificationIcon}
                          getColor={getNotificationColor}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollShadow>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  getIcon: (type: Notification['type']) => React.ReactNode;
  getColor: (type: Notification['type']) => string;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onRemove, 
  getIcon, 
  getColor 
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });

  return (
    <Card 
      className={`${!notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''} hover:shadow-md transition-shadow`}
    >
      <CardBody className="px-4 py-3">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-foreground-700'}`}>
                  {notification.title}
                </p>
                <p className={`text-sm mt-1 ${!notification.read ? 'text-foreground-600' : 'text-foreground-500'}`}>
                  {notification.message}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <p className="text-xs text-foreground-400">{timeAgo}</p>
                  <Chip size="sm" color={getColor(notification.type) as any} variant="flat">
                    {notification.type}
                  </Chip>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 ml-2">
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onClick={() => onMarkAsRead(notification.id)}
                    className="text-foreground-400 hover:text-foreground-600"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onClick={() => onRemove(notification.id)}
                  className="text-foreground-400 hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex items-center space-x-2 mt-3">
                {notification.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant === 'primary' ? 'solid' : 'flat'}
                    color={action.variant === 'destructive' ? 'danger' : 'primary'}
                    onClick={action.action}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}