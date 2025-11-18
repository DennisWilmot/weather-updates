/**
 * EnhancedMap - Main map component with dynamic layer support
 * Replaces ShelteringJDFMap with enhanced functionality
 */

'use client';

import { Box } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapLayerManager } from './MapLayerManager';
import { createDefaultMapStyle, defaultMapOptions } from '@/lib/maps/map-utils';
import { LayerConfig } from '@/lib/maps/layer-types';

interface EnhancedMapProps {
  className?: string;
  onMapLoad?: (map: maplibregl.Map) => void;
  initialLayers?: LayerConfig[];
}

export default function EnhancedMap({
  className,
  onMapLoad,
  initialLayers = [],
}: EnhancedMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const popup = useRef<maplibregl.Popup | null>(null);

  const {
    manager,
    registerLayer,
    setLayerVisibility,
    addSource,
    updateLayerData,
  } = useMapLayerManager(map.current);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: createDefaultMapStyle(),
      ...defaultMapOptions,
    });

    // Create popup for feature details
    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '300px',
    });

    map.current.on('load', () => {
      if (!map.current) return;
      setMapLoaded(true);
      onMapLoad?.(map.current);

      // Register initial layers
      initialLayers.forEach((layer) => {
        registerLayer(layer);
      });
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Only initialize once

  // Register layers when manager is ready
  useEffect(() => {
    if (!manager || !mapLoaded) return;

    initialLayers.forEach((layer) => {
      // Add source first
      if (layer.sourceId && !map.current?.getSource(layer.sourceId)) {
        addSource(layer.sourceId, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }

      // Register layer
      registerLayer(layer);
    });
  }, [manager, mapLoaded, initialLayers, registerLayer, addSource]);

  return (
    <Box
      ref={mapContainer}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'pan-x pan-y pinch-zoom',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto',
      }}
    />
  );
}

