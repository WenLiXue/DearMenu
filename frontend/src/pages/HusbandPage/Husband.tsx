import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Toast } from 'antd-mobile';
import { useHusbandStore } from '../../stores/husbandStore';
import { sendCompletionMessage } from '../../api/husband';
import TaskMissionCard from './components/TaskMissionCard';
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

  // 分离任务
  const currentTask = tasks.find(t => t.status === 'cooking') || tasks.find(t => t.status === 'pending');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const greeting = getGreeting();
  const achievementText = getAchievementText(completedCount, totalCount);

  const handleStart = async (id: string) => {
    await startCooking(id);
  };

  const handleComplete = async (id: string) => {
    try {
      await completeTask(id);
      Toast.show({
        content: '🎉 完成啦！老婆会超开心的！',
        icon: 'success',
        duration: 2000
      });
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
    Dialog.confirm({
      content: '确定要偷懒吗？老婆会收到通知哦～',
      confirmText: '就是不想做',
      cancelText: '算了再做',
      onConfirm: () => {
        beLazy();
        setLazyText(getLazyResponse());
        setShowLazyResponse(true);
        setTimeout(() => setShowLazyResponse(false), 3000);
      },
    });
  };

  return (
    <div className="husband-page">
      {/* 顶部区域 */}
      <header className="husband-header">
        <div className="header-left">
          <span className="header-avatar">👨‍🍳</span>
          <span className="header-title">大厨</span>
        </div>
        <div className="header-center">
          <span className="header-greeting">{greeting.emoji} {greeting.text}</span>
        </div>
        <div className="header-right">
          <button className="header-exit-btn" onClick={() => {
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
          }}>
            🚪
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="husband-main">
        {/* 当前任务卡片 */}
        {currentTask ? (
          <section className="task-section">
            <TaskMissionCard
              task={currentTask}
              onStart={handleStart}
              onComplete={handleComplete}
            />
          </section>
        ) : tasks.length === 0 ? (
          <section className="empty-section">
            <div className="empty-icon">🍽️</div>
            <h2 className="empty-title">今天没有任务啦</h2>
            <p className="empty-desc">老婆还没下单哦～</p>
            <button className="empty-btn" onClick={handleRandom}>
              🎲 随机做一道
            </button>
          </section>
        ) : (
          <section className="all-done-section">
            <div className="all-done-icon">🎉</div>
            <h2 className="all-done-title">今日任务全部完成！</h2>
            <p className="all-done-desc">大厨辛苦了～</p>
          </section>
        )}

        {/* 进度区 */}
        {totalCount > 0 && (
          <section className="progress-section">
            <div className="progress-header">
              <div className="progress-left">
                <span className="progress-heart">❤️</span>
                <span className="progress-text">已为老婆完成</span>
                <span className="progress-count">{completedCount}</span>
                <span className="progress-text">道料理</span>
              </div>
              <div className="progress-percent">{progress}%</div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            {achievementText && (
              <p className="progress-tip">{achievementText}</p>
            )}
          </section>
        )}

        {/* 待办列表 */}
        {pendingTasks.length > 1 && (
          <section className="todo-section">
            <h3 className="todo-title">📋 待办任务</h3>
            <div className="todo-list">
              {pendingTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="todo-item">
                  <span className="todo-icon">🍽️</span>
                  <span className="todo-name">{task.dish.name}</span>
                  <button
                    className="todo-btn"
                    onClick={() => handleStart(task.id)}
                  >
                    去做
                  </button>
                </div>
              ))}
              {pendingTasks.length > 3 && (
                <div className="todo-more">
                  还有 {pendingTasks.length - 3} 道菜...
                </div>
              )}
            </div>
          </section>
        )}

        {/* 快捷操作 */}
        {totalCount > 0 && (
          <section className="action-section">
            <button className="action-btn" onClick={handleRandom}>
              <span className="action-icon">🎲</span>
              <span className="action-text">随机</span>
            </button>
            <button className="action-btn favorite" onClick={handleFavorite}>
              <span className="action-icon">❤️</span>
              <span className="action-text">她爱吃</span>
            </button>
            <button className="action-btn lazy" onClick={handleLazy}>
              <span className="action-icon">💤</span>
              <span className="action-text">偷懒</span>
            </button>
          </section>
        )}
      </main>

      {/* 偷懒反馈 */}
      {showLazyResponse && (
        <div className="lazy-toast">
          <span className="lazy-toast-icon">💤</span>
          <span className="lazy-toast-text">{lazyText}</span>
        </div>
      )}
    </div>
  );
}
