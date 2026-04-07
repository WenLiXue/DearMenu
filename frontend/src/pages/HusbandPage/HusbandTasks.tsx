import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Badge } from 'antd-mobile';
import { useHusbandStore } from '../../stores/husbandStore';
import { sendCompletionMessage } from '../../api/husband';
import EmptyState from './components/EmptyState';
import FeedbackModal from './components/FeedbackModal';
import './HusbandTasks.css';

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '--:--';
  const date = new Date(dateStr);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function getWaitTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  return `${hours}小时${minutes % 60}分钟前`;
}

export default function HusbandTasks() {
  const navigate = useNavigate();
  const { tasks, fetchTasks, startCooking, completeTask } = useHusbandStore();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [completedDishName, setCompletedDishName] = useState('');
  const [completedTaskId, setCompletedTaskId] = useState('');

  useEffect(() => {
    fetchTasks();
    // 轮询刷新，每10秒更新一次
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = useCallback(async (id: string) => {
    await startCooking(id);
  }, [startCooking]);

  const handleComplete = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setCompletedDishName(task.dish.name);
      setCompletedTaskId(id);
      await completeTask(id);
      setFeedbackVisible(true);
    }
  }, [tasks, completeTask]);

  const handleNotify = async () => {
    if (completedTaskId) {
      try {
        await sendCompletionMessage(completedTaskId);
      } catch (e) {
        // ignore error
      }
    }
    setFeedbackVisible(false);
  };

  // 分离 pending 和 cooking 状态的任务
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const cookingTasks = tasks.filter(t => t.status === 'cooking');

  return (
    <div className="husband-tasks-page">
      <NavBar
        back={null}
        right={
          <span
            onClick={() => navigate('/husband/history')}
            style={{ color: '#FFF', cursor: 'pointer', fontSize: '13px' }}
          >
            历史
          </span>
        }
        style={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #6EE7DF 100%)', color: '#FFF' }}
      >
        待办任务 ({tasks.length})
      </NavBar>

      <div className="husband-tasks-content">
        {tasks.length === 0 ? (
          <EmptyState onRandomCook={() => {}} />
        ) : (
          <div className="tasks-list">
            {/* 待制作区域 */}
            {pendingTasks.length > 0 && (
              <div className="tasks-section">
                <div className="tasks-section-title">待制作</div>
                {pendingTasks.map((task) => (
                  <div key={task.id} className="task-item pending">
                    <div className="task-item-icon">📋</div>
                    <div className="task-item-info">
                      <div className="task-item-name">{task.dish.name}</div>
                      <div className="task-item-meta">
                        <span className="task-item-from">老婆点的</span>
                        <span className="task-item-time">{formatTime(task.created_at)}</span>
                      </div>
                    </div>
                    <button
                      className="task-action-btn start"
                      onClick={() => handleStart(task.id)}
                    >
                      开始制作
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 制作中区域 */}
            {cookingTasks.length > 0 && (
              <div className="tasks-section">
                <div className="tasks-section-title">制作中</div>
                {cookingTasks.map((task) => (
                  <div key={task.id} className="task-item cooking">
                    <div className="task-item-icon">🍳</div>
                    <div className="task-item-info">
                      <div className="task-item-name">{task.dish.name}</div>
                      <div className="task-item-meta">
                        <span className="task-item-status">制作中...</span>
                        <span className="task-item-wait">{getWaitTime(task.started_at)}</span>
                      </div>
                    </div>
                    <button
                      className="task-action-btn complete"
                      onClick={() => handleComplete(task.id)}
                    >
                      完成
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <FeedbackModal
        visible={feedbackVisible}
        dishName={completedDishName}
        onNotify={handleNotify}
        onClose={() => setFeedbackVisible(false)}
      />
    </div>
  );
}
