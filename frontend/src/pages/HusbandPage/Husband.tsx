import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from 'antd-mobile';
import { useHusbandStore } from '../../stores/husbandStore';
import { sendCompletionMessage } from '../../api/husband';
import TodayTasks from './components/TodayTasks';
import QuickActions from './components/QuickActions';
import EmptyState from './components/EmptyState';
import FeedbackModal from './components/FeedbackModal';
import './Husband.css';

function getDynamicGreeting() {
  const greetings = [
    '她今天想吃这些～',
    '加油做饭吧！',
    '今天做什么呢？',
    '大厨今天上线啦！',
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function getCompletedCount(tasks: any[]) {
  return tasks.filter((t) => t.status === 'completed').length;
}

export default function Husband() {
  const navigate = useNavigate();
  const { tasks, fetchTasks, startCooking, completeTask, randomCook, cookFavorite, beLazy } = useHusbandStore();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [completedDishName, setCompletedDishName] = useState('');
  const [completedTaskId, setCompletedTaskId] = useState('');
  const [greeting] = useState(getDynamicGreeting);

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStart = (id: string) => {
    startCooking(id);
  };

  const handleComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setCompletedDishName(task.dish.name);
      setCompletedTaskId(id);
      completeTask(id);
      setFeedbackVisible(true);
    }
  };

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

  const handleRandom = () => {
    randomCook();
  };

  const handleFavorite = () => {
    cookFavorite();
  };

  const handleLazy = () => {
    beLazy();
  };

  const completedCount = getCompletedCount(tasks);
  const totalCount = tasks.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="husband-page">
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
        老公端
      </NavBar>

      <div className="husband-content">
        <div className="husband-header">
          <div className="husband-header-top">
            <h1 className="husband-title">今天的任务 🍳</h1>
            <span className="husband-subtitle">{greeting}</span>
          </div>
          {tasks.length > 0 && !allCompleted && (
            <div className="husband-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="progress-text">
                {completedCount}/{totalCount} 完成
              </span>
            </div>
          )}
          {allCompleted && (
            <div className="husband-complete-tip">
              🎉 太棒了！全部完成啦！
            </div>
          )}
        </div>

        <div className="husband-body">
          {tasks.length === 0 ? (
            <EmptyState onRandomCook={handleRandom} />
          ) : (
            <>
              <TodayTasks
                tasks={tasks}
                onStart={handleStart}
                onComplete={handleComplete}
              />
              <QuickActions
                onRandom={handleRandom}
                onFavorite={handleFavorite}
                onLazy={handleLazy}
              />
            </>
          )}
        </div>
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
