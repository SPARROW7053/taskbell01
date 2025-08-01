import React, { useState, useEffect } from 'react';
import { Brain, Plus, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { AIAssistant } from './AIAssistant';
import { NotificationManager } from './NotificationManager';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Task, TaskPriority } from '../types/task';

export const TodoApp = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('ai-todo-tasks', []);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(0);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    setCompletedTasks(tasks.filter(task => task.completed).length);
  }, [tasks]);

  const addTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setTasks(prev => [task, ...prev]);
    setShowTaskForm(false);
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed, completedAt: task.completed ? undefined : new Date() }
          : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const activeTasks = tasks.filter(task => !task.completed);
  const doneTasks = tasks.filter(task => task.completed);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-ai-secondary">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-ai-secondary bg-clip-text text-transparent">
                  AI To-Do List
                </h1>
                <p className="text-sm text-muted-foreground">
                  Smart task management with AI assistance
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowTaskForm(true)}
              className="bg-gradient-to-r from-primary to-ai-secondary hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold">{activeTasks.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-task-upcoming" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedTasks}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-ai-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Assistant */}
        <AIAssistant tasks={activeTasks} completedCount={completedTasks} />

        {/* Task Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskList
            title="Active Tasks"
            tasks={activeTasks}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            emptyMessage="No active tasks. Create your first task to get started!"
          />
          <TaskList
            title="Completed Tasks"
            tasks={doneTasks}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            emptyMessage="No completed tasks yet. Keep working!"
            isCompleted
          />
        </div>

        {/* Task Form Modal */}
        {showTaskForm && (
          <TaskForm
            onSubmit={addTask}
            onClose={() => setShowTaskForm(false)}
          />
        )}

        {/* Notification Manager */}
        <NotificationManager tasks={activeTasks} />
      </div>
    </div>
  );
};