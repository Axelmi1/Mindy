import { useEffect, useState, useCallback } from 'react';
import {
  soundService,
  playSound as playSoundService,
  type SoundName,
} from '../services/sound';

/**
 * Hook for playing sounds in components
 */
export function useSound() {
  const [isEnabled, setIsEnabled] = useState(soundService.getEnabled());

  // Play a sound
  const play = useCallback((name: SoundName) => {
    playSoundService(name);
  }, []);

  // Toggle sound on/off
  const toggle = useCallback(async () => {
    const newValue = !isEnabled;
    await soundService.setEnabled(newValue);
    setIsEnabled(newValue);
  }, [isEnabled]);

  // Set sound enabled state
  const setEnabled = useCallback(async (enabled: boolean) => {
    await soundService.setEnabled(enabled);
    setIsEnabled(enabled);
  }, []);

  return {
    play,
    isEnabled,
    toggle,
    setEnabled,
  };
}

/**
 * Hook to initialize sound service on app start
 */
export function useSoundInitializer() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    soundService.initialize().then(() => {
      setIsReady(true);
    });

    return () => {
      soundService.cleanup();
    };
  }, []);

  return isReady;
}
