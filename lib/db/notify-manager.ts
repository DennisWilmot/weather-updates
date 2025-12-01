/**
 * Singleton NotifyManager - Shares a single LISTEN connection across all SSE streams
 * Prevents connection pool exhaustion by reusing one connection for all listeners
 */

import { Client } from "pg";
import { NotificationPayload } from "./notify-client";

type NotificationHandler = (
  payload: NotificationPayload
) => void | Promise<void>;

class NotifyManager {
  private static instance: NotifyManager | null = null;
  private client: Client | null = null;
  private subscribers: Set<NotificationHandler> = new Set();
  private isListening: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentDelay: number = 1000;
  private maxDelay: number = 30000;
  private connectionString: string;
  private channel: string = "map_updates";

  private constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  /**
   * Get singleton instance
   */
  static getInstance(connectionString?: string): NotifyManager {
    if (!NotifyManager.instance) {
      if (!connectionString) {
        throw new Error("Connection string required for first initialization");
      }
      NotifyManager.instance = new NotifyManager(connectionString);
    }
    return NotifyManager.instance;
  }

  /**
   * Subscribe to notifications
   * Returns unsubscribe function
   */
  subscribe(handler: NotificationHandler): () => void {
    this.subscribers.add(handler);

    // Start listening if not already started
    if (!this.isListening) {
      this.start().catch((error) => {
        console.error("Error starting NotifyManager:", error);
      });
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(handler);

      // If no more subscribers, stop listening
      if (this.subscribers.size === 0) {
        this.stop().catch((error) => {
          console.error("Error stopping NotifyManager:", error);
        });
      }
    };
  }

  /**
   * Start listening for notifications
   */
  private async start(): Promise<void> {
    if (this.isListening || this.client) {
      return;
    }

    try {
      // Create single connection for LISTEN (shared across all subscribers)
      this.client = new Client({
        connectionString: this.connectionString,
      });

      // Connect to database
      await this.client.connect();

      // Start listening
      await this.client.query(`LISTEN ${this.channel}`);
      this.isListening = true;
      this.currentDelay = 1000; // Reset delay on successful connection

      // Set up notification handler - broadcast to all subscribers
      this.client.on("notification", (msg) => {
        try {
          const payload: NotificationPayload = JSON.parse(msg.payload || "{}");

          // Broadcast to all subscribers
          this.subscribers.forEach((handler) => {
            try {
              handler(payload);
            } catch (error) {
              console.error("Error in notification handler:", error);
            }
          });
        } catch (error) {
          console.error("Error parsing notification payload:", error);
        }
      });

      // Set up error handler
      this.client.on("error", (error) => {
        console.error("LISTEN connection error:", error);
        this.isListening = false;
        this.scheduleReconnect();
      });

      console.log(
        `[NotifyManager] Started listening on channel: ${this.channel} (${this.subscribers.size} subscribers)`
      );
    } catch (error) {
      console.error("[NotifyManager] Error starting LISTEN:", error);
      this.isListening = false;
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Stop listening and close connection
   */
  private async stop(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      try {
        await this.client.query(`UNLISTEN ${this.channel}`);
        await this.client.end();
      } catch (error) {
        console.error("[NotifyManager] Error stopping LISTEN:", error);
      }
      this.client = null;
    }

    this.isListening = false;
    console.log(`[NotifyManager] Stopped listening (no subscribers)`);
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return; // Already scheduled
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.subscribers.size > 0) {
        // Only reconnect if there are subscribers
        this.start().catch((error) => {
          console.error("[NotifyManager] Reconnection failed:", error);
        });
        // Increase delay for next reconnection (exponential backoff)
        this.currentDelay = Math.min(this.currentDelay * 2, this.maxDelay);
      }
    }, this.currentDelay);
  }

  /**
   * Get current subscriber count
   */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }
}

export default NotifyManager;
