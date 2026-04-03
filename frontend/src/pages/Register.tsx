import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Form, Toast, Card, Segmented } from 'antd-mobile';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [familyOption, setFamilyOption] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleNext = () => {
    if (!username || username.length < 3) {
      Toast.show({ content: '用户名至少要3位哦~', icon: 'fail' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ content: '密码至少要6位哦~', icon: 'fail' });
      return;
    }
    setStep(2);
  };

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!role) return;

    if (familyOption === 'create' && !familyName) {
      Toast.show({ content: '请输入家庭名称~', icon: 'fail' });
      return;
    }
    if (familyOption === 'join' && !inviteCode) {
      Toast.show({ content: '请输入邀请码~', icon: 'fail' });
      return;
    }

    setLoading(true);
    try {
      await register(
        username,
        password,
        role,
        familyOption === 'create' ? familyName : undefined,
        familyOption === 'join' ? inviteCode : undefined
      );
      Toast.show({ content: '注册成功，欢迎加入~', icon: 'success' });
      // 根据角色跳转到对应首页
      const homePath = role === 'wife' ? '/home' : role === 'husband' ? '/husband' : '/admin';
      navigate(homePath);
    } catch (error: any) {
      const message = error.response?.data?.detail || '哎呀，注册失败了';
      Toast.show({ content: String(message), icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4ECDC4 0%, #6EE7DF 100%)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#FFF', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>开启美食之旅</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: '8px', fontSize: '14px' }}>加入DearMenu，开始美味生活~</p>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '32px 24px',
        boxShadow: '0 12px 40px rgba(78,205,196,0.25)'
      }}>
        {/* 步骤1: 用户名密码 */}
        {step === 1 && (
          <>
            <Form onFinish={handleNext}>
              <Form.Item>
                <Input
                  placeholder="用户名（至少3位）"
                  value={username}
                  onChange={setUsername}
                  className="auth-input"
                />
              </Form.Item>
              <Form.Item>
                <Input
                  type="password"
                  placeholder="密码（至少6位）"
                  value={password}
                  onChange={setPassword}
                  className="auth-input"
                />
              </Form.Item>
              <Button block type="submit" color="primary" size="large" className="auth-btn-secondary">
                下一步
              </Button>
            </Form>
          </>
        )}

        {/* 步骤2: 角色选择 */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: '#333', fontSize: '18px', margin: 0 }}>选择你的角色</h3>
              <p style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>告诉小Menu你是谁~</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Card
                onClick={() => handleRoleSelect('wife')}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: role === 'wife' ? '2px solid #FF6B6B' : '1px solid #f0f0f0',
                  borderRadius: '16px'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>👰</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>老婆</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>负责点餐决策</div>
              </Card>
              <Card
                onClick={() => handleRoleSelect('husband')}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: role === 'husband' ? '2px solid #4ECDC4' : '1px solid #f0f0f0',
                  borderRadius: '16px'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>👨‍🍳</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>老公</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>负责做菜</div>
              </Card>
            </div>
            <Button
              block
              color="default"
              size="large"
              onClick={() => setStep(1)}
              style={{ marginTop: '16px' }}
            >
              上一步
            </Button>
          </>
        )}

        {/* 步骤3: 家庭选项 */}
        {step === 3 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: '#333', fontSize: '18px', margin: 0 }}>
                {role === 'wife' ? '创建你们的小家庭' : '加入家庭'}
              </h3>
              <p style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>
                {role === 'wife' ? '和家庭成员一起管理菜单吧~' : '输入老婆给你的邀请码~'}
              </p>
            </div>

            <Segmented
              value={familyOption}
              onChange={(val) => setFamilyOption(val as 'create' | 'join')}
              style={{ marginBottom: '20px' }}
              options={[
                { label: '创建新家庭', value: 'create' },
                { label: '加入已有家庭', value: 'join' },
              ]}
            />

            {familyOption === 'create' ? (
              <Form>
                <Form.Item>
                  <Input
                    placeholder="给家庭起个名字~"
                    value={familyName}
                    onChange={setFamilyName}
                    className="auth-input"
                  />
                </Form.Item>
              </Form>
            ) : (
              <Form>
                <Form.Item>
                  <Input
                    placeholder="输入邀请码"
                    value={inviteCode}
                    onChange={setInviteCode}
                    className="auth-input"
                  />
                </Form.Item>
              </Form>
            )}

            <Button
              block
              type="submit"
              color="primary"
              size="large"
              loading={loading}
              onClick={handleSubmit}
              className="auth-btn-secondary"
            >
              完成注册
            </Button>
            <Button
              block
              color="default"
              size="large"
              onClick={() => setStep(2)}
              style={{ marginTop: '12px' }}
            >
              上一步
            </Button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ color: '#999' }}>已有账号？</span>
          <a onClick={() => navigate('/login')} style={{ color: '#4ECDC4', fontWeight: 500 }}> 立即登录</a>
        </div>
      </div>
    </div>
  );
}
