import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENT_QUEUE_KEY = '@mindy/analytics_queue';
const SESSION_ID_KEY = '@mindy/session_id';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export type EventType =
  | 'APP_OPENED'
  | 'SCREEN_VIEWED'
  | 'LESSON_STARTED'
  | 'LESSON_COMPLETED'
  | 'STEP_COMPLETED'
  | 'DAILY_CHALLENGE_COMPLETED'
  | 'STREAK_UPDATED'
  | 'LEVEL_UP';

interface QueuedEvent {
  userId: string;
  eventType: EventType;
  eventData?: Record<string, unknown>;
  sessionId: string;
  timestamp: string;
}

class AnalyticsService {
  private userId: string | null = null;
  private sessionId: string | null = null;
  private eventQueue: QueuedEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isInitialized: boolean = false;
  private isFlushing: boolean = false;

  /**
   * Initialize the analytics service
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.userId === userId) return;

    this.userId = userId;
    this.sessionId = this.generateSessionId();

    // Load any persisted events from previous session
    await this.loadPersistedQueue();

    // Start flush timer
    this.startFlushTimer();

    // Track app opened
    this.track('APP_OPENED');

    this.isInitialized = true;
    console.log('[Analytics] Initialized for user:', userId);
  }

  /**
   * Track an analytics event
   */
  track(eventType: EventType, eventData?: Record<string, unknown>): void {
    if (!this.userId || !this.sessionId) {
      console.warn('[Analytics] Not initialized, event dropped:', eventType);
      return;
    }

    const event: QueuedEvent = {
      userId: this.userId,
      eventType,
      eventData,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.eventQueue.push(event);
    console.log('[Analytics] Tracked:', eventType, eventData);

    // Flush immediately if queue is large enough
    if (this.eventQueue.length >= BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Track a screen view
   */
  trackScreen(screenName: string): void {
    this.track('SCREEN_VIEWED', { screenName });
  }

  /**
   * Flush events to backend
   */
  private async flush(): Promise<void> {
    if (this.isFlushing || this.eventQueue.length === 0) return;

    this.isFlushing = true;
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(`${API_BASE_URL}/analytics/track-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('[Analytics] Flushed', eventsToSend.length, 'events');
    } catch (error) {
      console.warn('[Analytics] Failed to flush, re-queuing events:', error);
      // Re-queue failed events
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
      // Persist to storage in case app closes
      await this.persistQueue();
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, FLUSH_INTERVAL);
  }

  /**
   * Stop the flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Load persisted queue from storage
   */
  private async loadPersistedQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(EVENT_QUEUE_KEY);
      if (stored) {
        const events = JSON.parse(stored) as QueuedEvent[];
        this.eventQueue = [...events, ...this.eventQueue];
        await AsyncStorage.removeItem(EVENT_QUEUE_KEY);
        console.log('[Analytics] Loaded', events.length, 'persisted events');
      }
    } catch (error) {
      console.warn('[Analytics] Failed to load persisted queue:', error);
    }
  }

  /**
   * Persist queue to storage
   */
  private async persistQueue(): Promise<void> {
    try {
      if (this.eventQueue.length > 0) {
        await AsyncStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(this.eventQueue));
        console.log('[Analytics] Persisted', this.eventQueue.length, 'events');
      }
    } catch (error) {
      console.warn('[Analytics] Failed to persist queue:', error);
    }
  }

  /**
   * Cleanup - flush remaining events and stop timer
   */
  async cleanup(): Promise<void> {
    this.stopFlushTimer();

    // Try to flush, if fails persist
    if (this.eventQueue.length > 0) {
      try {
        await this.flush();
      } catch {
        await this.persistQueue();
      }
    }

    this.isInitialized = false;
    console.log('[Analytics] Cleaned up');
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

// Convenience exports
export const initializeAnalytics = (userId: string) => analyticsService.initialize(userId);
export const trackEvent = (eventType: EventType, data?: Record<string, unknown>) =>
  analyticsService.track(eventType, data);
export const trackScreen = (screenName: string) => analyticsService.trackScreen(screenName);
export const cleanupAnalytics = () => analyticsService.cleanup();
