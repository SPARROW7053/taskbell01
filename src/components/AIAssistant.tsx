import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task, AIMessage } from '../types/task';

interface AIAssistantProps {
  tasks: Task[];
  completedCount: number;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ tasks, completedCount }) => {
  const [currentMessage, setCurrentMessage] = useState<AIMessage | null>(null);

  const generateAIMessage = (): AIMessage | null => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check for overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (!task.dueTime) return false;
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      const taskTime = new Date();
      taskTime.setHours(hours, minutes, 0, 0);
      return taskTime < now;
    });

    // Check for upcoming tasks (within 30 minutes)
    const upcomingTasks = tasks.filter(task => {
      if (!task.dueTime) return false;
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      const taskTime = new Date();
      taskTime.setHours(hours, minutes, 0, 0);
      const timeDiff = taskTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      return minutesDiff > 0 && minutesDiff <= 30;
    });

    // Check for high priority tasks
    const highPriorityTasks = tasks.filter(task => task.priority === 'high');

    // Generate contextual messages
    if (overdueTasks.length > 0) {
      return {
        id: Date.now().toString(),
        text: `⚠️ You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Consider rescheduling or completing them soon!`,
        type: 'warning',
        timestamp: new Date(),
      };
    }

    if (upcomingTasks.length > 0) {
      return {
        id: Date.now().toString(),
        text: `⏰ Heads up! You have ${upcomingTasks.length} task${upcomingTasks.length > 1 ? 's' : ''} due in the next 30 minutes.`,
        type: 'suggestion',
        timestamp: new Date(),
      };
    }

    if (highPriorityTasks.length > 0) {
      return {
        id: Date.now().toString(),
        text: `🎯 Focus tip: You have ${highPriorityTasks.length} high-priority task${highPriorityTasks.length > 1 ? 's' : ''}. Consider tackling these first!`,
        type: 'suggestion',
        timestamp: new Date(),
      };
    }

    // Motivational messages based on time of day
    if (currentHour >= 6 && currentHour < 12) {
      return {
        id: Date.now().toString(),
        text: `🌅 Good morning! Ready to tackle your ${tasks.length} tasks today? Start with something small to build momentum!`,
        type: 'motivation',
        timestamp: new Date(),
      };
    }

    if (currentHour >= 12 && currentHour < 17) {
      return {
        id: Date.now().toString(),
        text: `☀️ Afternoon energy! You've completed ${completedCount} tasks. Keep the momentum going!`,
        type: 'motivation',
        timestamp: new Date(),
      };
    }

    if (currentHour >= 17 && currentHour < 21) {
      return {
        id: Date.now().toString(),
        text: `🌆 Evening reflection: Great work today! ${completedCount > 0 ? `You completed ${completedCount} tasks.` : 'Consider setting up tasks for tomorrow.'}`,
        type: 'motivation',
        timestamp: new Date(),
      };
    }

    if (tasks.length === 0) {
      return {
        id: Date.now().toString(),
        text: `✨ Your task list is clear! Perfect time to plan ahead or take a well-deserved break.`,
        type: 'motivation',
        timestamp: new Date(),
      };
    }

    return null;
  };

  useEffect(() => {
    const message = generateAIMessage();
    if (message) {
      setCurrentMessage(message);
    }

    // Update message every 5 minutes
    const interval = setInterval(() => {
      const newMessage = generateAIMessage();
      if (newMessage) {
        setCurrentMessage(newMessage);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks, completedCount]);

  if (!currentMessage) return null;

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'suggestion': return '💡';
      case 'motivation': return '🚀';
      default: return '🤖';
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-task-overdue bg-red-50/50';
      case 'suggestion': return 'border-l-task-upcoming bg-orange-50/50';
      case 'motivation': return 'border-l-ai-primary bg-ai-background/50';
      default: return 'border-l-primary bg-ai-background/50';
    }
  };

  return (
    <Card className={`p-4 ai-message border-l-4 ${getMessageStyle(currentMessage.type)} bg-white/90 backdrop-blur-sm border-0 shadow-lg`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-ai-primary to-ai-secondary">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm">AI Assistant</h3>
            <Badge variant="secondary" className="text-xs">
              Smart
            </Badge>
            <Sparkles className="h-3 w-3 text-ai-primary" />
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {currentMessage.text}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {currentMessage.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </Card>
  );
};