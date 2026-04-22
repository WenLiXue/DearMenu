import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { useEffect } from 'react';
import { useOrderStore } from '../stores/orderStore';
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
  const { orders, fetchOrders } = useOrderStore();

  const showTabBar = TAB_BAR_ROUTES.includes(location.pathname) && !location.state?.hideTabBar;

  // 定期同步订单状态
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // 计算待处理订单数量
  const activeOrderCount = orders.filter(o => o.status === 'pending' || o.status === 'cooking').length;

  return (
    <div className="layout-container wife-layout">
      <div className="layout-content">
        <Outlet />
      </div>
      {showTabBar && (
        <TabBar
          fixed
          safeArea
          activeKey={location.pathname}
          onChange={(key) => navigate(key)}
          className="layout-tabbar wife-tabbar"
        >
          {tabs.map((tab) => (
            <TabBar.Item
              key={tab.key}
              title={tab.title}
              icon={<span className="tab-icon">{tab.icon}</span>}
              activeIcon={<span className="tab-icon tab-icon-active">{tab.icon}</span>}
              badge={tab.key === '/orders' && activeOrderCount > 0 ? activeOrderCount : undefined}
            />
          ))}
        </TabBar>
      )}
    </div>
  );
}
