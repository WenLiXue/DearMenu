import { useEffect } from 'react';
import { List, Badge, Empty } from 'antd-mobile';
import { NavBar } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useMessageStore } from '../stores/messageStore';

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'husband': return '老公 👨‍🍳';
    case 'wife': return '老婆 💕';
    default: return role;
  }
};

const formatTime = (time: string) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
  }
  if (hours < 24) {
    return `${Math.floor(hours)}小时前`;
  }
  if (hours < 48) {
    return '昨天';
  }
  return date.toLocaleDateString();
};

export default function Messages() {
  const { conversations, fetchConversations } = useMessageStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="page-container">
      <NavBar>消息</NavBar>

      {conversations.length === 0 ? (
        <Empty description="暂无消息" />
      ) : (
        <List>
          {conversations.map(conversation => (
            <List.Item
              key={conversation.user_id}
              prefix={
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: conversation.role === 'husband' ? '#E8F5E9' : '#FFF3E0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {conversation.role === 'husband' ? '👨‍🍳' : '💕'}
                </div>
              }
              description={
                conversation.last_message ? (
                  <div style={{ color: conversation.unread_count > 0 ? '#333' : '#999' }}>
                    {conversation.last_message.content.length > 30
                      ? conversation.last_message.content.slice(0, 30) + '...'
                      : conversation.last_message.content}
                  </div>
                ) : undefined
              }
              extra={
                <div style={{ textAlign: 'right' }}>
                  {conversation.last_message && (
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {formatTime(conversation.last_message.created_at)}
                    </div>
                  )}
                  {conversation.unread_count > 0 && (
                    <Badge content={conversation.unread_count} />
                  )}
                </div>
              }
              onClick={() => navigate(`/chat/${conversation.user_id}`)}
            >
              <div style={{ fontWeight: conversation.unread_count > 0 ? 600 : 400 }}>
                {getRoleLabel(conversation.role)}
              </div>
            </List.Item>
          ))}
        </List>
      )}
    </div>
  );
}