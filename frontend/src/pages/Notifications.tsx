import { useEffect } from 'react';
import { List, SwipeAction, Badge, Empty } from 'antd-mobile';
import { NavBar } from 'antd-mobile';
import { useNotificationStore } from '../stores/notificationStore';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message': return '💬';
    case 'task': return '👨‍🍳';
    case 'celebration': return '🎉';
    default: return '🔔';
  }
};

export default function Notifications() {
  const {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="page-container">
      <NavBar
        right={
          <span
            onClick={markAllAsRead}
            style={{ color: '#FFF', cursor: 'pointer' }}
          >
            全部已读
          </span>
        }
      >
        通知
      </NavBar>

      <List>
        {notifications.map(notification => (
          <SwipeAction
            key={notification.id}
            rightActions={[
              {
                key: 'delete',
                text: '删除',
                color: 'danger',
                onClick: () => deleteNotification(notification.id)
              }
            ]}
          >
            <List.Item
              prefix={getNotificationIcon(notification.type)}
              description={notification.content}
              extra={!notification.is_read && <Badge dot />}
              onClick={() => markAsRead(notification.id)}
            >
              {notification.title}
            </List.Item>
          </SwipeAction>
        ))}
      </List>

      {notifications.length === 0 && (
        <Empty description="暂无通知" />
      )}
    </div>
  );
}