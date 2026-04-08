import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import './Home.css';

const allTabs = [
  { key: '/home', title: '首页', icon: '🏠' },
  { key: '/dishes', title: '点餐', icon: '🍽️' },
  { key: '/orders', title: '订单', icon: '📋' },
  { key: '/favorites', title: '收藏', icon: '❤️' },
  { key: '/profile', title: '我的', icon: '👤' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return { text: '夜深了', icon: '🌙' };
  if (hour < 9) return { text: '早上好', icon: '☀️' };
  if (hour < 12) return { text: '上午好', icon: '🌤️' };
  if (hour < 14) return { text: '中午好', icon: '☀️' };
  if (hour < 18) return { text: '下午好', icon: '🌤️' };
  if (hour < 22) return { text: '晚上好', icon: '🌙' };
  return { text: '夜深了', icon: '🌙' };
}

function getRecommendReason() {
  const reasons = [
    '收藏多的',
    '很久没吃了',
    '评分很高的',
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
  const [animateKey, setAnimateKey] = useState(0);

  const greeting = getGreeting();

  useEffect(() => {
    fetchRandomDish();
  }, []);

  const handleRandomDecide = () => {
    setAnimateKey((k) => k + 1);
    fetchRandomDish();
  };

  const handleOrder = () => {
    navigate('/dishes');
  };

  return (
    <div className="home-page">
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
        今天吃什么？
      </NavBar>

      <div className="home-greeting">
        <span className="greeting-icon">{greeting.icon}</span>
        <span className="greeting-text">{greeting.text}，亲爱的</span>
      </div>

      <div className="home-recommendation">
        <div className={`home-card anim-heartbeat`} key={animateKey}>
          <div className="home-card-header">
            <span className="home-card-label">今日推荐</span>
          </div>

          {randomDish ? (
            <>
              <div className="home-dish-name">{randomDish.name}</div>

              <div className="home-rating">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < Math.round(randomDish.rating || 0) ? 'star-filled' : 'star-empty'}>
                    ★
                  </span>
                ))}
              </div>

              <div className="home-reason">"{getRecommendReason()}"</div>

              {randomDish.last_eaten_days !== undefined && (
                <div className="home-last-eaten">上次吃: {randomDish.last_eaten_days}天前</div>
              )}

              <div className="home-buttons">
                <Button className="btn-primary" onClick={handleOrder}>
                  就吃这个！
                </Button>
                <Button className="btn-secondary" onClick={handleRandomDecide}>
                  换一道
                </Button>
              </div>
            </>
          ) : (
            <div className="home-empty">还没有菜品呢，添加一个吧~</div>
          )}
        </div>
      </div>

      <div className="home-grid">
        <div className="grid-item" onClick={() => navigate('/dishes')}>
          <span className="grid-icon">🍽️</span>
          <span className="grid-label">点餐</span>
        </div>
        <div className="grid-item" onClick={() => navigate('/categories', { state: { hideTabBar: true } })}>
          <span className="grid-icon">🏷️</span>
          <span className="grid-label">分类</span>
        </div>
        <div className="grid-item" onClick={() => navigate('/favorites')}>
          <span className="grid-icon">❤️</span>
          <span className="grid-label">收藏</span>
        </div>
        <div className="grid-item" onClick={() => navigate('/random')}>
          <span className="grid-icon">🎲</span>
          <span className="grid-label">随机</span>
        </div>
      </div>
    </div>
  );
}
