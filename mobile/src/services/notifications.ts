import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PUSH_TOKEN_KEY = '@mindy/push_token';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized: boolean = false;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private onNotificationTap: ((data: Record<string, unknown>) => void) | null = null;

  /**
   * Initialize the notification service
   */
  async initialize(userId: string): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Only works on physical devices
      if (!Device.isDevice) {
        console.log('[Notifications] Physical device required for push notifications');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission denied');
        return false;
      }

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      console.log('[Notifications] Push token:', this.expoPushToken);

      // Register with backend
      await this.registerTokenWithBackend(userId);

      // Setup notification listeners
      this.setupListeners();

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#39FF14',
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('[Notifications] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(userId: string): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      // Check if we already registered this exact token
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (storedToken === `${userId}:${this.expoPushToken}`) {
        console.log('[Notifications] Token already registered');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          token: this.expoPushToken,
          platform: Platform.OS.toUpperCase() as 'IOS' | 'ANDROID',
          deviceId: Device.deviceName || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Store that we registered this token
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, `${userId}:${this.expoPushToken}`);
      console.log('[Notifications] Token registered with backend');
    } catch (error) {
      console.warn('[Notifications] Failed to register token:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  private setupListeners(): void {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notifications] Received:', notification.request.content.title);
      }
    );

    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        console.log('[Notifications] Tapped:', data);
        this.handleNotificationTap(data);
      }
    );
  }

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  private handleNotificationTap(data: Record<string, unknown>): void {
    if (this.onNotificationTap) {
      this.onNotificationTap(data);
    }
  }

  /**
   * Set callback for notification taps
   */
  setOnNotificationTap(callback: (data: Record<string, unknown>) => void): void {
    this.onNotificationTap = callback;
  }

  /**
   * Get the current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Schedule a daily streak reminder at a given hour (local time).
   * Cancels any previously scheduled reminder before creating a new one.
   */
  async scheduleStreakReminder(hour = 20, minute = 0): Promise<string | null> {
    try {
      // Cancel any existing streak reminder
      await this.cancelScheduledNotification('streak_reminder');

      const id = await Notifications.scheduleNotificationAsync({
        identifier: 'streak_reminder',
        content: {
          title: '🔥 Ne brise pas ta streak !',
          body: 'Tu n\'as pas encore appris aujourd\'hui. Garde ta série vivante — juste 5 min.',
          data: { type: 'STREAK_AT_RISK', source: 'local' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });

      await AsyncStorage.setItem('@mindy/streak_reminder_id', id);
      console.log(`[Notifications] Streak reminder scheduled at ${hour}:${minute.toString().padStart(2, '0')} → id=${id}`);
      return id;
    } catch (error) {
      console.warn('[Notifications] Failed to schedule streak reminder:', error);
      return null;
    }
  }

  /**
   * Schedule a daily challenge reminder at a given hour.
   */
  async scheduleDailyChallengeReminder(hour = 9, minute = 0): Promise<string | null> {
    try {
      await this.cancelScheduledNotification('daily_challenge_reminder');

      const id = await Notifications.scheduleNotificationAsync({
        identifier: 'daily_challenge_reminder',
        content: {
          title: '⚡ Défi du jour disponible',
          body: 'Ton défi quotidien t\'attend. Gagne du XP bonus maintenant !',
          data: { type: 'DAILY_CHALLENGE', source: 'local' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });

      await AsyncStorage.setItem('@mindy/daily_challenge_reminder_id', id);
      console.log(`[Notifications] Daily challenge reminder scheduled at ${hour}:${minute.toString().padStart(2, '0')}`);
      return id;
    } catch (error) {
      console.warn('[Notifications] Failed to schedule daily challenge reminder:', error);
      return null;
    }
  }

  /**
   * Schedule a one-time "inactivity" notification N days from now.
   */
  async scheduleInactivityReminder(daysFromNow = 3): Promise<string | null> {
    try {
      await this.cancelScheduledNotification('inactivity_reminder');

      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + daysFromNow);
      triggerDate.setHours(18, 0, 0, 0);

      const id = await Notifications.scheduleNotificationAsync({
        identifier: 'inactivity_reminder',
        content: {
          title: '👋 Mindy te manque !',
          body: `Ça fait ${daysFromNow} jours que tu n'as pas appris. Reprends là où tu t'es arrêté.`,
          data: { type: 'INACTIVITY_REMINDER', source: 'local' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      await AsyncStorage.setItem('@mindy/inactivity_reminder_id', id);
      console.log(`[Notifications] Inactivity reminder scheduled for ${triggerDate.toISOString()}`);
      return id;
    } catch (error) {
      console.warn('[Notifications] Failed to schedule inactivity reminder:', error);
      return null;
    }
  }

  /**
   * Cancel a specific scheduled notification by identifier.
   */
  async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {
      // Ignore — notification may not exist yet
    }
  }

  /**
   * Cancel ALL scheduled local notifications.
   */
  async cancelAllScheduled(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.multiRemove([
        '@mindy/streak_reminder_id',
        '@mindy/daily_challenge_reminder_id',
        '@mindy/inactivity_reminder_id',
      ]);
      console.log('[Notifications] All scheduled notifications cancelled');
    } catch (error) {
      console.warn('[Notifications] Failed to cancel all scheduled:', error);
    }
  }

  /**
   * Get all currently scheduled notifications (for debug / settings display).
   */
  async getScheduledNotifications() {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    this.notificationListener?.remove();
    this.responseListener?.remove();
    this.notificationListener = null;
    this.responseListener = null;
    this.isInitialized = false;
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Convenience exports
export const initializeNotifications = (userId: string) =>
  notificationService.initialize(userId);
export const getNotificationToken = () => notificationService.getToken();
export const isNotificationsEnabled = () => notificationService.isEnabled();
export const setOnNotificationTap = (callback: (data: Record<string, unknown>) => void) =>
  notificationService.setOnNotificationTap(callback);
export const cleanupNotifications = () => notificationService.cleanup();

// Local scheduling exports
export const scheduleStreakReminder = (hour?: number, minute?: number) =>
  notificationService.scheduleStreakReminder(hour, minute);
export const scheduleDailyChallengeReminder = (hour?: number, minute?: number) =>
  notificationService.scheduleDailyChallengeReminder(hour, minute);
export const scheduleInactivityReminder = (days?: number) =>
  notificationService.scheduleInactivityReminder(days);
export const cancelAllScheduledNotifications = () =>
  notificationService.cancelAllScheduled();
export const getScheduledNotifications = () =>
  notificationService.getScheduledNotifications();
