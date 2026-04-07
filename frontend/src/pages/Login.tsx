import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Form, Toast } from 'antd-mobile';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';
import './Auth.css';

const getHomePath = (role: Role): string => {
  switch (role) {
    case 'wife':
      return '/home';
    case 'husband':
      return '/husband';
    case 'admin':
      return '/admin';
    default:
      return '/home';
  }
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await login(values.username, values.password);
      Toast.show({ content: '欢迎回来~', icon: 'success' });
      const homePath = getHomePath(response.role);
      navigate(homePath);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || '登录失败，请重试';
      Toast.show({ content: String(message), icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">DearMenu</h1>
        <p className="auth-subtitle">今晚吃点什么</p>

        <Form onFinish={handleSubmit} className="auth-form">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="用户名" className="auth-input" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input type="password" placeholder="密码" className="auth-input" />
          </Form.Item>
          <Button
            block
            type="submit"
            size="large"
            loading={loading}
            className="auth-btn-primary"
          >
            登录
          </Button>
        </Form>

        <div className="auth-link">
          还没有账号？<span className="auth-link-text" onClick={() => navigate('/register')}>注册</span>
        </div>
      </div>
    </div>
  );
}
