import React, { useState } from 'react';
import { Settings, Palette, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from 'sonner';

interface ColorTheme {
  primary: string;
  aiPrimary: string;
  aiSecondary: string;
  taskCompleted: string;
  taskUpcoming: string;
  taskOverdue: string;
  background: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
}

const defaultTheme: ColorTheme = {
  primary: '#8b5cf6',
  aiPrimary: '#8b5cf6', 
  aiSecondary: '#a855f7',
  taskCompleted: '#22c55e',
  taskUpcoming: '#f59e0b',
  taskOverdue: '#ef4444',
  background: '#fefcff',
  cardBackground: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b'
};

export const ColorCustomizer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useLocalStorage<ColorTheme>('color-theme', defaultTheme);
  const [tempTheme, setTempTheme] = useState<ColorTheme>(theme);

  const colorLabels = {
    primary: 'Primary Color',
    aiPrimary: 'AI Primary',
    aiSecondary: 'AI Secondary', 
    taskCompleted: 'Completed Tasks',
    taskUpcoming: 'Upcoming Tasks',
    taskOverdue: 'Overdue Tasks',
    background: 'Background',
    cardBackground: 'Card Background',
    textPrimary: 'Primary Text',
    textSecondary: 'Secondary Text'
  };

  const handleColorChange = (key: keyof ColorTheme, value: string) => {
    setTempTheme(prev => ({ ...prev, [key]: value }));
  };

  const applyTheme = () => {
    const root = document.documentElement;
    
    // Convert hex to HSL for CSS variables
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    root.style.setProperty('--primary', hexToHsl(tempTheme.primary));
    root.style.setProperty('--ai-primary', hexToHsl(tempTheme.aiPrimary));
    root.style.setProperty('--ai-secondary', hexToHsl(tempTheme.aiSecondary));
    root.style.setProperty('--task-completed', hexToHsl(tempTheme.taskCompleted));
    root.style.setProperty('--task-upcoming', hexToHsl(tempTheme.taskUpcoming));
    root.style.setProperty('--task-overdue', hexToHsl(tempTheme.taskOverdue));
    root.style.setProperty('--background', hexToHsl(tempTheme.background));
    root.style.setProperty('--card', hexToHsl(tempTheme.cardBackground));
    root.style.setProperty('--foreground', hexToHsl(tempTheme.textPrimary));
    root.style.setProperty('--muted-foreground', hexToHsl(tempTheme.textSecondary));

    setTheme(tempTheme);
    toast.success('Theme applied successfully!');
  };

  const resetToDefaults = () => {
    setTempTheme(defaultTheme);
    const root = document.documentElement;
    
    // Reset to default values
    root.style.removeProperty('--primary');
    root.style.removeProperty('--ai-primary');
    root.style.removeProperty('--ai-secondary');
    root.style.removeProperty('--task-completed');
    root.style.removeProperty('--task-upcoming');
    root.style.removeProperty('--task-overdue');
    root.style.removeProperty('--background');
    root.style.removeProperty('--card');
    root.style.removeProperty('--foreground');
    root.style.removeProperty('--muted-foreground');
    
    setTheme(defaultTheme);
    toast.success('Reset to default theme!');
  };

  // Apply saved theme on component mount
  React.useEffect(() => {
    if (theme !== defaultTheme) {
      setTempTheme(theme);
      applyTheme();
    }
  }, []);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50"
      >
        <Palette className="h-4 w-4 mr-2" />
        Customize Colors
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 bg-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <h2 className="text-xl font-bold">Color Customization</h2>
          </div>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(colorLabels).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <div className="flex gap-2">
                <Input
                  id={key}
                  type="color"
                  value={tempTheme[key as keyof ColorTheme]}
                  onChange={(e) => handleColorChange(key as keyof ColorTheme, e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={tempTheme[key as keyof ColorTheme]}
                  onChange={(e) => handleColorChange(key as keyof ColorTheme, e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={applyTheme} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Apply Theme
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Preview</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: tempTheme.primary }}></div>
              <div className="w-8 h-8 rounded" style={{ backgroundColor: tempTheme.aiPrimary }}></div>
              <div className="w-8 h-8 rounded" style={{ backgroundColor: tempTheme.taskCompleted }}></div>
              <div className="w-8 h-8 rounded" style={{ backgroundColor: tempTheme.taskUpcoming }}></div>
              <div className="w-8 h-8 rounded" style={{ backgroundColor: tempTheme.taskOverdue }}></div>
            </div>
            <p className="text-sm text-muted-foreground">
              Preview your color scheme above
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};