import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import NotificationBell from './NotificationBell';
import './Layout.css';
import { useAuthStore } from '../stores/authStore';

const EXCLUDE_TABS = ['/login', '/register', '/husband', '/husband/history', '/messages', '/chat', '/random', '/notifications'];

const allTabs = [
  { key: '/home', title: '首页', icon: '🏠' },
  { key: '/dishes', title: '点餐', icon: '🍽️' },
  { key: '/favorites', title: '收藏', icon: '❤️' },
  { key: '/profile', title: '我的', icon: '👤' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);

  // TabBar 固定显示 4 个标签，不再根据角色过滤
  const tabs = allTabs;

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
