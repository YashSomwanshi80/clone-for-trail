export interface User {
  id: string
  userId: string
  displayName: string
  status: 'ACTIVE' | 'DISABLED'
  lastActive: string
}

export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'

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
export type MediaSourceType = 'CAMERA_FEED' | 'MANUAL_UPLOAD'

export interface MediaJob {
  mediaId: string
  sourceType: MediaSourceType
  cameraId: string | null
  manualGeoTag: { lat: number; lng: number } | null
  fileName: string
  fileType: 'IMAGE' | 'VIDEO'
  status: MediaStatus
  createdAt: string
  result?: {
    plateNumber: string
    confidence: number
    cropFilename: string
    hasPriorSightings: boolean
    errorMessage?: string
  }
}

export interface AnalyticsSnapshot {
  timestamp: string
  volume: number
  avgSpeedKmh: number
  congestionIndex: number
}

export interface ODFlowEntry {
  origin: string
  destination: string
  count: number
}

export interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
}

export type SystemStatus = 'OPERATIONAL' | 'DEGRADED' | 'PARTIAL_OUTAGE' | 'MAINTENANCE'

export interface ConnectionState {
  status: 'CONNECTING' | 'OPEN' | 'CLOSED' | 'RECONNECTING'
}
