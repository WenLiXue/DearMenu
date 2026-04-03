import { useEffect } from 'react';
import { Badge } from 'antd-mobile';
import { useNotificationStore } from '../stores/notificationStore';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    // 每30秒刷新一次
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <Badge content={unreadCount > 0 ? unreadCount : undefined}>
      <span
        onClick={() => navigate('/notifications')}
        style={{ cursor: 'pointer', fontSize: '20px' }}
      >
        🔔
      </span>
    </Badge>
  );
}