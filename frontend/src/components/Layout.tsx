import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import NotificationBell from './NotificationBell';
import './Layout.css';

const EXCLUDE_TABS = ['/login', '/register', '/husband', '/husband/history', '/messages', '/chat'];

const tabs = [
  { key: '/home', title: '首页', icon: '🏠' },
  { key: '/dishes', title: '点菜', icon: '🍽️' },
  { key: '/favorites', title: '收藏', icon: '💕' },
  { key: '/history', title: '历史', icon: '📜' },
  { key: '/random', title: '随机', icon: '🎲' },
  { key: '/messages', title: '消息', icon: '💬' },
  { key: '/notifications', title: '通知', icon: '🔔' },
  { key: '/husband', title: '老公', icon: '👨‍🍳' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  if (EXCLUDE_TABS.includes(location.pathname)) {
    return <Outlet />;
  }

  const getTabTitle = (key: string) => {
    const tab = tabs.find(t => t.key === key);
    if (!tab) return '';
    return tab.title;
  };

  return (
    <div className="layout-container">
      <div className="layout-content">
        <Outlet />
      </div>
      <TabBar
        fixed
        safeArea
        activeKey={location.pathname}
        onChange={(key) => navigate(key)}
        className="layout-tabbar"
      >
        {tabs.map((tab) => (
          <TabBar.Item
            key={tab.key}
            title={getTabTitle(tab.key)}
            icon={<span className="tab-icon">{tab.icon}</span>}
            activeIcon={<span className="tab-icon tab-icon-active">{tab.icon}</span>}
          />
        ))}
      </TabBar>
    </div>
  );
}
