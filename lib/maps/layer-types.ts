/**
 * Layer type definitions and configuration for map layers
 */

export type LayerType =
  | "point"
  | "circle"
  | "heatmap"
  | "cluster"
  | "fill"
  | "line"
  | "symbol";

export interface LayerStyle {
  type: LayerType;
  paint?: Record<string, any>;
  layout?: Record<string, any>;
  filter?: any[];
}

export interface LayerConfig {
  id: string;
  name: string;
  parentId?: string; // For hierarchical layers
  type: LayerType;
  sourceId: string;
  style: LayerStyle;
  metadata?: {
    icon?: string;
    color?: string;
    category?: string;
    description?: string;
    endpoint?: string;
  };
  visible?: boolean;
  opacity?: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface LayerGroup {
  id: string;
  name: string;
  children: LayerConfig[];
  expanded?: boolean;
  visible?: boolean;
}

// Layer style presets for different data types
export const layerStylePresets = {
  // Asset types
  starlink: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 8,
      "circle-color": "#3b82f6", // Blue
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  iphone: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 7,
      "circle-color": "#10b981", // Green
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  powerbank: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 6,
      "circle-color": "#f59e0b", // Amber
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  food: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 6,
      "circle-color": "#ef4444", // Red
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  water: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 6,
      "circle-color": "#06b6d4", // Cyan
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  box_shelter: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 8,
      "circle-color": "#8b5cf6", // Purple
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  generator: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 9,
      "circle-color": "#f97316", // Orange
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  hygiene_kit: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 6,
      "circle-color": "#ec4899", // Pink
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  // Place types
  shelter: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 10,
      "circle-color": "#1e50ff", // Blue
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  jdf_base: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 10,
      "circle-color": "#22c55e", // Green
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  hospital: {
    type: "symbol" as LayerType,
    layout: {
      "icon-image": "hospital",
      "icon-size": 1.2,
    },
    paint: {
      "icon-color": "#ef4444", // Red
    },
  },
  // People types
  person_in_need: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 6,
      "circle-color": "#f59e0b", // Amber
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  aid_worker: {
    type: "circle" as LayerType,
    paint: {
      "circle-radius": 7,
      "circle-color": "#9333ea", // Purple
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.8,
    },
  },
  // Heatmap preset
  heatmap: {
    type: "heatmap" as LayerType,
    paint: {
      "heatmap-weight": ["get", "weight", 1],
      "heatmap-intensity": 1,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(33,102,172,0)",
        0.2,
        "rgb(103,169,207)",
        0.4,
        "rgb(209,229,240)",
        0.6,
        "rgb(253,219,199)",
        0.8,
        "rgb(239,138,98)",
        1,
        "rgb(178,24,43)",
      ],
      "heatmap-radius": 30,
      "heatmap-opacity": 0.6,
    },
  },
  // Cluster preset
  cluster: {
    type: "circle" as LayerType,
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#51bbd6",
        100,
        "#f1f075",
        750,
        "#f28cb1",
      ],
      "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
    },
  },
};
