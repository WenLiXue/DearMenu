import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  CoffeeOutlined,
  FolderOutlined,
  HeartOutlined,
  HistoryOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './AdminLayout.css';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  { key: '/admin', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/admin/dishes', icon: <CoffeeOutlined />, label: '菜品管理' },
  { key: '/admin/categories', icon: <FolderOutlined />, label: '分类管理' },
  { key: '/admin/favorites', icon: <HeartOutlined />, label: '收藏管理' },
  { key: '/admin/history', icon: <HistoryOutlined />, label: '历史记录' },
  { key: '/admin/settings', icon: <SettingOutlined />, label: '系统设置' },
];

const getPageTitle = (path: string): string => {
  const titles: Record<string, string> = {
    '/admin': '仪表盘',
    '/admin/dishes': '菜品管理',
    '/admin/categories': '分类管理',
    '/admin/favorites': '收藏管理',
    '/admin/history': '历史记录',
    '/admin/settings': '系统设置',
  };
  return titles[path] || '管理后台';
};

const userMenuItems: MenuProps['items'] = [
  { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
  { type: 'divider' },
  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  return (
    <Layout className="admin-layout">
      <Sider
        width={200}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="admin-sider"
        trigger={null}
      >
        <div className="admin-logo">
          {!collapsed && <span>DearMenu</span>}
          {collapsed && <span>DM</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="admin-menu"
        />
      </Sider>
      <Layout className="admin-main">
        <Header className="admin-header">
          <div className="admin-header-left">
            <span className="admin-page-title">{getPageTitle(location.pathname)}</span>
          </div>
          <div className="admin-header-right">
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div className="admin-user">
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="admin-username">admin</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
