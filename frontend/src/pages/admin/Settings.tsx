import { Card, Form, Input, Button, Switch, message, Divider } from 'antd';
import { useAuthStore } from '../../stores/authStore';

export default function Settings() {
  const { user, logout } = useAuthStore();

  const handleSave = () => {
    message.success('设置已保存');
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <Card title="个人信息" className="admin-card" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="用户名">
            <Input value={user?.username || 'admin'} disabled />
          </Form.Item>
        </Form>
      </Card>

      <Card title="系统设置" className="admin-card" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="系统名称">
            <Input placeholder="DearMenu 家庭点餐系统" defaultValue="DearMenu 家庭点餐系统" />
          </Form.Item>

          <Form.Item label="默认推荐">
            <Switch defaultChecked />
            <span style={{ marginLeft: 8, color: '#666' }}>开启后，收藏的菜品自动推荐到首页</span>
          </Form.Item>

          <Divider />

          <Form.Item label="随机选择偏好">
            <Input placeholder="如：简单、她爱吃" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleSave}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="数据管理" className="admin-card">
        <div style={{ display: 'flex', gap: 12 }}>
          <Button>导出数据</Button>
          <Button danger onClick={logout}>退出登录</Button>
        </div>
      </Card>
    </div>
  );
}
