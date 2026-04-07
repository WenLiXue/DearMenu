import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Button, Toast } from 'antd-mobile';
import { useAuthStore } from '../stores/authStore';
import { useDishStore } from '../stores/dishStore';
import { generateInviteCode } from '../api';
import './Home.css';

function InteractiveCard({ onClick, children, style }: { onClick?: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="interactive-card" onClick={onClick} style={style}>
      {children}
    </div>
  );
}

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

function getRecommendReason(categoryName: string | undefined) {
  const reasons = [
    '因为你今天想吃清淡的',
    '因为你最近工作辛苦啦',
    '因为你值得吃点好的',
    '因为你今天表现很棒',
    '因为你值得美味的一餐',
  ];
  if (!categoryName) return reasons[Math.floor(Math.random() * reasons.length)];
  return `因为你今天想吃${categoryName}味的~`;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout, familyId } = useAuthStore();
  const { fetchRandomDish, randomDish } = useDishStore();
  const [animateCard, setAnimateCard] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>(familyId || '');

  const greeting = getGreeting();

  useEffect(() => {
    if (familyId) {
      setInviteCode(familyId);
    }
  }, [familyId]);

  const handleCopyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      Toast.show({ content: '邀请码已复制~', icon: 'success' });
    }
  };

  const handleRegenerateCode = async () => {
    try {
      const result = await generateInviteCode();
      setInviteCode(result.invite_code);
      Toast.show({ content: '邀请码已重新生成~', icon: 'success' });
    } catch (error: any) {
      Toast.show({ content: error.message || '生成邀请码失败', icon: 'fail' });
    }
  };

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

  return (
    <div className="page-container">
      <NavBar
        back={null}
        right={
          <span onClick={() => { logout(); navigate('/login'); }} style={{ color: '#FFF', cursor: 'pointer', fontSize: '13px' }}>
            退出
          </span>
        }
        style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)', color: '#FFF' }}
      >
        你的小菜单
      </NavBar>

      <div className="page-content home-content">
        <div className="welcome-section">
          <div className="greeting-row">
            <span className="greeting-icon">{greeting.icon}</span>
            <span className="greeting-text">{greeting.text}，{user?.username}</span>
          </div>
          <h1 className="main-title">今天吃什么呀？</h1>
        </div>

        {/* 邀请码区域 - 仅 wife 角色显示 */}
        {user?.role === 'wife' && (
          <Card style={{ marginBottom: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>家庭邀请码</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#FF6B6B', fontFamily: 'monospace' }}>
                  {inviteCode || '加载中...'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="small" color="primary" onClick={handleCopyInviteCode}>
                  复制
                </Button>
                <Button size="small" color="danger" onClick={handleRegenerateCode}>
                  重新生成
                </Button>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              老公可以通过这个邀请码加入家庭~
            </div>
          </Card>
        )}

        <div className="card-list">
          <InteractiveCard onClick={() => navigate('/dishes')}>
            <div className="card-inner">
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: '12px', fontSize: '22px', boxShadow: '0 4px 12px rgba(255,107,107,0.3)'
              }}>
                🍽️
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '15px', fontWeight: 600 }}>开始点菜</h3>
                <p style={{ margin: '2px 0 0', color: '#999', fontSize: '12px' }}>看看今天有什么好吃的</p>
              </div>
              <span style={{ color: '#FF6B6B', fontSize: '18px' }}>›</span>
            </div>
          </InteractiveCard>

          <InteractiveCard onClick={() => navigate('/categories')}>
            <div className="card-inner">
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #4ECDC4 0%, #6EE7DF 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: '12px', fontSize: '22px', boxShadow: '0 4px 12px rgba(78,205,196,0.3)'
              }}>
                📂
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '15px', fontWeight: 600 }}>分类管理</h3>
                <p style={{ margin: '2px 0 0', color: '#999', fontSize: '12px' }}>整理你喜欢的口味</p>
              </div>
              <span style={{ color: '#4ECDC4', fontSize: '18px' }}>›</span>
            </div>
          </InteractiveCard>

          <InteractiveCard onClick={() => navigate('/random')} style={{ background: 'linear-gradient(135deg, #FFE66D 0%, #FFF0A0 100%)' }}>
            <div className="card-inner">
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: '12px', fontSize: '22px'
              }}>
                🎲
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '15px', fontWeight: 600 }}>随机决定</h3>
                <p style={{ margin: '2px 0 0', color: '#666', fontSize: '12px' }}>纠结的时候就点我呀</p>
              </div>
              <span style={{ fontSize: '24px' }}>✨</span>
            </div>
          </InteractiveCard>
        </div>

        {randomDish && (
          <div className={`random-dish-section ${animateCard ? 'fade-out' : 'fade-in'}`}>
            <div className="random-dish-header">
              <span className="random-dish-icon">💕</span>
              <span className="random-dish-label">今日推荐</span>
            </div>
            <h3 className="random-dish-name">{randomDish.name}</h3>
            <p className="random-dish-reason">{getRecommendReason(randomDish.category?.name)}</p>
            <Button
              size="small"
              className="reroll-btn"
              onClick={handleRandomDecide}
            >
              🎲 换一批
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
