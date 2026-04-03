import { Button } from 'antd-mobile';
import './QuickActions.css';

interface QuickActionsProps {
  onRandom: () => void;
  onFavorite: () => void;
  onLazy: () => void;
}

export default function QuickActions({ onRandom, onFavorite, onLazy }: QuickActionsProps) {
  return (
    <div className="quick-actions">
      <Button
        className="quick-action-btn random-btn"
        onClick={onRandom}
      >
        <span className="quick-action-icon">🎲</span>
        <span className="quick-action-label">随机做</span>
      </Button>
      <Button
        className="quick-action-btn favorite-btn"
        onClick={onFavorite}
      >
        <span className="quick-action-icon">❤️</span>
        <span className="quick-action-label">她爱吃的</span>
      </Button>
      <Button
        className="quick-action-btn lazy-btn"
        onClick={onLazy}
      >
        <span className="quick-action-icon">💤</span>
        <span className="quick-action-label">今天偷懒</span>
      </Button>
    </div>
  );
}
