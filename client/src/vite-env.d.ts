/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JAVA_API_BASE_URL: string
  readonly VITE_PYTHON_API_BASE_URL: string
  readonly VITE_JAVA_WS_ALERTS_URL: string
  readonly VITE_JAVA_WS_ANALYTICS_URL: string
  readonly VITE_USE_MOCKS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Patch for react-leaflet v5 + TypeScript 6 moduleResolution:bundler type gap.
// With bundler resolution some leaflet types resolve from the ESM bundle instead
// of @types/leaflet, losing center/radius/icon. Augment them back.
declare module 'leaflet' {
  interface MapOptions {
    center?: LatLngExpression
    zoom?: number
    zoomControl?: boolean
  }
  interface CircleMarkerOptions {
    radius?: number
  }
  interface MarkerOptions {
    icon?: Icon | DivIcon
    interactive?: boolean
  }
  interface TileLayerOptions {
    className?: string
    attribution?: string
    url?: string
  }
  // divIcon factory — needed by arrow markers in TrajectoryMap
  function divIcon(options?: DivIconOptions): DivIcon
  // leaflet.heat plugin — extends L with heatLayer
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number
      maxZoom?: number
      max?: number
      radius?: number
      blur?: number
      gradient?: Record<number, string>
    },
  ): Layer
}

declare module 'leaflet.heat' {
  // Side-effect import only — adds L.heatLayer at runtime
}
