import { useNavigate } from 'react-router-dom';
import { NavBar, Button, Toast } from 'antd-mobile';
import { useAuthStore } from '../stores/authStore';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, familyId } = useAuthStore();

  const handleCopyInviteCode = () => {
    if (familyId) {
      navigator.clipboard.writeText(familyId);
      Toast.show({ content: '邀请码已复制', icon: 'success' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isWife = user?.role === 'wife';

  return (
    <div className="page-container">
      <NavBar
        back={null}
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}
      >
        我的
      </NavBar>

      <div className="profile-content">
        {/* 用户信息 */}
        <div className="profile-header">
          <div className={`profile-avatar ${isWife ? '' : 'husband'}`}>
            {isWife ? '👰' : '👨‍🍳'}
          </div>
          <h2 className="profile-name">{user?.username}</h2>
          <p className="profile-role">{isWife ? '点餐决策者' : '美食制作者'}</p>
        </div>

        {/* 家庭信息 */}
        {familyId && (
          <div className="family-section">
            <p className="family-title">家庭邀请码</p>
            <div className="family-code-row">
              <div>
                <p className="family-code">{familyId}</p>
                <p className="family-code-label">分享给另一半，加入家庭</p>
              </div>
              <Button
                size="small"
                className="invite-code-btn"
                onClick={handleCopyInviteCode}
              >
                复制
              </Button>
            </div>
          </div>
        )}

        {/* 历史记录 */}
        <div className="history-section">
          <div className="history-item" onClick={() => navigate('/history')}>
            <div className="history-item-left">
              <span className="history-item-icon">📜</span>
              <p className="history-item-text">点餐历史</p>
            </div>
            <span className="history-item-arrow">›</span>
          </div>
        </div>

        {/* 功能菜单 */}
        <div className="menu-section">
          <div className="menu-item" onClick={() => navigate('/categories')}>
            <div className="menu-item-left">
              <span className="menu-item-icon">📂</span>
              <p className="menu-item-text">分类管理</p>
            </div>
            <span className="menu-item-arrow">›</span>
          </div>
          <div className="menu-item" onClick={() => navigate('/random')}>
            <div className="menu-item-left">
              <span className="menu-item-icon">🎲</span>
              <p className="menu-item-text">随机推荐</p>
            </div>
            <span className="menu-item-arrow">›</span>
          </div>
        </div>

        {/* 退出登录 */}
        <Button
          block
          className="logout-btn"
          onClick={handleLogout}
        >
          退出登录
        </Button>

        {/* 版本信息 */}
        <div className="version-info">
          <p className="version-text">DearMenu v2.6</p>
        </div>
      </div>
    </div>
  );
}
