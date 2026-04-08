import { useState } from 'react';
import type { HusbandTask } from '../../../stores/husbandStore';
import './PendingTasks.css';

interface PendingTasksProps {
  tasks: HusbandTask[];
  onStart: (id: string) => void;
}

export default function PendingTasks({ tasks, onStart }: PendingTasksProps) {
  const [expanded, setExpanded] = useState(true);

  if (tasks.length === 0) return null;

  return (
    <div className="pending-tasks">
      <button
        className="pending-tasks-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="pending-tasks-title">
          还有 {tasks.length} 道菜待做
        </span>
        {expanded ? <span style={{ fontSize: '12px' }}>△</span> : <span style={{ fontSize: '12px' }}>▽</span>}
      </button>

      {expanded && (
        <div className="pending-tasks-list">
          {tasks.map((task) => (
            <div key={task.id} className="pending-task-item">
              <div className="pending-task-info">
                <span className="pending-task-name">{task.dish.name}</span>
                {task.dish.tags?.includes('她爱吃') && (
                  <span className="pending-task-heart">❤️</span>
                )}
              </div>
              <button
                className="pending-task-btn"
                onClick={() => onStart(task.id)}
              >
                做这道
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
