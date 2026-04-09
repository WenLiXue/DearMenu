import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Toast, Dialog } from 'antd-mobile';
import { useHusbandStore } from '../../stores/husbandStore';
import { sendCompletionMessage } from '../../api/husband';
import HeroCard from './components/HeroCard';
import PendingTasks from './components/PendingTasks';
import ProgressBar from './components/ProgressBar';
import QuickActions from './components/QuickActions';
import EmptyState from './components/EmptyState';
import {
  getGreeting,
  getAchievementText,
  getLazyResponse
} from './components/EmotionModule';
import './Husband.css';

export default function Husband() {
  const navigate = useNavigate();
  const { tasks, fetchTasks, startCooking, completeTask, randomCook, cookFavorite, beLazy } = useHusbandStore();
  const [showLazyResponse, setShowLazyResponse] = useState(false);
  const [lazyText, setLazyText] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleLogout = () => {
    Dialog.confirm({
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      onConfirm: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      },
    });
  };

  // 分离任务状态
  const currentTask = tasks.find(t => t.status === 'cooking') || tasks.find(t => t.status === 'pending');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;

  const greeting = getGreeting();
  const achievementText = getAchievementText(completedCount, totalCount);

  const handleStart = async (id: string) => {
    await startCooking(id);
  };

  const handleComplete = async (id: string) => {
    try {
      await completeTask(id);
      Toast.show({
        content: '太棒了！🎉',
        icon: 'success',
        duration: 1500
      });
      // 自动发送通知
      try {
        await sendCompletionMessage(id);
      } catch (e) {
        // ignore
      }
    } catch (e) {
      Toast.show({
        content: '操作失败，请重试',
        icon: 'fail'
      });
    }
  };

  const handleRandom = () => {
    randomCook();
  };

  const handleFavorite = () => {
    cookFavorite();
  };

  const handleLazy = () => {
    beLazy();
    setLazyText(getLazyResponse());
    setShowLazyResponse(true);
    setTimeout(() => setShowLazyResponse(false), 2500);
  };

  return (
    <div className="husband-page">
      <NavBar
        back={null}
        right={
          <span
            onClick={handleLogout}
            style={{ color: '#FFF', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
          >
            退出
          </span>
        }
        style={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #6EE7DF 100%)', color: '#FFF' }}
      >
        老公端
      </NavBar>

      <div className="husband-content">
        {/* 问候区 */}
        <div className="greeting-section">
          <div className="greeting-emoji">{greeting.emoji}</div>
          <h1 className="greeting-title">大厨，晚上好</h1>
          <p className="greeting-subtitle">{greeting.text}</p>
        </div>

        {/* 主任务区 */}
        {currentTask ? (
          <HeroCard
            task={currentTask}
            onStart={handleStart}
            onComplete={handleComplete}
            isPrimary={true}
          />
        ) : tasks.length === 0 ? (
          <EmptyState onRandomCook={handleRandom} />
        ) : (
          <div className="all-done-section">
            <div className="all-done-icon">🎉</div>
            <h2 className="all-done-title">今天全部完成啦！</h2>
            <p className="all-done-subtitle">大厨辛苦了～休息一下吧</p>
          </div>
        )}

        {/* 进度条 */}
        {totalCount > 0 && (
          <ProgressBar
            completed={completedCount}
            total={totalCount}
            achievementText={achievementText}
          />
        )}

        {/* 待做任务 */}
        {pendingTasks.length > 1 && (
          <PendingTasks
            tasks={pendingTasks.slice(1)}
            onStart={handleStart}
          />
        )}

        {/* 偷懒反馈 */}
        {showLazyResponse && (
          <div className="lazy-feedback">
            <p className="lazy-feedback-text">{lazyText}</p>
          </div>
        )}

        {/* 快捷操作 */}
        {totalCount > 0 && (
          <QuickActions
            onRandom={handleRandom}
            onFavorite={handleFavorite}
            onLazy={handleLazy}
          />
        )}
      </div>
    </div>
  );
}
