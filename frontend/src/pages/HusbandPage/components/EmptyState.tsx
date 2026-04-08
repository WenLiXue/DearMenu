import { Button } from 'antd-mobile';
import './EmptyState.css';

interface EmptyStateProps {
  onRandomCook: () => void;
}

export default function EmptyState({ onRandomCook }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🍽️</div>
      <h2 className="empty-state-title">今天还没有菜单</h2>
      <p className="empty-state-desc">给她做点什么好吃的吧～</p>
      <Button
        className="empty-state-btn"
        onClick={onRandomCook}
      >
        🎲 随机选一道
      </Button>
    </div>
  );
}
