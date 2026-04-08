import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Form, Toast, Segmented } from 'antd-mobile';
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
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNext = () => {
    if (!username || username.length < 3) {
      Toast.show({ content: '用户名至少要3位哦~', icon: 'fail' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ content: '密码至少要6位哦~', icon: 'fail' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ content: '两次输入的密码不一致哦~', icon: 'fail' });
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
      const message = error.response?.data?.message || error.message || '哎呀，注册失败了';
      Toast.show({ content: String(message), icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">DearMenu</h1>
        <p className="auth-subtitle">开启美食之旅</p>
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
              <Form.Item>
                <Input
                  type="password"
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
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
              <div
                onClick={() => handleRoleSelect('wife')}
                className={`role-card ${role === 'wife' ? 'selected' : ''}`}
                style={{
                  flex: 1,
                  borderColor: role === 'wife' ? 'var(--primary-color)' : undefined
                }}
              >
                <div className="role-icon">👰</div>
                <div className="role-name">老婆</div>
                <div className="role-desc">负责点餐决策</div>
              </div>
              <div
                onClick={() => handleRoleSelect('husband')}
                className={`role-card ${role === 'husband' ? 'selected' : ''}`}
                style={{
                  flex: 1,
                  borderColor: role === 'husband' ? 'var(--teal-color)' : undefined
                }}
              >
                <div className="role-icon">👨‍🍳</div>
                <div className="role-name">老公</div>
                <div className="role-desc">负责做菜</div>
              </div>
            </div>
            <Button
              block
              size="large"
              onClick={() => setStep(1)}
              className="auth-btn-secondary"
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
              size="large"
              onClick={() => setStep(2)}
              className="auth-btn-secondary"
              style={{ marginTop: '12px' }}
            >
              上一步
            </Button>
          </>
        )}

        <div className="auth-link">
          已有账号？<span className="auth-link-text" onClick={() => navigate('/login')}>立即登录</span>
        </div>
      </div>
    </div>
  );
}
