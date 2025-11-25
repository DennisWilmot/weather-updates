/**
 * PostgreSQL NOTIFY/LISTEN client for real-time database change notifications
 * Manages LISTEN connections with automatic reconnection
 */

import { Client } from 'pg';

export interface NotificationPayload {
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  id: string;
}

export interface NotifyClientOptions {
  connectionString: string;
  channel?: string;
  onNotification?: (payload: NotificationPayload) => void;
  onError?: (error: Error) => void;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

export class NotifyClient {
  private client: Client | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentDelay: number;
  private maxDelay: number;
  private isListening: boolean = false;
  private options: Required<NotifyClientOptions>;

  constructor(options: NotifyClientOptions) {
    this.options = {
      channel: 'map_updates',
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      onNotification: () => {},
      onError: () => {},
      ...options,
    };
    this.currentDelay = this.options.reconnectDelay;
    this.maxDelay = this.options.maxReconnectDelay;
  }

  /**
   * Start listening for notifications
   */
  async start(): Promise<void> {
    if (this.isListening) {
      return;
    }

    try {
      // Create dedicated connection for LISTEN (doesn't query, just listens)
      this.client = new Client({
        connectionString: this.options.connectionString,
      });

      // Connect to database
      await this.client.connect();

      // Start listening
      await this.client.query(`LISTEN ${this.options.channel}`);
      this.isListening = true;
      this.currentDelay = this.options.reconnectDelay; // Reset delay on successful connection

      // Set up notification handler
      this.client.on('notification', (msg) => {
        try {
          const payload: NotificationPayload = JSON.parse(msg.payload || '{}');
          this.options.onNotification(payload);
        } catch (error) {
          console.error('Error parsing notification payload:', error);
          this.options.onError(
            error instanceof Error
              ? error
              : new Error('Failed to parse notification payload')
          );
        }
      });

      // Set up error handler
      this.client.on('error', (error) => {
        console.error('LISTEN connection error:', error);
        this.isListening = false;
        this.options.onError(
          error instanceof Error ? error : new Error('LISTEN connection error')
        );
        this.scheduleReconnect();
      });

      console.log(`Started listening on channel: ${this.options.channel}`);
    } catch (error) {
      console.error('Error starting LISTEN:', error);
      this.isListening = false;
      this.options.onError(
        error instanceof Error ? error : new Error('Failed to start LISTEN')
      );
      this.scheduleReconnect();
    }
  }

  /**
   * Stop listening and close connection
   */
  async stop(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      try {
        await this.client.query(`UNLISTEN ${this.options.channel}`);
        await this.client.end();
      } catch (error) {
        console.error('Error stopping LISTEN:', error);
      }
      this.client = null;
    }

    this.isListening = false;
    console.log(`Stopped listening on channel: ${this.options.channel}`);
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
      this.start();
      // Increase delay for next reconnection (exponential backoff)
      this.currentDelay = Math.min(this.currentDelay * 2, this.maxDelay);
    }, this.currentDelay);
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }
}

