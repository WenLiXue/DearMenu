import './ProgressBar.css';

interface ProgressBarProps {
  completed: number;
  total: number;
  achievementText?: string;
}

export default function ProgressBar({ completed, total, achievementText }: ProgressBarProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isAllDone = completed === total && total > 0;

  return (
    <div className="progress-section">
      <div className="progress-header">
        <div className="progress-info">
          <span className="progress-count">
            <span className="progress-current">{completed}</span>
            <span className="progress-separator">/</span>
            <span className="progress-total">{total}</span>
          </span>
          <span className="progress-label">道菜已完成</span>
        </div>
        {isAllDone && <span className="progress-crown">👑</span>}
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {achievementText && (
        <p className="progress-tip">{achievementText}</p>
      )}
    </div>
  );
}
