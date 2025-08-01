import React from 'react';
import { CheckCircle, Circle, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '../types/task';

interface TaskListProps {
  title: string;
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  emptyMessage: string;
  isCompleted?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  title,
  tasks,
  onToggleTask,
  onDeleteTask,
  emptyMessage,
  isCompleted = false,
}) => {
  const getTaskStatus = (task: Task) => {
    if (task.completed) return 'completed';
    if (!task.dueTime) return 'neutral';
    
    const now = new Date();
    const [hours, minutes] = task.dueTime.split(':').map(Number);
    const taskTime = new Date();
    taskTime.setHours(hours, minutes, 0, 0);
    
    if (taskTime < now) return 'overdue';
    
    const timeDiff = taskTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    if (minutesDiff <= 30) return 'upcoming';
    return 'neutral';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-task-completed text-task-completed-foreground';
      case 'overdue': return 'bg-task-overdue text-task-overdue-foreground';
      case 'upcoming': return 'bg-task-upcoming text-task-upcoming-foreground';
      default: return 'bg-task-neutral text-task-neutral-foreground';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        {title}
        <Badge variant="secondary" className="ml-auto">
          {tasks.length}
        </Badge>
      </h2>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">
            {isCompleted ? '🎉' : '📝'}
          </div>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const status = getTaskStatus(task);
            const statusColor = getStatusColor(status);
            
            return (
              <Card
                key={task.id}
                className={`p-4 task-card border-l-4 transition-all duration-300 ${
                  task.completed ? 'task-complete completed' : ''
                } ${
                  status === 'completed' ? 'border-l-task-completed' :
                  status === 'overdue' ? 'border-l-task-overdue' :
                  status === 'upcoming' ? 'border-l-task-upcoming' :
                  'border-l-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleTask(task.id)}
                    className={`p-0 h-6 w-6 rounded-full check-animation ${
                      task.completed ? 'text-task-completed' : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${
                        task.completed ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {task.title}
                      </h3>
                      {getPriorityIcon(task.priority) && (
                        <span className="text-muted-foreground">
                          {getPriorityIcon(task.priority)}
                        </span>
                      )}
                      <Badge
                        className={`text-xs px-2 py-0.5 ${statusColor}`}
                      >
                        {status === 'upcoming' ? 'Due Soon' : 
                         status === 'overdue' ? 'Overdue' :
                         status === 'completed' ? 'Done' : task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className={`text-sm text-muted-foreground mb-2 ${
                        task.completed ? 'line-through' : ''
                      }`}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.dueTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.dueTime}
                        </div>
                      )}
                      <div>
                        Created {task.createdAt.toLocaleDateString()}
                      </div>
                      {task.completedAt && (
                        <div>
                          Completed {task.completedAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTask(task.id)}
                    className="p-0 h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
};