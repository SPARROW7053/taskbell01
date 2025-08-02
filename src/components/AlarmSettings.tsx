import React, { useState } from 'react';
import { Volume2, Upload, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from 'sonner';

interface AlarmSettings {
  soundType: 'beep' | 'custom' | 'built-in';
  customSoundUrl?: string;
  builtInSound: string;
  volume: number;
}

const defaultSettings: AlarmSettings = {
  soundType: 'beep',
  builtInSound: 'bell',
  volume: 0.7
};

const builtInSounds = {
  bell: 'Bell',
  chime: 'Chime', 
  notification: 'Notification',
  alert: 'Alert'
};

export const AlarmSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useLocalStorage<AlarmSettings>('alarm-settings', defaultSettings);
  const [tempSettings, setTempSettings] = useState<AlarmSettings>(settings);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTempSettings(prev => ({ 
        ...prev, 
        soundType: 'custom', 
        customSoundUrl: url 
      }));
      toast.success('Custom sound uploaded!');
    }
  };

  const playTestSound = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
      return;
    }

    let audio: HTMLAudioElement;

    if (tempSettings.soundType === 'custom' && tempSettings.customSoundUrl) {
      audio = new Audio(tempSettings.customSoundUrl);
    } else if (tempSettings.soundType === 'built-in') {
      // Generate built-in sounds using Web Audio API
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Different sound patterns
      switch (tempSettings.builtInSound) {
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
      gainNode.gain.setValueAtTime(tempSettings.volume, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 1);
      
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 1000);
      return;
    } else {
      // Default beep
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(tempSettings.volume, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
      
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 500);
      return;
    }

    audio.volume = tempSettings.volume;
    audio.play();
    setCurrentAudio(audio);
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    toast.success('Alarm settings saved!');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed top-4 right-20 z-50"
      >
        <Volume2 className="h-4 w-4 mr-2" />
        Alarm Settings
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-6 bg-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5" />
            <h2 className="text-xl font-bold">Alarm Settings</h2>
          </div>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Sound Type</Label>
            <Select 
              value={tempSettings.soundType} 
              onValueChange={(value: 'beep' | 'custom' | 'built-in') => 
                setTempSettings(prev => ({ ...prev, soundType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beep">Simple Beep</SelectItem>
                <SelectItem value="built-in">Built-in Sounds</SelectItem>
                <SelectItem value="custom">Custom Sound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tempSettings.soundType === 'built-in' && (
            <div className="space-y-2">
              <Label>Built-in Sound</Label>
              <Select 
                value={tempSettings.builtInSound} 
                onValueChange={(value) => 
                  setTempSettings(prev => ({ ...prev, builtInSound: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(builtInSounds).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tempSettings.soundType === 'custom' && (
            <div className="space-y-2">
              <Label>Upload Custom Sound</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {tempSettings.customSoundUrl && (
                <p className="text-sm text-muted-foreground">Custom sound loaded</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Volume: {Math.round(tempSettings.volume * 100)}%</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={tempSettings.volume}
              onChange={(e) => 
                setTempSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))
              }
              className="w-full"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={playTestSound} 
              variant="outline" 
              className="flex-1"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Test
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Test Sound
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={saveSettings} className="flex-1">
            Save Settings
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setTempSettings(defaultSettings);
              toast.success('Reset to defaults');
            }}
          >
            Reset
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
          <p className="font-semibold mb-1">How to change alarm sounds:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Use built-in sounds for consistent experience</li>
            <li>• Upload MP3/WAV files for custom sounds</li>
            <li>• Adjust volume to your preference</li>
            <li>• Test sounds before saving</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};