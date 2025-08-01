import React, { useEffect } from 'react';
import { Task } from '../types/task';

interface NotificationManagerProps {
  tasks: Task[];
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ tasks }) => {
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (!task.dueTime || task.completed) return;
        
        const [hours, minutes] = task.dueTime.split(':').map(Number);
        const taskTime = new Date();
        taskTime.setHours(hours, minutes, 0, 0);
        
        const timeDiff = Math.abs(taskTime.getTime() - now.getTime());
        
        // Notify when task time is reached (within 1 minute)
        if (timeDiff <= 60000 && taskTime <= now) {
          if (Notification.permission === 'granted') {
            new Notification(`Task Reminder: ${task.title}`, {
              body: task.description || 'Time to complete this task!',
              icon: '/favicon.ico',
              tag: task.id,
            });
          }
        }
      });
    };

    const interval = setInterval(checkAlarms, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [tasks]);

  return null;
};