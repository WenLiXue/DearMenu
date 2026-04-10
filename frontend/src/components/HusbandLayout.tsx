import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import './Layout.css';

const tabs = [
  { key: '/husband', title: '任务', icon: '📋' },
  { key: '/husband/history', title: '历史', icon: '📊' },
];

export default function HusbandLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveKey = () => {
    if (location.pathname.startsWith('/husband/history')) return '/husband/history';
    return '/husband';
  };

  return (
    <div className="husband-layout">
      <div className="layout-content">
        <Outlet />
      </div>
      <TabBar
        fixed
        safeArea
        activeKey={getActiveKey()}
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
    </div>
  );
}
