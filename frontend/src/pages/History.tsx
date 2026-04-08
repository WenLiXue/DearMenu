import { useEffect } from 'react';
import { NavBar, Card, Tag, Empty } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import { useNavigate } from 'react-router-dom';
import './History.css';

export default function History() {
  const navigate = useNavigate();
  const { history, fetchHistory, isLoading } = useDishStore();

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="history-page">
      <NavBar
        className="history-navbar"
        back="返回"
        onBack={() => navigate('/home')}
      >
        点餐历史
      </NavBar>

      <div className="history-content">
        {isLoading ? (
          <div className="history-loading">加载中...</div>
        ) : history.length === 0 ? (
          <Empty description="暂无点餐历史" />
        ) : (
          history.map((record) => (
            <Card
              key={record.id}
              className="history-card"
            >
              <div className="history-card-content">
                <div className="history-card-header">
                  <div>
                    <h3 className="history-dish-name">{record.dish?.name || '未知菜品'}</h3>
                    <div className="history-meta">
                      <div className="history-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`history-star ${record.dish && star <= record.dish.rating ? 'history-star-active' : 'history-star-inactive'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {record.dish?.category && (
                      <Tag color="success">{record.dish.category.icon} {record.dish.category.name}</Tag>
                    )}
                    {record.dish?.tags && record.dish.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag} color="warning" style={{ marginLeft: '4px' }}>{tag}</Tag>
                    ))}
                  </div>
                  <span className="history-time">
                    {new Date(record.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
