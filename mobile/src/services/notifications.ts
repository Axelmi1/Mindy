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
