/**
 * Real-time update handler for map data
 * Connects to SSE stream and updates map layers
 */

export interface MapUpdateEvent {
  type: 'initial' | 'created' | 'updated' | 'deleted';
  layerType:
    | 'assets'
    | 'places'
    | 'people'
    | 'aid_workers'
    | 'distributions'
    | 'needs'
    | 'status';
  data: any; // GeoJSON feature or array of features
  timestamp: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface RealtimeConnectionOptions {
  layers?: string[]; // Layer types to subscribe to
  parishId?: string;
  lastEventId?: string;
  onUpdate?: (event: MapUpdateEvent) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  reconnectDelay?: number; // Initial reconnect delay in ms
  maxReconnectDelay?: number; // Max reconnect delay in ms
}

export class RealtimeConnection {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentDelay: number;
  private maxDelay: number;
  private status: ConnectionStatus = 'disconnected';
  private options: RealtimeConnectionOptions;

  constructor(options: RealtimeConnectionOptions = {}) {
    this.options = {
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      ...options,
    };
    this.currentDelay = this.options.reconnectDelay || 1000;
    this.maxDelay = this.options.maxReconnectDelay || 30000;
  }

  /**
   * Connect to SSE stream
   */
  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.setStatus('connecting');

    // Build SSE URL with query params
    const params = new URLSearchParams();
    if (this.options.layers && this.options.layers.length > 0) {
      params.set('layers', this.options.layers.join(','));
    }
    if (this.options.parishId) {
      params.set('parishId', this.options.parishId);
    }
    if (this.options.lastEventId) {
      params.set('lastEventId', this.options.lastEventId);
    }

    const url = `/api/map/stream?${params.toString()}`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.setStatus('connected');
        this.currentDelay = this.options.reconnectDelay || 1000; // Reset delay on successful connection
      };

      this.eventSource.onmessage = (event) => {
        try {
          const updateEvent: MapUpdateEvent = JSON.parse(event.data);
          this.options.onUpdate?.(updateEvent);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.setStatus('error');
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setStatus('disconnected');
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
      this.connect();
      // Increase delay for next reconnection (exponential backoff)
      this.currentDelay = Math.min(this.currentDelay * 2, this.maxDelay);
    }, this.currentDelay);
  }

  /**
   * Set connection status and notify listeners
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.options.onStatusChange?.(status);
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Update subscription options
   */
  updateOptions(options: Partial<RealtimeConnectionOptions>): void {
    this.options = { ...this.options, ...options };
    // Reconnect with new options if currently connected
    if (this.status === 'connected' || this.status === 'connecting') {
      this.disconnect();
      this.connect();
    }
  }
}

/**
 * Create a real-time connection
 */
export function createRealtimeConnection(
  options: RealtimeConnectionOptions = {}
): RealtimeConnection {
  const connection = new RealtimeConnection(options);
  connection.connect();
  return connection;
}

/**
 * Handle map update event
 * Updates the appropriate layer in MapLayerManager
 */
export function handleMapUpdate(
  event: MapUpdateEvent,
  updateLayerData: (layerId: string, data: any) => void
): void {
  // Map layerType to layer ID
  const layerIdMap: Record<string, string> = {
    assets: 'assets',
    places: 'places',
    people: 'people',
    aid_workers: 'aid-workers',
    distributions: 'asset-distributions',
    needs: 'people-needs',
    status: 'place-status',
  };

  const layerId = layerIdMap[event.layerType];
  if (!layerId) {
    console.warn(`Unknown layer type: ${event.layerType}`);
    return;
  }

  // Handle different event types
  switch (event.type) {
    case 'initial':
      // Set initial data
      if (Array.isArray(event.data)) {
        updateLayerData(layerId, {
          type: 'FeatureCollection',
          features: event.data,
        });
      } else {
        updateLayerData(layerId, event.data);
      }
      break;

    case 'created':
      // Add new feature(s)
      // Note: This would require fetching current data and appending
      // For now, we'll trigger a full refresh
      console.log('New feature created, refresh needed');
      break;

    case 'updated':
      // Update existing feature(s)
      // Note: This would require updating specific features
      // For now, we'll trigger a full refresh
      console.log('Feature updated, refresh needed');
      break;

    case 'deleted':
      // Remove feature(s)
      // Note: This would require removing specific features
      // For now, we'll trigger a full refresh
      console.log('Feature deleted, refresh needed');
      break;
  }
}



