import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, Toast } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import { useOrderStore } from '../stores/orderStore';
import './Home.css';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return { emoji: '🌙', text: '夜深了', meal: '早点休息吧～' };
  if (hour < 9) return { emoji: '☀️', text: '早上好', meal: '早餐想好吃什么了吗' };
  if (hour < 12) return { emoji: '🌤️', text: '上午好', meal: '午餐准备吃什么' };
  if (hour < 14) return { emoji: '☀️', text: '中午好', meal: '午餐时间到啦' };
  if (hour < 18) return { emoji: '🌤️', text: '下午好', meal: '下午茶来点啥' };
  if (hour < 22) return { emoji: '🌙', text: '晚上好', meal: '晚餐想吃点好的' };
  return { emoji: '🌙', text: '夜深了', meal: '夜宵来一份？' };
}

function getRecommendReason() {
  const reasons = [
    '收藏多的，再来一遍',
    '很久没吃啦',
    '评分超高的',
    '老婆最爱的',
    '今天值得一顿好的',
    '吃点喜欢的犒劳自己',
    '美味治愈一切',
    '今天也要元气满满',
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

export default function Home() {
  const navigate = useNavigate();
  const { fetchRandomDish, randomDish } = useDishStore();
  const { createOrder } = useOrderStore();
  const [animateKey, setAnimateKey] = useState(0);
  const [isOrdering, setIsOrdering] = useState(false);

  const greeting = getGreeting();

  useEffect(() => {
    fetchRandomDish();
  }, []);

  const handleRandomDecide = () => {
    setAnimateKey((k) => k + 1);
    fetchRandomDish();
  };

  const handleOrder = () => {
    if (!randomDish) return;
    setIsOrdering(true);

    Dialog.confirm({
      title: '🎉 确认点餐',
      content: (
        <div className="order-confirm-content">
          <div className="order-confirm-dish">{randomDish.name}</div>
          {randomDish.tags && randomDish.tags.length > 0 && (
            <div className="order-confirm-tags">
              {randomDish.tags.map(tag => (
                <span key={tag} className="order-confirm-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      ),
      confirmText: '就吃这个！🍽️',
      cancelText: '换一道',
      onConfirm: async () => {
        try {
          await createOrder({ dish_id: randomDish.id });
          Toast.show({
            content: '下单成功！老公收到啦～',
            icon: 'success',
            duration: 2000
          });
          // 刷新随机菜品
          setTimeout(() => {
            fetchRandomDish();
            setAnimateKey(k => k + 1);
          }, 1500);
        } catch (e: any) {
          Toast.show({
            content: e.message || '下单失败',
            icon: 'fail'
          });
        } finally {
          setIsOrdering(false);
        }
      },
      onCancel: () => {
        handleRandomDecide();
        setIsOrdering(false);
      }
    });
  };

  const handleBrowseMenu = () => {
    navigate('/dishes');
  };

  return (
    <div className="home-page">
      {/* 顶部问候区 */}
      <header className="home-header">
        <div className="home-avatar">👰</div>
        <div className="home-greeting">
          <span className="greeting-emoji">{greeting.emoji}</span>
          <span className="greeting-text">{greeting.text}，老婆大人</span>
        </div>
        <div className="home-meal-tip">{greeting.meal}</div>
      </header>

      {/* 推荐卡片区 */}
      <main className="home-main">
        <div className="recommend-section">
          <div className="recommend-label">✨ 今日推荐</div>

          {randomDish ? (
            <div className={`recommend-card ${isOrdering ? 'ordering' : ''}`} key={animateKey}>
              {/* 装饰背景 */}
              <div className="card-bg-emoji">🍽️</div>

              {/* 内容 */}
              <div className="card-content">
                <h1 className="card-dish-name">{randomDish.name}</h1>

                <div className="card-tags">
                  {randomDish.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="card-tag">{tag}</span>
                  ))}
                </div>

                <div className="card-rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(randomDish.rating || 0) ? 'star-filled' : 'star-empty'}>★</span>
                  ))}
                </div>

                <div className="card-reason">"{getRecommendReason()}"</div>

                {randomDish.last_eaten_days !== undefined && (
                  <div className="card-last-eaten">上次吃：{randomDish.last_eaten_days}天前</div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="card-actions">
                <button
                  className="btn-order"
                  onClick={handleOrder}
                  disabled={isOrdering}
                >
                  <span className="btn-icon">🍽️</span>
                  <span className="btn-text">就吃这个！</span>
                </button>
                <button className="btn-change" onClick={handleRandomDecide}>
                  <span className="btn-icon">🔄</span>
                  <span className="btn-text">换一个</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="recommend-empty">
              <div className="empty-icon">🍽️</div>
              <p>还没有菜品哦</p>
              <button className="btn-add" onClick={handleBrowseMenu}>
                去添加一道菜
              </button>
            </div>
          )}
        </div>

        {/* 底部快捷入口 */}
        <div className="home-quick-actions">
          <button className="quick-action" onClick={handleBrowseMenu}>
            <span className="quick-icon">📋</span>
            <span className="quick-text">浏览菜单</span>
          </button>
          <button className="quick-action" onClick={() => navigate('/favorites')}>
            <span className="quick-icon">❤️</span>
            <span className="quick-text">我的收藏</span>
          </button>
          <button className="quick-action" onClick={() => navigate('/orders')}>
            <span className="quick-icon">📦</span>
            <span className="quick-text">我的订单</span>
          </button>
        </div>
      </main>
    </div>
  );
}
