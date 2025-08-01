export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueTime?: string; // HH:MM format
  priority: TaskPriority;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface AIMessage {
  id: string;
  text: string;
  type: 'suggestion' | 'motivation' | 'warning';
  timestamp: Date;
}