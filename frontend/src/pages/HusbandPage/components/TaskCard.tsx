import { Button } from 'antd-mobile';
import type { HusbandTask } from '../../../stores/husbandStore';
import './TaskCard.css';

interface TaskCardProps {
  task: HusbandTask;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
}

export default function TaskCard({ task, onStart, onComplete }: TaskCardProps) {
  const { dish, status } = task;
  const isFavorite = dish.tags?.includes('她爱吃');

  return (
    <div className={`task-card ${status}`}>
      <div className="task-card-image">
        {dish.image_url ? (
          <img src={dish.image_url} alt={dish.name} />
        ) : (
          <div className="task-card-image-placeholder">🍽️</div>
        )}
      </div>
      <div className="task-card-content">
        <div className="task-card-header">
          <h3 className="task-card-name">{dish.name}</h3>
          {isFavorite && <span className="task-card-tag favorite">❤️ 她爱吃</span>}
          {!isFavorite && dish.tags?.length > 0 && (
            <span className="task-card-tag simple">简单</span>
          )}
        </div>
        <div className="task-card-status">
          {status === 'pending' && (
            <span className="status-badge pending">待做</span>
          )}
          {status === 'cooking' && (
            <span className="status-badge cooking">🔥 制作中</span>
          )}
          {status === 'completed' && (
            <span className="status-badge completed">✔️ 已完成</span>
          )}
        </div>
      </div>
      <div className="task-card-action">
        {status === 'pending' && (
          <Button
            className="action-btn start-btn"
            onClick={() => onStart(task.id)}
          >
            开始做
          </Button>
        )}
        {status === 'cooking' && (
          <Button
            className="action-btn complete-btn"
            onClick={() => onComplete(task.id)}
          >
            已完成
          </Button>
        )}
        {status === 'completed' && (
          <div className="completed-icon">✔️</div>
        )}
      </div>
    </div>
  );
}
