import { useEffect } from 'react';
import { NavBar, Card, Tag, Empty } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const navigate = useNavigate();
  const { history, fetchHistory, isLoading } = useDishStore();

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      <NavBar
        back="返回"
        onBack={() => navigate('/home')}
        style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)', color: '#FFF' }}
      >
        点餐历史
      </NavBar>

      <div style={{ padding: '16px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : history.length === 0 ? (
          <Empty description="暂无点餐历史" />
        ) : (
          history.map((record) => (
            <Card
              key={record.id}
              style={{ borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', color: '#2C3E50' }}>{record.dish?.name || '未知菜品'}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} style={{ color: record.dish && star <= record.dish.rating ? '#FFE66D' : '#ddd', fontSize: '14px' }}>
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
                  <span style={{ color: '#999', fontSize: '12px' }}>
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
