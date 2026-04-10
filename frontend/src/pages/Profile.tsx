import { useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';
import { useAuthStore } from '../stores/authStore';
import { generateInviteCode, getFamilyInfo } from '../api';
import { useState, useEffect } from 'react';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, familyId } = useAuthStore();
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    if (familyId) {
      getFamilyInfo(familyId).then((family) => {
        setInviteCode(family.invite_code);
      }).catch(() => {
        generateInviteCode().then((result) => {
          setInviteCode(result.invite_code);
        });
      });
    }
  }, [familyId]);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isWife = user?.role === 'wife';

  const menuItems = [
    { icon: '📜', text: '点餐历史', path: '/history', state: { hideTabBar: true } },
    { icon: '📂', text: '分类管理', path: '/categories', state: { hideTabBar: true } },
    { icon: '🎲', text: '随机推荐', path: '/random' },
    { icon: '❤️', text: '我的收藏', path: '/favorites' },
  ];

  return (
    <div className="profile-page">
      {/* 顶部用户卡片 */}
      <header className="profile-header">
        <div className={`profile-avatar ${isWife ? '' : 'husband'}`}>
          {isWife ? '👰' : '👨‍🍳'}
        </div>
        <h2 className="profile-name">{user?.username}</h2>
        <p className="profile-role">{isWife ? '点餐决策者' : '美食制作者'}</p>
      </header>

      {/* 邀请码区域 - 仅老婆端显示 */}
      {isWife && (
        <div className="invite-section">
          <div className="invite-card">
            <div className="invite-info">
              <span className="invite-label">家庭邀请码</span>
              <span className="invite-code">{inviteCode || '加载中...'}</span>
            </div>
            <div className="invite-actions">
              <button className="invite-btn" onClick={handleCopyInviteCode}>
                复制
              </button>
              <button className="invite-btn" onClick={handleRegenerateCode}>
                重新生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 功能菜单 */}
      <main className="profile-main">
        <div className="menu-section">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="menu-item"
              onClick={() => navigate(item.path, { state: item.state })}
            >
              <div className="menu-item-left">
                <span className="menu-item-icon">{item.icon}</span>
                <span className="menu-item-text">{item.text}</span>
              </div>
              <span className="menu-item-arrow">›</span>
            </div>
          ))}
        </div>

        {/* 退出登录 */}
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>

        {/* 版本信息 */}
        <div className="version-info">
          <p className="version-text">DearMenu v5.0 💕</p>
        </div>
      </main>
    </div>
  );
}
