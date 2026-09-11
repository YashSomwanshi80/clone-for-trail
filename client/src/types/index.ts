export interface User {
  id: string
  userId: string
  displayName: string
  status: 'ACTIVE' | 'DISABLED'
  lastActive: string
}

export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ACTIVE' | 'INACTIVE'

export interface Camera {
  id: string
  name: string
  lat: number
  lng: number
  zone: string
  status: CameraStatus
  detectionsToday: number
  lastPingSeconds: number
}

export interface CameraHealth {
  id: string
  status: CameraStatus
  uptimePercent: number
  lastPing: string  // ISO timestamp of last successful ping
  latencyMs: number
  detectionsToday: number
}

export interface TrajectoryPoint {
  cameraId: string
  cameraName: string
  lat: number
  lng: number
  timestamp: string
  direction: number // degrees, for arrow rendering
  confidence: number
  isAnomaly?: boolean
}

export interface Trajectory {
  plateNumber: string
  points: TrajectoryPoint[]
  totalCameras: number
  totalDetections: number
  distanceKm: number
  durationMinutes: number
}

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'

export interface Alert {
  id: string
  severity: AlertSeverity
  status: AlertStatus
  type: string
  plateNumber: string
  cameraId: string
  cameraName: string
  timestamp: string
}

export interface BlacklistEntry {
  plateNumber: string
  reason: string
  addedBy: string
  addedAt: string
}

export type MediaStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type MediaSourceType = 'LIVE' | 'MANUAL_UPLOAD'  // matches Media.SourceType: LIVE, MANUAL_UPLOAD
export type MediaType = 'IMAGE' | 'VIDEO'               // matches Media.MediaType

/**
 * Mirrors Java's MediaResponse record exactly:
 *   mediaId, sourceType, cameraId, mediaType, capturedAt, status, detectionResult
 *
 * Note: Java does NOT return fileName, fileType, manualGeoTag, or createdAt.
 * Those were only in the old mock shape; extra optional fields are kept below
 * so existing mock code continues working without changes.
 */
export interface MediaJob {
  // --- Java MediaResponse fields (ground truth) ---
  mediaId: string
  sourceType: MediaSourceType
  cameraId: string | null
  mediaType: MediaType
  capturedAt: string          // Java Instant serialises as ISO-8601 string
  status: MediaStatus
  detectionResult?: unknown   // typed as Object in Java until DetectionResponse is finalised

  // --- Mock-only extras (not returned by real Java endpoint) ---
  manualGeoTag?: { lat: number; lng: number } | null
  fileName?: string
  fileType?: MediaType
  createdAt?: string
  result?: {
    plateNumber: string
    confidence: number
    cropFilename: string
    hasPriorSightings: boolean
    errorMessage?: string
  }
}

/**
 * Pushed by Java over /ws/analytics/live WebSocket — shape defined by the WS
 * producer, not by a REST DTO.  Used by useAnalyticsLive.ts and the trend charts.
 */
export interface AnalyticsSnapshot {
  timestamp: string
  volume: number
  avgSpeedKmh: number
  congestionIndex: number
}

// ---------------------------------------------------------------------------
// Real Java analytics REST DTO shapes (read from actual Java record classes)
// ---------------------------------------------------------------------------

/** HeatmapCell — inner element of HeatmapResponse { cityId, cells: HeatmapCell[] } */
export interface HeatmapCell {
  lat: number
  lng: number
  count: number   // Java field is `count` (long), NOT `intensity`
}

/** HeatmapResponse — GET /api/v1/analytics/heatmap?cityId= */
export interface HeatmapResponse {
  cityId: string
  cells: HeatmapCell[]
}

/** OdPair — inner element of OdMatrixResponse { cityId, pairs: OdPair[] } */
export interface OdPair {
  fromCameraId: string
  toCameraId: string
  count: number
}

/** OdMatrixResponse — GET /api/v1/analytics/od-matrix?cityId= */
export interface OdMatrixResponse {
  cityId: string
  pairs: OdPair[]
}

/** CongestionZone — inner element of CongestionResponse */
export interface CongestionZone {
  gridCell: string
  density: number
  level: string   // e.g. "LOW" | "MEDIUM" | "HIGH" — Java uses String, not enum
}

/** CongestionResponse — GET /api/v1/analytics/congestion?cityId= */
export interface CongestionResponse {
  cityId: string
  zones: CongestionZone[]
}

/**
 * HeatmapPoint — kept for map component compatibility (DarkMap uses `intensity`).
 * Converted from HeatmapCell at the API boundary in java.ts.
 */
export interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
}

/**
 * ODFlowEntry — kept for the OD bar chart in AnalyticsPage.
 * Converted from OdPair at the API boundary in java.ts.
 */
export interface ODFlowEntry {
  origin: string
  destination: string
  count: number
}

export type SystemStatus = 'OPERATIONAL' | 'DEGRADED' | 'PARTIAL_OUTAGE' | 'MAINTENANCE'

export interface ConnectionState {
  status: 'CONNECTING' | 'OPEN' | 'CLOSED' | 'RECONNECTING'
}

export interface NodeInfo {
  userId: string
  cameraId: string
  nodeName: string
  username: string
  lat: number
  lng: number
  cityId: string
}

export interface ReviewItem {
  detectionId: number
  plateNumber: string
  confidence: number
  croppedImagePath: string | null
  timestamp: string
  cameraId: string | null
  cityId: string
}
