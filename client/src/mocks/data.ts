import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  AnalyticsSnapshot,
  BlacklistEntry,
  Camera,
  MediaJob,
  ODFlowEntry,
  Trajectory,
  User,
} from '@/types'

// Centered on a fictional generic city grid (not a real place name is used elsewhere)
const CENTER = { lat: 17.385, lng: 78.4867 }

function jitter(base: number, spread: number) {
  return base + (Math.random() - 0.5) * spread
}

function id(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(3, '0')}`
}

const ZONES = ['North Ring', 'Central District', 'Riverside', 'Industrial Belt', 'East Corridor', 'Old Town']

export const cameras: Camera[] = Array.from({ length: 18 }).map((_, i) => {
  const statusRoll = Math.random()
  const status = statusRoll < 0.78 ? 'ONLINE' : statusRoll < 0.92 ? 'OFFLINE' : 'MAINTENANCE'
  return {
    id: id('CAM', i + 1),
    name: `${ZONES[i % ZONES.length]} · Checkpoint ${i + 1}`,
    zone: ZONES[i % ZONES.length],
    lat: jitter(CENTER.lat, 0.09),
    lng: jitter(CENTER.lng, 0.11),
    status,
    lastPingSeconds: status === 'ONLINE' ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 6000),
    detectionsToday: Math.floor(Math.random() * 1200) + 40,
  }
})

const PLATES = ['MH12AB1234', 'DL8CAF9081', 'KA05MN7723', 'TS09EZ4410', 'AP31X2091', 'GJ01QW5567']

export const blacklist: BlacklistEntry[] = [
  { plateNumber: 'TS09EZ4410', reason: 'Reported stolen — District 4', addedBy: 'insp.rao', addedAt: daysAgoIso(6) },
  { plateNumber: 'DL8CAF9081', reason: 'Outstanding warrant match', addedBy: 'insp.mehta', addedAt: daysAgoIso(2) },
  { plateNumber: 'GJ01QW5567', reason: 'Toll evasion — repeat offender', addedBy: 'ops.singh', addedAt: daysAgoIso(14) },
]

function daysAgoIso(d: number, hourJitter = true) {
  const t = new Date()
  t.setDate(t.getDate() - d)
  if (hourJitter) t.setHours(t.getHours() - Math.floor(Math.random() * 12))
  return t.toISOString()
}

function minutesAgoIso(m: number) {
  const t = new Date(Date.now() - m * 60000)
  return t.toISOString()
}

const ALERT_TYPES = ['Blacklist match', 'Speed anomaly', 'Wrong-direction travel', 'Duplicate plate detected', 'Loitering pattern']

export function generateAlerts(n = 24): Alert[] {
  const severities: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  return Array.from({ length: n }).map((_, i) => {
    const cam = cameras[i % cameras.length]
    const severity = severities[Math.floor(Math.random() * severities.length)]
    return {
      id: id('ALT', i + 1),
      severity,
      status: (Math.random() < 0.3 ? 'ACKNOWLEDGED' : 'OPEN') as AlertStatus,
      type: ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)],
      plateNumber: PLATES[Math.floor(Math.random() * PLATES.length)],
      cameraId: cam.id,
      cameraName: cam.name,
      timestamp: minutesAgoIso(Math.floor(Math.random() * 600)),
    }
  }).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
}

export function generateTrajectory(plateNumber: string): Trajectory {
  const stops = 4 + Math.floor(Math.random() * 5)
  const chosen = [...cameras].sort(() => Math.random() - 0.5).slice(0, stops)
  const start = Date.now() - stops * 18 * 60000
  const points = chosen.map((cam, i) => ({
    cameraId: cam.id,
    cameraName: cam.name,
    lat: cam.lat,
    lng: cam.lng,
    timestamp: new Date(start + i * 18 * 60000 + Math.random() * 5 * 60000).toISOString(),
    direction: Math.floor(Math.random() * 360),
    confidence: 0.82 + Math.random() * 0.17,
    isAnomaly: Math.random() < 0.12,
  }))
  return {
    plateNumber,
    points,
    totalCameras: points.length,
    totalDetections: points.length,
    distanceKm: Math.round((points.length * (1.8 + Math.random() * 2.4)) * 10) / 10,
    durationMinutes: Math.round((points.length * 18) + Math.random() * 20),
  }
}

export function generateAnalyticsHistory(nPoints = 24): AnalyticsSnapshot[] {
  const now = Date.now()
  return Array.from({ length: nPoints }).map((_, i) => {
    const t = new Date(now - (nPoints - i) * 5 * 60000)
    const hourFactor = 0.5 + Math.sin((t.getHours() / 24) * Math.PI * 2) * 0.3
    return {
      timestamp: t.toISOString(),
      volume: Math.round(120 + hourFactor * 280 + Math.random() * 40),
      avgSpeedKmh: Math.round(28 + (1 - hourFactor) * 30 + Math.random() * 6),
      congestionIndex: Math.round((hourFactor * 70 + Math.random() * 15) * 10) / 10,
    }
  })
}

export const odFlow: ODFlowEntry[] = [
  { origin: 'North Ring', destination: 'Central District', count: 842 },
  { origin: 'Central District', destination: 'Riverside', count: 611 },
  { origin: 'Industrial Belt', destination: 'Central District', count: 934 },
  { origin: 'East Corridor', destination: 'Old Town', count: 402 },
  { origin: 'Riverside', destination: 'East Corridor', count: 355 },
  { origin: 'Old Town', destination: 'North Ring', count: 268 },
]

export const users: User[] = [
  { id: 'U-1', userId: 'ops.singh', displayName: 'A. Singh', role: 'ADMIN', status: 'ACTIVE', lastActive: minutesAgoIso(4) },
  { id: 'U-2', userId: 'insp.rao', displayName: 'P. Rao', role: 'OPERATOR', status: 'ACTIVE', lastActive: minutesAgoIso(19) },
  { id: 'U-3', userId: 'insp.mehta', displayName: 'S. Mehta', role: 'OPERATOR', status: 'ACTIVE', lastActive: minutesAgoIso(63) },
  { id: 'U-4', userId: 'viewer.kumar', displayName: 'R. Kumar', role: 'VIEWER', status: 'ACTIVE', lastActive: minutesAgoIso(240) },
  { id: 'U-5', userId: 'contractor.lee', displayName: 'J. Lee', role: 'VIEWER', status: 'DISABLED', lastActive: daysAgoIso(30) },
]

export const mediaHistory: MediaJob[] = [
  {
    mediaId: 'MED-1042',
    sourceType: 'MANUAL_UPLOAD',
    cameraId: 'CAM-003',
    manualGeoTag: null,
    fileName: 'gate3_clip.mp4',
    fileType: 'VIDEO',
    status: 'COMPLETED',
    createdAt: daysAgoIso(0),
    result: { plateNumber: 'KA05MN7723', confidence: 0.94, cropFilename: 'crop_1042.jpg', hasPriorSightings: true },
  },
  {
    mediaId: 'MED-1041',
    sourceType: 'MANUAL_UPLOAD',
    cameraId: null,
    manualGeoTag: { lat: 17.402, lng: 78.471 },
    fileName: 'test_plate.jpg',
    fileType: 'IMAGE',
    status: 'COMPLETED',
    createdAt: daysAgoIso(1),
    result: { plateNumber: 'MH12AB1234', confidence: 0.89, cropFilename: 'crop_1041.jpg', hasPriorSightings: false },
  },
  {
    mediaId: 'MED-1039',
    sourceType: 'MANUAL_UPLOAD',
    cameraId: 'CAM-011',
    manualGeoTag: null,
    fileName: 'night_test.jpg',
    fileType: 'IMAGE',
    status: 'FAILED',
    createdAt: daysAgoIso(2),
    result: { plateNumber: '', confidence: 0, cropFilename: '', hasPriorSightings: false, errorMessage: 'No plate detected in frame' },
  },
]

export function generateHeatmapData(): import('@/types').HeatmapPoint[] {
  return cameras.flatMap((cam) => {
    const points: import('@/types').HeatmapPoint[] = []
    const n = 3 + Math.floor(Math.random() * 5)
    for (let i = 0; i < n; i++) {
      points.push({
        lat: jitter(cam.lat, 0.012),
        lng: jitter(cam.lng, 0.015),
        intensity: (cam.detectionsToday / 1200) * (0.4 + Math.random() * 0.6),
      })
    }
    return points
  })
}

export const plateOptions = PLATES
