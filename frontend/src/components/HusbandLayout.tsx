import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { NavBar } from 'antd-mobile';
import './Layout.css';

const tabs = [
  { key: '/husband', title: '任务', icon: '📋' },
  { key: '/husband/tasks', title: '任务列表', icon: '📝' },
  { key: '/husband/history', title: '历史', icon: '📊' },
];

export default function HusbandLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // 获取当前激活的 tab key
  const getActiveKey = () => {
    if (location.pathname.startsWith('/husband/tasks')) return '/husband/tasks';
    if (location.pathname.startsWith('/husband/history')) return '/husband/history';
    return '/husband';
  };

  return (
    <div className="husband-layout">
      <NavBar
        className="husband-navbar"
        style={{
          background: 'linear-gradient(135deg, #3CBAB2 0%, #8DD4D0 100%)',
          color: '#FFF',
        }}
        backArrow={false}
      >
        <span style={{ color: '#FFF', fontWeight: 600 }}>老公的任务中心</span>
      </NavBar>
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
