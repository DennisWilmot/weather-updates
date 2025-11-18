/**
 * MapLayerManager - Manages dynamic layer registration and visibility
 * Handles parent-child relationships for hierarchical toggling
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { LayerConfig, LayerType } from '@/lib/maps/layer-types';
import { getChildLayerIds, getParentLayerId } from '@/lib/maps/layer-hierarchy';

interface LayerState {
  config: LayerConfig;
  visible: boolean;
  sourceData?: any; // GeoJSON data
}

export class MapLayerManager {
  private map: maplibregl.Map | null = null;
  private layers: Map<string, LayerState> = new Map();
  private listeners: Map<string, Set<(visible: boolean) => void>> = new Map();

  constructor(map: maplibregl.Map) {
    this.map = map;
  }

  /**
   * Register a layer configuration
   */
  registerLayer(config: LayerConfig): void {
    if (!this.map) return;

    const layerState: LayerState = {
      config,
      visible: config.visible ?? false,
    };

    this.layers.set(config.id, layerState);

    // Add source if it doesn't exist
    if (!this.map.getSource(config.sourceId)) {
      // Source will be added when data is loaded
      console.warn(`Source ${config.sourceId} not found. Add source data first.`);
    }

    // Add layer to map if visible
    if (layerState.visible) {
      this.addLayerToMap(config);
    }
  }

  /**
   * Add layer to map
   */
  private addLayerToMap(config: LayerConfig): void {
    if (!this.map) return;

    try {
      // Check if layer already exists
      if (this.map.getLayer(config.id)) {
        return;
      }

      // Add layer based on type
      const layerDef: any = {
        id: config.id,
        source: config.sourceId,
        ...config.style,
        type: config.type, // Ensure type is set after style spread
      };

      // Add filter if specified
      if (config.style.filter) {
        layerDef.filter = config.style.filter;
      }

      this.map.addLayer(layerDef);

      // Set opacity if specified
      if (config.opacity !== undefined) {
        this.setLayerOpacity(config.id, config.opacity);
      }

      // Set zoom limits if specified
      if (config.minZoom !== undefined) {
        this.map.setLayerZoomRange(config.id, config.minZoom, config.maxZoom ?? 24);
      }
    } catch (error) {
      console.error(`Error adding layer ${config.id}:`, error);
    }
  }

  /**
   * Remove layer from map
   */
  private removeLayerFromMap(layerId: string): void {
    if (!this.map) return;

    try {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    } catch (error) {
      console.error(`Error removing layer ${layerId}:`, error);
    }
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(layerId: string, visible: boolean): void {
    const layerState = this.layers.get(layerId);
    if (!layerState) {
      console.warn(`Layer ${layerId} not found`);
      return;
    }

    layerState.visible = visible;

    if (visible) {
      this.addLayerToMap(layerState.config);
    } else {
      this.removeLayerFromMap(layerId);
    }

    // Notify listeners
    this.notifyListeners(layerId, visible);

    // Handle parent-child relationships
    this.handleParentChildVisibility(layerId, visible);
  }

  /**
   * Handle parent-child visibility relationships
   */
  private handleParentChildVisibility(layerId: string, visible: boolean): void {
    // If parent is toggled, toggle all children
    const childIds = getChildLayerIds(layerId);
    if (childIds.length > 0) {
      childIds.forEach((childId) => {
        const childState = this.layers.get(childId);
        if (childState) {
          this.setLayerVisibility(childId, visible);
        }
      });
    }

    // If child is toggled, update parent state (indeterminate if some children are visible)
    const parentId = getParentLayerId(layerId);
    if (parentId) {
      const parentState = this.layers.get(parentId);
      if (parentState) {
        const childIds = getChildLayerIds(parentId);
        const visibleChildren = childIds.filter(
          (id) => this.layers.get(id)?.visible
        );
        
        // If all children are visible, parent should be visible
        // If some children are visible, parent is in indeterminate state
        // If no children are visible, parent should be hidden
        // Note: We don't auto-toggle parent, but we track state for UI
      }
    }
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    if (!this.map) return;

    const layerState = this.layers.get(layerId);
    if (!layerState) return;

    layerState.config.opacity = opacity;

    try {
      const layer = this.map.getLayer(layerId);
      if (layer) {
        // Update opacity based on layer type
        if (layer.type === 'circle') {
          this.map.setPaintProperty(layerId, 'circle-opacity', opacity);
        } else if (layer.type === 'fill') {
          this.map.setPaintProperty(layerId, 'fill-opacity', opacity);
        } else if (layer.type === 'heatmap') {
          this.map.setPaintProperty(layerId, 'heatmap-opacity', opacity);
        }
      }
    } catch (error) {
      console.error(`Error setting opacity for layer ${layerId}:`, error);
    }
  }

  /**
   * Update layer source data
   */
  updateLayerData(layerId: string, data: any): void {
    if (!this.map) return;

    const layerState = this.layers.get(layerId);
    if (!layerState) return;

    layerState.sourceData = data;

    try {
      const source = this.map.getSource(layerState.config.sourceId);
      if (source && source.type === 'geojson') {
        (source as maplibregl.GeoJSONSource).setData(data);
      }
    } catch (error) {
      console.error(`Error updating data for layer ${layerId}:`, error);
    }
  }

  /**
   * Add source to map
   */
  addSource(sourceId: string, source: any): void {
    if (!this.map) return;

    try {
      if (this.map.getSource(sourceId)) {
        // Update existing source
        const existingSource = this.map.getSource(sourceId);
        if (existingSource && existingSource.type === 'geojson' && 'data' in source) {
          (existingSource as maplibregl.GeoJSONSource).setData((source as any).data);
        }
      } else {
        this.map.addSource(sourceId, source);
      }
    } catch (error) {
      console.error(`Error adding source ${sourceId}:`, error);
    }
  }

  /**
   * Get layer visibility state
   */
  getLayerVisibility(layerId: string): boolean {
    return this.layers.get(layerId)?.visible ?? false;
  }

  /**
   * Get all registered layers
   */
  getAllLayers(): LayerConfig[] {
    return Array.from(this.layers.values()).map((state) => state.config);
  }

  /**
   * Get visible layers
   */
  getVisibleLayers(): LayerConfig[] {
    return Array.from(this.layers.values())
      .filter((state) => state.visible)
      .map((state) => state.config);
  }

  /**
   * Subscribe to layer visibility changes
   */
  onLayerVisibilityChange(
    layerId: string,
    callback: (visible: boolean) => void
  ): () => void {
    if (!this.listeners.has(layerId)) {
      this.listeners.set(layerId, new Set());
    }
    this.listeners.get(layerId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(layerId)?.delete(callback);
    };
  }

  /**
   * Notify listeners of visibility change
   */
  private notifyListeners(layerId: string, visible: boolean): void {
    this.listeners.get(layerId)?.forEach((callback) => {
      callback(visible);
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.layers.clear();
    this.listeners.clear();
    this.map = null;
  }
}

/**
 * React hook for MapLayerManager
 */
export function useMapLayerManager(map: maplibregl.Map | null) {
  const managerRef = useRef<MapLayerManager | null>(null);

  useEffect(() => {
    if (map && !managerRef.current) {
      managerRef.current = new MapLayerManager(map);
    }

    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, [map]);

  const registerLayer = useCallback((config: LayerConfig) => {
    managerRef.current?.registerLayer(config);
  }, []);

  const setLayerVisibility = useCallback((layerId: string, visible: boolean) => {
    managerRef.current?.setLayerVisibility(layerId, visible);
  }, []);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    managerRef.current?.setLayerOpacity(layerId, opacity);
  }, []);

  const updateLayerData = useCallback((layerId: string, data: any) => {
    managerRef.current?.updateLayerData(layerId, data);
  }, []);

  const addSource = useCallback((sourceId: string, source: any) => {
    managerRef.current?.addSource(sourceId, source);
  }, []);

  const getLayerVisibility = useCallback((layerId: string): boolean => {
    return managerRef.current?.getLayerVisibility(layerId) ?? false;
  }, []);

  return {
    manager: managerRef.current,
    registerLayer,
    setLayerVisibility,
    setLayerOpacity,
    updateLayerData,
    addSource,
    getLayerVisibility,
  };
}

