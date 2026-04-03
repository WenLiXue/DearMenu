import type { HusbandTask } from '../../../stores/husbandStore';
import TaskCard from './TaskCard';
import './TodayTasks.css';

interface TodayTasksProps {
  tasks: HusbandTask[];
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
}

export default function TodayTasks({ tasks, onStart, onComplete }: TodayTasksProps) {
  return (
    <div className="today-tasks">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStart={onStart}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}
