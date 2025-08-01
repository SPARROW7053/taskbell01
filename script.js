class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.settings = this.loadSettings();
        this.alarmInterval = null;
        this.deletionTimeouts = new Map();
        
        this.initializeElements();
        this.bindEvents();
        this.applyTheme();
        this.render();
        this.startAlarmSystem();
        this.scheduleExistingDeletions();
    }

    initializeElements() {
        // Buttons
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.closeModal = document.getElementById('closeModal');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // Modal and form
        this.modal = document.getElementById('taskModal');
        this.taskForm = document.getElementById('taskForm');
        
        // Form inputs
        this.taskTitle = document.getElementById('taskTitle');
        this.taskDescription = document.getElementById('taskDescription');
        this.taskDate = document.getElementById('taskDate');
        this.taskTime = document.getElementById('taskTime');
        this.taskPriority = document.getElementById('taskPriority');
        
        // Settings
        this.deleteDelay = document.getElementById('deleteDelay');
        this.colorTheme = document.getElementById('colorTheme');
        
        // Task containers
        this.activeTasks = document.getElementById('activeTasks');
        this.completedTasks = document.getElementById('completedTasks');
        
        // Stats
        this.activeCount = document.getElementById('activeCount');
        this.completedCount = document.getElementById('completedCount');
        this.successRate = document.getElementById('successRate');
        this.activeTasksCount = document.getElementById('activeTasksCount');
        this.completedTasksCount = document.getElementById('completedTasksCount');
    }

    bindEvents() {
        this.addTaskBtn.addEventListener('click', () => this.showModal());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.closeModal.addEventListener('click', () => this.hideModal());
        this.cancelBtn.addEventListener('click', () => this.hideModal());
        this.taskForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.deleteDelay.addEventListener('change', () => this.updateSettings());
        this.colorTheme.addEventListener('change', () => this.updateColorTheme());
        
        // Close modal on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideModal();
            if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.showModal();
            }
        });
    }

    loadTasks() {
        const saved = localStorage.getItem('todoTasks');
        if (saved) {
            return JSON.parse(saved).map(task => ({
                ...task,
                createdAt: new Date(task.createdAt),
                completedAt: task.completedAt ? new Date(task.completedAt) : null,
                dueDateTime: task.dueDateTime ? new Date(task.dueDateTime) : null
            }));
        }
        return [];
    }

    loadSettings() {
        const saved = localStorage.getItem('todoSettings');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            deleteDelay: 12,
            colorTheme: 'blue',
            darkMode: false
        };
    }

    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    saveSettings() {
        localStorage.setItem('todoSettings', JSON.stringify(this.settings));
    }

    updateSettings() {
        this.settings.deleteDelay = parseInt(this.deleteDelay.value);
        this.saveSettings();
    }

    updateColorTheme() {
        this.settings.colorTheme = this.colorTheme.value;
        this.saveSettings();
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-color', this.settings.colorTheme);
        document.documentElement.setAttribute('data-theme', this.settings.darkMode ? 'dark' : 'light');
        
        // Update theme toggle icon
        const icon = this.themeToggle.querySelector('i');
        icon.className = this.settings.darkMode ? 'fas fa-moon' : 'fas fa-sun';
        
        // Update form values
        this.deleteDelay.value = this.settings.deleteDelay;
        this.colorTheme.value = this.settings.colorTheme;
    }

    toggleTheme() {
        this.settings.darkMode = !this.settings.darkMode;
        this.saveSettings();
        this.applyTheme();
    }

    showModal() {
        this.modal.classList.add('show');
        this.taskTitle.focus();
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        this.taskDate.value = today;
    }

    hideModal() {
        this.modal.classList.remove('show');
        this.taskForm.reset();
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const title = this.taskTitle.value.trim();
        if (!title) return;

        const task = {
            id: Date.now().toString(),
            title,
            description: this.taskDescription.value.trim(),
            priority: this.taskPriority.value,
            completed: false,
            createdAt: new Date(),
            completedAt: null,
            dueDateTime: null
        };

        // Combine date and time if both are provided
        if (this.taskDate.value && this.taskTime.value) {
            task.dueDateTime = new Date(`${this.taskDate.value}T${this.taskTime.value}`);
        } else if (this.taskDate.value) {
            task.dueDateTime = new Date(`${this.taskDate.value}T23:59`);
        }

        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.hideModal();

        // Show success notification
        this.showNotification('Task added successfully!', 'success');
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : null;

        if (task.completed) {
            // Schedule deletion after specified hours
            const deleteAfterMs = this.settings.deleteDelay * 60 * 60 * 1000; // Convert hours to milliseconds
            const timeoutId = setTimeout(() => {
                this.deleteTask(taskId, true);
            }, deleteAfterMs);
            
            this.deletionTimeouts.set(taskId, timeoutId);
            
            // Show notification
            this.showNotification(`Task completed! Will be auto-deleted in ${this.settings.deleteDelay} hours.`, 'success');
        } else {
            // Cancel scheduled deletion if task is unchecked
            if (this.deletionTimeouts.has(taskId)) {
                clearTimeout(this.deletionTimeouts.get(taskId));
                this.deletionTimeouts.delete(taskId);
            }
        }

        this.saveTasks();
        this.render();
    }

    deleteTask(taskId, isAutoDelete = false) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        
        // Clear any scheduled deletion
        if (this.deletionTimeouts.has(taskId)) {
            clearTimeout(this.deletionTimeouts.get(taskId));
            this.deletionTimeouts.delete(taskId);
        }
        
        this.saveTasks();
        this.render();
        
        if (isAutoDelete) {
            this.showNotification('Completed task auto-deleted', 'info');
        }
    }

    scheduleExistingDeletions() {
        const now = new Date();
        
        this.tasks.forEach(task => {
            if (task.completed && task.completedAt) {
                const completedTime = new Date(task.completedAt);
                const deleteAfterMs = this.settings.deleteDelay * 60 * 60 * 1000;
                const deleteTime = new Date(completedTime.getTime() + deleteAfterMs);
                
                if (deleteTime > now) {
                    // Schedule deletion for remaining time
                    const remainingTime = deleteTime.getTime() - now.getTime();
                    const timeoutId = setTimeout(() => {
                        this.deleteTask(task.id, true);
                    }, remainingTime);
                    
                    this.deletionTimeouts.set(task.id, timeoutId);
                } else {
                    // Task should have been deleted already
                    this.deleteTask(task.id, true);
                }
            }
        });
    }

    getTaskStatus(task) {
        if (task.completed) return 'completed';
        if (!task.dueDateTime) return 'normal';
        
        const now = new Date();
        const timeDiff = task.dueDateTime.getTime() - now.getTime();
        
        if (timeDiff < 0) return 'overdue';
        if (timeDiff < 60 * 60 * 1000) return 'due-soon'; // Less than 1 hour
        
        return 'normal';
    }

    formatTimeRemaining(task) {
        if (!task.dueDateTime) return '';
        
        const now = new Date();
        const timeDiff = task.dueDateTime.getTime() - now.getTime();
        
        if (timeDiff < 0) {
            const overdue = Math.abs(timeDiff);
            const hours = Math.floor(overdue / (1000 * 60 * 60));
            const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
            return `Overdue by ${hours}h ${minutes}m`;
        }
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours === 0) {
            return `Due in ${minutes}m`;
        }
        return `Due in ${hours}h ${minutes}m`;
    }

    renderTask(task) {
        const status = this.getTaskStatus(task);
        const timeRemaining = this.formatTimeRemaining(task);
        
        return `
            <div class="task-card ${status}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="app.toggleTask('${task.id}')">
                        ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="task-content">
                        <div class="task-title ${task.completed ? 'completed' : ''}">
                            ${task.title}
                            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                        </div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        <div class="task-meta">
                            ${task.dueDateTime ? `<span><i class="fas fa-clock"></i> ${task.dueDateTime.toLocaleDateString()} ${task.dueDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>` : ''}
                            ${timeRemaining ? `<span>${timeRemaining}</span>` : ''}
                            <span><i class="fas fa-calendar"></i> Created ${task.createdAt.toLocaleDateString()}</span>
                            ${task.completedAt ? `<span><i class="fas fa-check-circle"></i> Completed ${task.completedAt.toLocaleDateString()}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="delete-btn" onclick="app.deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        const activeTasks = this.tasks.filter(t => !t.completed);
        const completedTasks = this.tasks.filter(t => t.completed);
        
        // Render active tasks
        if (activeTasks.length === 0) {
            this.activeTasks.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-tasks" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No active tasks. Create your first task to get started!</p>
                </div>
            `;
        } else {
            // Sort by due date and priority
            activeTasks.sort((a, b) => {
                if (a.dueDateTime && b.dueDateTime) {
                    return a.dueDateTime - b.dueDateTime;
                }
                if (a.dueDateTime) return -1;
                if (b.dueDateTime) return 1;
                
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
            
            this.activeTasks.innerHTML = activeTasks.map(task => this.renderTask(task)).join('');
        }
        
        // Render completed tasks
        if (completedTasks.length === 0) {
            this.completedTasks.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No completed tasks yet. Keep working!</p>
                </div>
            `;
        } else {
            completedTasks.sort((a, b) => b.completedAt - a.completedAt);
            this.completedTasks.innerHTML = completedTasks.map(task => this.renderTask(task)).join('');
        }
        
        // Update stats
        this.updateStats(activeTasks.length, completedTasks.length);
    }

    updateStats(active, completed) {
        const total = active + completed;
        const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        this.activeCount.textContent = active;
        this.completedCount.textContent = completed;
        this.successRate.textContent = `${successRate}%`;
        this.activeTasksCount.textContent = active;
        this.completedTasksCount.textContent = completed;
    }

    startAlarmSystem() {
        // Check for due tasks every 30 seconds
        this.alarmInterval = setInterval(() => {
            this.checkForAlarms();
        }, 30000);
        
        // Check immediately
        this.checkForAlarms();
    }

    checkForAlarms() {
        const now = new Date();
        
        this.tasks.forEach(task => {
            if (task.completed || !task.dueDateTime) return;
            
            const timeDiff = task.dueDateTime.getTime() - now.getTime();
            
            // Notify when task is due (within 1 minute)
            if (timeDiff <= 60000 && timeDiff > 0) {
                this.showAlarmNotification(task);
                this.playAlarmSound();
                
                // Add visual indicator
                const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                if (taskElement) {
                    taskElement.classList.add('alarm-notification');
                }
            }
            
            // Remove alarm indicator after task time passes
            if (timeDiff < -60000) {
                const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                if (taskElement) {
                    taskElement.classList.remove('alarm-notification');
                }
            }
        });
    }

    showAlarmNotification(task) {
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`🚨 Task Due: ${task.title}`, {
                body: task.description || 'Time to complete this task!',
                icon: '/favicon.ico',
                tag: task.id,
                requireInteraction: true
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
        
        // In-app notification
        this.showNotification(`🚨 Task "${task.title}" is due now!`, 'warning', 5000);
    }

    playAlarmSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            border-left: 4px solid ${type === 'success' ? 'var(--success)' : type === 'warning' ? 'var(--warning)' : 'var(--info)'};
            box-shadow: 0 4px 12px var(--shadow-lg);
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Request notification permission on first interaction
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showNotification('Notifications enabled! You\'ll be alerted when tasks are due.', 'success');
                }
            });
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
    
    // Request notification permission on first user interaction
    let hasInteracted = false;
    const requestPermissionOnInteraction = () => {
        if (!hasInteracted) {
            hasInteracted = true;
            app.requestNotificationPermission();
            document.removeEventListener('click', requestPermissionOnInteraction);
            document.removeEventListener('keydown', requestPermissionOnInteraction);
        }
    };
    
    document.addEventListener('click', requestPermissionOnInteraction);
    document.addEventListener('keydown', requestPermissionOnInteraction);
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);