import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, TextArea } from 'antd-mobile';
import { useMessageStore } from '../stores/messageStore';
import { useAuthStore } from '../stores/authStore';
import { Toast } from 'antd-mobile';
import './Chat.css';

export default function Chat() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { conversations, currentMessages, fetchMessages, sendMessage } = useMessageStore();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取对方用户名
  const otherUser = conversations.find(c => c.user_id === userId);
  const otherUsername = otherUser?.username || '聊天';

  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
    }
  }, [userId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !userId || sending) return;

    setSending(true);
    try {
      await sendMessage(userId, inputText.trim());
      setInputText('');
      Toast.success('发送成功');
    } catch {
      Toast.fail('发送失败');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) return '今天';
    if (hours < 48) return '昨天';
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-container">
      <NavBar onBack={() => navigate(-1)}>
        {otherUsername}
      </NavBar>

      <div className="chat-messages">
        {currentMessages.map((message, index) => {
          const isMe = message.sender_id !== userId;
          const showDate = index === 0 ||
            formatDate(currentMessages[index - 1].created_at) !== formatDate(message.created_at);

          return (
            <div key={message.id}>
              {showDate && (
                <div className="chat-date-divider">
                  {formatDate(message.created_at)}
                </div>
              )}
              <div className={`chat-message ${isMe ? 'chat-message-me' : 'chat-message-other'}`}>
                <div className="chat-bubble">
                  {message.content}
                </div>
                <div className="chat-time">
                  {formatTime(message.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <TextArea
          value={inputText}
          onChange={setInputText}
          placeholder="输入消息..."
          rows={1}
          autoSize={{ minRows: 1, maxRows: 4 }}
          onSubmit={handleSend}
        />
        <Sendable.Button
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
        >
          发送
        </Sendable.Button>
      </div>
    </div>
  );
}