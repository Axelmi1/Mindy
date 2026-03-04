import { Audio } from 'expo-av';
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

class SoundService {
  private sounds: Map<SoundName, Audio.Sound> = new Map();
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

      // Configure audio mode for iOS - optimized for low latency
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Preload ALL sounds in parallel for instant playback
      await Promise.all([
        this.preloadSound('correct'),
        this.preloadSound('wrong'),
        this.preloadSound('complete'),
        this.preloadSound('streak'),
        this.preloadSound('levelUp'),
        this.preloadSound('tap'),
      ]);

      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize sound service:', error);
    }
  }

  /**
   * Preload a sound for faster playback
   */
  private async preloadSound(name: SoundName): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: SOUND_URLS[name] },
        { shouldPlay: false, volume: 0.5 }
      );
      this.sounds.set(name, sound);
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
      const sound = this.sounds.get(name);

      if (!sound) {
        // Sound not preloaded - skip to avoid delay
        console.warn(`Sound ${name} not preloaded, skipping`);
        return;
      }

      // Fire and forget for instant response - don't await
      sound.setPositionAsync(0).then(() => {
        sound.playAsync();
      });
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
    for (const sound of this.sounds.values()) {
      try {
        await sound.unloadAsync();
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
