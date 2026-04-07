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
      const message = error.response?.data?.message || error.message || '哎呀，登录失败了，再试一次吧';
      Toast.show({ content: String(message), icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '40px 24px',
        boxShadow: '0 12px 40px rgba(255,107,107,0.25)'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#FF6B6B',
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          DearMenu
        </h1>
        <p style={{ textAlign: 'center', color: '#999', marginBottom: '32px', fontSize: '14px' }}>
          亲爱的，今晚吃什么？
        </p>

        <Form onFinish={handleSubmit}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="用户名" className="auth-input" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input type="password" placeholder="密码" className="auth-input" />
          </Form.Item>
          <Button block type="submit" color="primary" size="large" loading={loading}
            className="auth-btn-primary">
            登录
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ color: '#999' }}>还没有账号？</span>
          <a onClick={() => navigate('/register')} style={{ color: '#FF6B6B', fontWeight: 500 }}> 开启美食之旅</a>
        </div>
      </div>
    </div>
  );
}
