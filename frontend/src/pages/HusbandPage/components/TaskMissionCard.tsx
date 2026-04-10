import { useState, useEffect } from 'react';
import { Button } from 'antd-mobile';
import type { HusbandTask } from '../../../stores/husbandStore';
import './TaskMissionCard.css';

interface TaskMissionCardProps {
  task: HusbandTask;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
}

export default function TaskMissionCard({ task, onStart, onComplete }: TaskMissionCardProps) {
  const { dish, status } = task;
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleComplete = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onComplete(task.id);
    }, 600);
  };

  const handleStart = () => {
    onStart(task.id);
  };

  // 成功动画触发
  useEffect(() => {
    if (status === 'completed' && showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status, showSuccess]);

  const isCooking = status === 'cooking';
  const isPending = status === 'pending';
  const isCompleted = status === 'completed';

  return (
    <div className={`task-mission-card ${isCooking ? 'cooking' : ''} ${isAnimating ? 'completing' : ''}`}>
      {/* 霓虹边框 */}
      <div className="mission-border" />

      {/* 任务类型标签 */}
      <div className="mission-type">
        <span className="mission-type-icon">⚡</span>
        <span className="mission-type-text">主线任务</span>
      </div>

      {/* 菜品信息 */}
      <div className="mission-content">
        <div className="mission-dish-icon">🍜</div>
        <h1 className="mission-dish-name">{dish.name}</h1>
        <div className="mission-tags">
          {dish.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="mission-tag">🔥 {tag}</span>
          ))}
        </div>
      </div>

      {/* 状态指示器 */}
      <div className={`mission-status ${isCooking ? 'cooking' : isPending ? 'pending' : ''}`}>
        {isCooking && (
          <>
            <span className="status-dot" />
            <span>制作中...</span>
          </>
        )}
        {isPending && (
          <>
            <span className="status-dot pending" />
            <span>等待开始</span>
          </>
        )}
      </div>

      {/* 超大操作按钮 */}
      <div className="mission-action">
        {isPending && (
          <button className="mission-btn start-btn" onClick={handleStart}>
            <span className="btn-glow" />
            <span className="btn-text">🔥 开始做饭</span>
          </button>
        )}
        {isCooking && (
          <button className="mission-btn complete-btn" onClick={handleComplete}>
            <span className="btn-glow" />
            <span className="btn-text">✔️ 完成任务</span>
          </button>
        )}
      </div>

      {/* 完成动画覆盖层 */}
      {isAnimating && (
        <div className="complete-overlay">
          <div className="complete-content">
            <span className="complete-icon">🎉</span>
            <span className="complete-text">完成啦！</span>
            <span className="complete-heart">❤️</span>
          </div>
        </div>
      )}
    </div>
  );
}
