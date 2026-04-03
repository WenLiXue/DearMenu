import { useEffect } from 'react';
import { NavBar } from 'antd-mobile';
import { useHusbandStore } from '../../stores/husbandStore';
import './HusbandHistory.css';

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hour}:${minute}`;
}

export default function HusbandHistory() {
  const { history, fetchHistory, isLoading } = useHusbandStore();

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="history-page">
      <NavBar
        back="/husband"
        style={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #6EE7DF 100%)', color: '#FFF' }}
      >
        历史记录
      </NavBar>

      <div className="history-content">
        {history.length === 0 ? (
          <div className="history-empty">
            <span className="history-empty-icon">📜</span>
            <p className="history-empty-text">还没有做菜记录</p>
            <p className="history-empty-sub">开始做饭吧，大厨！</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((task) => (
              <div key={task.id} className="history-item">
                <div className="history-item-image">
                  {task.dish.image_url ? (
                    <img src={task.dish.image_url} alt={task.dish.name} />
                  ) : (
                    <span className="history-item-placeholder">🍽️</span>
                  )}
                </div>
                <div className="history-item-info">
                  <h4 className="history-item-name">{task.dish.name}</h4>
                  <p className="history-item-time">
                    {task.completed_at ? formatTime(task.completed_at) : ''}
                  </p>
                </div>
                <div className="history-item-status">✔️</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
