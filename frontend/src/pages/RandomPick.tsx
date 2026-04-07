import { useEffect, useState } from 'react';
import { NavBar, Card, Button, Tag, Empty, Toast } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import { useNavigate } from 'react-router-dom';
import './RandomPick.css';

function getRecommendReason() {
  const reasons = [
    '因为你今天工作辛苦啦',
    '因为你值得美味的一餐',
    '因为你最近表现很棒',
    '因为你今天状态很好',
    '因为你需要补充能量',
    '因为你看起来饿了',
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

export default function RandomPick() {
  const navigate = useNavigate();
  const { randomDish, fetchRandomDish, addFavorite, isLoading } = useDishStore();
  const [animating, setAnimating] = useState(false);
  const [currentReason, setCurrentReason] = useState('');

  useEffect(() => {
    fetchRandomDish();
    setCurrentReason(getRecommendReason());
  }, []);

  const handleReroll = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      fetchRandomDish();
      setCurrentReason(getRecommendReason());
      setAnimating(false);
    }, 400);
  };

  const handleDecide = () => {
    if (animating) return;
    Toast.show({ content: '✨ 就决定是你了！', icon: 'success' });
    handleReroll();
  };

  const handleFavorite = async () => {
    if (randomDish) {
      try {
        await addFavorite(randomDish.id);
        Toast.show({ content: '❤️ 收藏成功~', icon: 'success' });
      } catch {
        Toast.show({ content: '哎呀，失败了', icon: 'fail' });
      }
    }
  };

  return (
    <div className="page-container">
      <NavBar
        back="返回"
        onBack={() => navigate('/home')}
        style={{ background: 'linear-gradient(135deg, #FFE66D 0%, #FFF0A0 100%)', color: '#333' }}
      >
        随机推荐
      </NavBar>

      <div className="random-content">
        <Card className={`random-main-card ${animating ? 'card-spin' : ''}`}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <span style={{ fontSize: '24px' }}>🔮</span>
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>马上就好啦~</p>
            </div>
          ) : randomDish ? (
            <div className="random-card-inner">
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(255,107,107,0.35)'
              }}>
                <span style={{ fontSize: '36px' }}>{randomDish.category?.icon || '🍽️'}</span>
              </div>

              <h2 style={{ color: '#333', margin: '0 0 8px', fontSize: '22px', fontWeight: 600 }}>{randomDish.name}</h2>

              <p className="recommend-reason">{currentReason}</p>

              <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginBottom: '12px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} style={{ color: star <= randomDish.rating ? '#FFE66D' : '#ddd', fontSize: '16px' }}>
                    ★
                  </span>
                ))}
              </div>

              {randomDish.tags && randomDish.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {randomDish.tags.map((tag) => (
                    <Tag key={tag} color="primary" style={{ borderRadius: '10px' }}>{tag}</Tag>
                  ))}
                </div>
              )}

              {randomDish.category && (
                <Tag color="success" style={{ marginBottom: '16px', borderRadius: '12px', padding: '4px 12px' }}>
                  {randomDish.category.icon} {randomDish.category.name}
                </Tag>
              )}

              <div className="button-group">
                <Button
                  color="primary"
                  size="small"
                  className="random-btn favorite-btn"
                  onClick={handleFavorite}
                >
                  ❤️ 收藏
                </Button>
                <Button
                  size="small"
                  className="random-btn reroll-btn"
                  onClick={handleReroll}
                >
                  🔄 换个看看
                </Button>
              </div>

              <Button
                block
                className="decide-btn"
                onClick={handleDecide}
              >
                ✨ 帮你决定
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <Empty
                image={
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎀</div>
                }
                description={
                  <div>
                    <p style={{ color: '#666', margin: '0 0 4px', fontSize: '14px' }}>还没有菜品呢</p>
                    <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>添加一个吧~</p>
                  </div>
                }
              />
            </div>
          )}
        </Card>

        <Card className="random-tip-card">
          <div style={{ padding: '12px', textAlign: 'center' }}>
            <h3 style={{ color: '#333', margin: '0 0 6px', fontSize: '14px', fontWeight: 600 }}>🎯 选择困难？</h3>
            <p style={{ color: '#999', margin: 0, fontSize: '12px', lineHeight: 1.4 }}>
              让系统帮你选一个吧，点上面的"帮你决定"~
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
