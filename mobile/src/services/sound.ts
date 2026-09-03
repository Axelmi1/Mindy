import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sound types available in the app
export type SoundName = 'correct' | 'wrong' | 'complete' | 'streak' | 'levelUp' | 'tap';

// Sound URLs - Short, satisfying sound effects
const SOUND_URLS: Record<SoundName, string> = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Short positive beep
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3', // Soft negative tone
  complete: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // Quick achievement ding
  streak: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3', // Quick bonus sound
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3', // Short level up chime
  tap: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Quick click
};

const STORAGE_KEY = '@mindy_sound_enabled';

/**
 * Service son basé sur expo-audio (remplaçant officiel d'expo-av,
 * seul supporté par Expo Go SDK 57+).
 */
class SoundService {
  private sounds: Map<SoundName, AudioPlayer> = new Map();
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;

  /**
   * Initialize the sound service
   * Loads settings from storage and preloads ALL sounds
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load sound preference
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      this.isEnabled = stored !== 'false';

      // Configure audio mode for iOS - play even in silent mode
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });

      // Create players for ALL sounds (loading happens lazily inside expo-audio)
      (Object.keys(SOUND_URLS) as SoundName[]).forEach((name) => this.preloadSound(name));

      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize sound service:', error);
    }
  }

  /**
   * Preload a sound for faster playback
   */
  private preloadSound(name: SoundName): void {
    try {
      const player = createAudioPlayer({ uri: SOUND_URLS[name] });
      player.volume = 0.5;
      this.sounds.set(name, player);
    } catch (error) {
      console.warn(`Failed to preload sound ${name}:`, error);
    }
  }

  /**
   * Play a sound - optimized for low latency
   */
  async play(name: SoundName): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const player = this.sounds.get(name);

      if (!player) {
        // Sound not preloaded - skip to avoid delay
        console.warn(`Sound ${name} not preloaded, skipping`);
        return;
      }

      // Fire and forget for instant response
      player.seekTo(0);
      player.play();
    } catch (error) {
      console.warn(`Failed to play sound ${name}:`, error);
    }
  }

  /**
   * Enable or disable sounds
   */
  async setEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  }

  /**
   * Check if sounds are enabled
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Cleanup sounds when app is closing
   */
  async cleanup(): Promise<void> {
    for (const player of this.sounds.values()) {
      try {
        player.remove();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    this.sounds.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const soundService = new SoundService();

// Convenience functions
export const playSound = (name: SoundName) => soundService.play(name);
export const setSoundEnabled = (enabled: boolean) => soundService.setEnabled(enabled);
export const isSoundEnabled = () => soundService.getEnabled();
export const initializeSound = () => soundService.initialize();
