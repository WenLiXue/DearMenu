import { Button } from 'antd-mobile';
import './EmptyState.css';

interface EmptyStateProps {
  onRandomCook: () => void;
}

export default function EmptyState({ onRandomCook }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🎉</div>
      <h2 className="empty-state-title">今天没有任务！</h2>
      <p className="empty-state-desc">可以休息一下，或者：</p>
      <Button
        className="empty-state-btn"
        onClick={onRandomCook}
      >
        🎲 随机做点好吃的
      </Button>
    </div>
  );
}
