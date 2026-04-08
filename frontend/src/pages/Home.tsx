import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import './Home.css';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return { text: '夜深了', icon: '🌙' };
  if (hour < 9) return { text: '早上好', icon: '🌅' };
  if (hour < 12) return { text: '上午好', icon: '☀️' };
  if (hour < 14) return { text: '中午好', icon: '🌞' };
  if (hour < 18) return { text: '下午好', icon: '🈵️' };
  if (hour < 22) return { text: '晚上好', icon: '🌆' };
  return { text: '夜深了', icon: '🌙' };
}

function getRecommendReason() {
  const reasons = [
    '想吃点让人开心的',
    '今天值得一顿好的',
    '吃点喜欢的犒劳自己',
    '美味，是最好的治愈',
    '今天也要元气满满',
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

export default function Home() {
  const navigate = useNavigate();
  const { fetchRandomDish, randomDish } = useDishStore();
  const [animateCard, setAnimateCard] = useState(false);

  const greeting = getGreeting();

  useEffect(() => {
    fetchRandomDish();
  }, []);

  const handleRandomDecide = () => {
    setAnimateCard(true);
    setTimeout(() => {
      fetchRandomDish();
      setAnimateCard(false);
    }, 300);
  };

  const handleOrder = () => {
    navigate('/dishes');
  };

  return (
    <div className="page-container">
      <NavBar
        back={null}
        right={
          <span
            onClick={() => navigate('/profile')}
            style={{ color: 'var(--text-primary)', cursor: 'pointer', fontSize: '15px' }}
          >
            👰
          </span>
        }
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}
      >
        🌸 老婆端
      </NavBar>

      <div className="page-content compact">
        {/* 欢迎区域 - 紧凑单行 */}
        <div className="welcome-section">
          <div className="greeting-row">
            <span className="greeting-icon">{greeting.icon}</span>
            <span className="greeting-text">{greeting.text}，宝贝 👰</span>
          </div>
        </div>

        {/* 推荐卡片 */}
        {randomDish && (
          <div className={`random-dish-section ${animateCard ? 'fade-out' : 'fade-in'}`}>
            <div className="random-dish-header">
              <span className="random-dish-icon">💕</span>
              <span className="random-dish-label">今日推荐</span>
            </div>
            <h3 className="random-dish-name">{randomDish.name}</h3>
            <p className="random-dish-reason">"{getRecommendReason()}"</p>
            <div className="random-dish-buttons">
              <Button size="small" className="order-btn" onClick={handleOrder}>
                🍽️ 点餐
              </Button>
              <Button size="small" className="reroll-btn" onClick={handleRandomDecide}>
                🔄 换一批
              </Button>
            </div>
          </div>
        )}

        {/* 快捷入口 - 三列布局 */}
        <div className="quick-actions">
          <div className="quick-action-card" onClick={() => navigate('/dishes')}>
            <div className="quick-action-icon">🍽️</div>
            <h3 className="quick-action-title">点餐</h3>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/categories')}>
            <div className="quick-action-icon">📂</div>
            <h3 className="quick-action-title">分类</h3>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/favorites')}>
            <div className="quick-action-icon">❤️</div>
            <h3 className="quick-action-title">收藏</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
