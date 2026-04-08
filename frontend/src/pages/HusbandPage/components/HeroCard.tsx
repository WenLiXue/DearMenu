import { useState } from 'react';
import { Button } from 'antd-mobile';
import type { HusbandTask } from '../../../stores/husbandStore';
import './HeroCard.css';

interface HeroCardProps {
  task: HusbandTask;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  isPrimary?: boolean;
}

export default function HeroCard({ task, onStart, onComplete, isPrimary = true }: HeroCardProps) {
  const { dish, status } = task;
  const isFavorite = dish.tags?.includes('她爱吃');
  const [isAnimating, setIsAnimating] = useState(false);
  const imageUrl = (dish as any).image_url;

  const handleComplete = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onComplete(task.id);
    }, 400);
  };

  if (status === 'completed') {
    return null;
  }

  return (
    <div className={`hero-card ${status} ${isAnimating ? 'completing' : ''} ${isPrimary ? '' : 'secondary'}`}>
      {/* 背景装饰 */}
      <div className="hero-card-bg">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="hero-card-bg-image" />
        ) : (
          <div className="hero-card-bg-placeholder">🍽️</div>
        )}
        <div className="hero-card-bg-overlay" />
      </div>

      {/* 内容 */}
      <div className="hero-card-content">
        {isFavorite && (
          <div className="hero-card-tag">❤️ 她今天最想吃的</div>
        )}

        <h2 className="hero-card-title">{dish.name}</h2>

        {!isFavorite && dish.tags?.length > 0 && (
          <div className="hero-card-tags">
            {dish.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="hero-card-tag-dot">{tag}</span>
            ))}
          </div>
        )}

        {status === 'cooking' && (
          <div className="hero-card-cooking-indicator">
            <span className="cooking-dot" />
            制作中...
          </div>
        )}

        <div className="hero-card-action">
          {status === 'pending' && (
            <Button
              className="hero-card-btn start"
              onClick={() => onStart(task.id)}
              style={{ '--bg-color': 'var(--teal-color)' } as any}
            >
              <span className="btn-icon">🔥</span>
              开始做
            </Button>
          )}
          {status === 'cooking' && (
            <Button
              className="hero-card-btn complete"
              onClick={handleComplete}
              style={{ '--bg-color': 'var(--primary-color)' } as any}
            >
              <span className="btn-icon">✔️</span>
              完成
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
