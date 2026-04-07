import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button, Toast } from 'antd-mobile';
import { useAuthStore } from '../stores/authStore';
import { useDishStore } from '../stores/dishStore';
import { generateInviteCode } from '../api';
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

function getDailyQuote() {
  const quotes = [
    '想吃点什么让人开心的 💕',
    '今天也要好好吃饭哦 ✨',
    '生活不止眼前的忙碌，还有美食 🍽️',
    '好好吃饭，是对生活最好的尊重 💕',
    '无论多忙，别忘了善待自己的胃 ✨',
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
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
  const { user, familyId } = useAuthStore();
  const { fetchRandomDish, randomDish } = useDishStore();
  const [animateCard, setAnimateCard] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>(familyId || '');

  const greeting = getGreeting();
  const dailyQuote = getDailyQuote();

  useEffect(() => {
    if (familyId) {
      setInviteCode(familyId);
    }
  }, [familyId]);

  useEffect(() => {
    fetchRandomDish();
  }, []);

  const handleCopyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      Toast.show({ content: '邀请码已复制', icon: 'success' });
    }
  };

  const handleRegenerateCode = async () => {
    try {
      const result = await generateInviteCode();
      setInviteCode(result.invite_code);
      Toast.show({ content: '邀请码已重新生成', icon: 'success' });
    } catch (error: any) {
      Toast.show({ content: error.message || '生成失败', icon: 'fail' });
    }
  };

  const handleRandomDecide = () => {
    setAnimateCard(true);
    setTimeout(() => {
      fetchRandomDish();
      setAnimateCard(false);
    }, 300);
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
            👤
          </span>
        }
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}
      >
        今晚吃点什么
      </NavBar>

      <div className="page-content home-content">
        {/* 欢迎区域 */}
        <div className="welcome-section">
          <div className="greeting-row">
            <span className="greeting-icon">{greeting.icon}</span>
            <span className="greeting-text">{greeting.text}，{user?.username}</span>
          </div>
        </div>

        {/* 今日一句 */}
        <div className="daily-quote">
          <p className="daily-quote-text">{dailyQuote}</p>
        </div>

        {/* 推荐卡片 */}
        {randomDish && (
          <div className={`random-dish-section ${animateCard ? 'fade-out' : 'fade-in'}`}>
            <div className="random-dish-header">
              <span className="random-dish-icon">💕</span>
              <span className="random-dish-label">今日推荐</span>
            </div>
            <h3 className="random-dish-name">{randomDish.name}</h3>
            <p className="random-dish-reason">{getRecommendReason()}</p>
            <Button
              size="small"
              className="reroll-btn"
              onClick={handleRandomDecide}
            >
              换一批
            </Button>
          </div>
        )}

        {/* 快捷入口 - 两列布局 */}
        <div className="quick-actions">
          <div className="quick-action-card" onClick={() => navigate('/dishes')}>
            <div className="quick-action-icon">🍽️</div>
            <h3 className="quick-action-title">点餐</h3>
            <p className="quick-action-desc">浏览菜单</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/categories')}>
            <div className="quick-action-icon">📂</div>
            <h3 className="quick-action-title">分类</h3>
            <p className="quick-action-desc">整理口味</p>
          </div>
        </div>

        {/* 邀请码区域 - 仅老婆角色显示 */}
        {user?.role === 'wife' && (
          <div className="invite-code-card">
            <div className="invite-code-header">
              <span className="invite-code-label">家庭邀请码</span>
              <div className="invite-code-actions">
                <Button size="small" className="invite-code-btn" onClick={handleCopyInviteCode}>
                  复制
                </Button>
                <Button size="small" className="invite-code-btn-regenerate" onClick={handleRegenerateCode}>
                  重新生成
                </Button>
              </div>
            </div>
            <p className="invite-code-value">{inviteCode || '加载中...'}</p>
            <p className="invite-code-desc">分享给老公，加入家庭</p>
          </div>
        )}
      </div>
    </div>
  );
}
