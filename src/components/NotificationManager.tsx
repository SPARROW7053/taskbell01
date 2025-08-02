import React, { useEffect } from 'react';
import { Task } from '../types/task';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AlarmSettings {
  soundType: 'beep' | 'custom' | 'built-in';
  customSoundUrl?: string;
  builtInSound: string;
  volume: number;
}

interface NotificationManagerProps {
  tasks: Task[];
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ tasks }) => {
  const [alarmSettings] = useLocalStorage<AlarmSettings>('alarm-settings', {
    soundType: 'beep',
    builtInSound: 'bell',
    volume: 0.7
  });

  const playAlarmSound = () => {
    if (alarmSettings.soundType === 'custom' && alarmSettings.customSoundUrl) {
      const audio = new Audio(alarmSettings.customSoundUrl);
      audio.volume = alarmSettings.volume;
      audio.play().catch(console.error);
    } else if (alarmSettings.soundType === 'built-in') {
      // Generate built-in sounds using Web Audio API
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Different sound patterns
      switch (alarmSettings.builtInSound) {
        case 'bell':
          oscillator.frequency.setValueAtTime(800, context.currentTime);
          break;
        case 'chime':
          oscillator.frequency.setValueAtTime(600, context.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.5);
          break;
        case 'notification':
          oscillator.frequency.setValueAtTime(1000, context.currentTime);
          oscillator.frequency.setValueAtTime(800, context.currentTime + 0.1);
          break;
        case 'alert':
          oscillator.frequency.setValueAtTime(1200, context.currentTime);
          break;
      }
      
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(alarmSettings.volume, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 1);
    } else {
      // Default beep
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(alarmSettings.volume, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
    }
  };

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
          // Play alarm sound
          playAlarmSound();
          
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