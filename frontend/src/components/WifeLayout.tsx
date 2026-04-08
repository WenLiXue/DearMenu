import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import './Layout.css';

const TAB_BAR_ROUTES = ['/home', '/dishes', '/orders', '/favorites', '/profile'];

const tabs = [
  { key: '/home', title: '首页', icon: '🏠' },
  { key: '/dishes', title: '点餐', icon: '🍽️' },
  { key: '/orders', title: '订单', icon: '📋' },
  { key: '/favorites', title: '收藏', icon: '❤️' },
  { key: '/profile', title: '我的', icon: '👤' },
];

export default function WifeLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // TabBar 只在主要页面显示，二级页面通过 location.state?.hideTabBar 隐藏
  const showTabBar = TAB_BAR_ROUTES.includes(location.pathname) && !location.state?.hideTabBar;

  return (
    <div className="layout-container">
      <div className="layout-content">
        <Outlet />
      </div>
      {showTabBar && (
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
              title={tab.title}
              icon={<span className="tab-icon">{tab.icon}</span>}
              activeIcon={<span className="tab-icon tab-icon-active">{tab.icon}</span>}
            />
          ))}
        </TabBar>
      )}
    </div>
  );
}
