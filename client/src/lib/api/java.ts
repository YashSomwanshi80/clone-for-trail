import { javaDelete, javaGet, javaPost, javaPut, mockDelay, USE_MOCKS } from './http'
import type { Alert, AnalyticsSnapshot, BlacklistEntry, Camera, CameraHealth, HeatmapPoint, MediaJob, ODFlowEntry, Trajectory, User } from '@/types'
import { alerts as seedAlerts, seedCameras, seedBlacklist, seedUsers, seedMedia, generateTrajectory, generateAnalyticsHistory, generateHeatmapData, odFlow as seedOdFlow } from '@/mocks/store'

export const authApi = {
  async login(userId: string, password: string) {
    if (USE_MOCKS) {
      if (!userId || !password) throw new Error('User ID and password are required')
      const match = seedUsers.find((u) => u.userId === userId) ?? seedUsers[0]
      return mockDelay({
        accessToken: `mock-access-${Date.now()}`,
        refreshToken: `mock-refresh-${Date.now()}`,
        expiresAt: Date.now() + 15 * 60 * 1000,
        userId: match.userId,
      })
    }
    return javaPost<{ accessToken: string; refreshToken: string; expiresAt: number; userId: string }>(
      '/api/v1/auth/login',
      { userId, password },
      { auth: false }
    )
  },
  async refresh(refreshToken: string) {
    if (USE_MOCKS) {
      return mockDelay(
        {
          accessToken: `mock-access-${Date.now()}`,
          refreshToken,
          expiresAt: Date.now() + 15 * 60 * 1000,
          userId: 'ops.singh',
        },
        150
      )
    }
    return javaPost<{ accessToken: string; refreshToken: string; expiresAt: number; userId: string }>(
      '/api/v1/auth/refresh',
      { refreshToken },
      { auth: false }
    )
  },
  async logout() {
    if (USE_MOCKS) return mockDelay(undefined, 100)
    return javaPost<void>('/api/v1/auth/logout')
  },
}

export const camerasApi = {
  async list() {
    if (USE_MOCKS) return mockDelay(seedCameras)
    return javaGet<Camera[]>('/api/v1/cameras')
  },
  async health(id: string) {
    if (USE_MOCKS) {
      const cam = seedCameras.find((c) => c.id === id)
      const uptimePercent = cam?.status === 'ONLINE' ? 95 + Math.random() * 5 : cam?.status === 'MAINTENANCE' ? 60 + Math.random() * 20 : 0
      return mockDelay<CameraHealth>({
        id,
        status: cam?.status ?? 'OFFLINE',
        uptimePercent: parseFloat(uptimePercent.toFixed(1)),
        lastPing: new Date(Date.now() - (cam?.lastPingSeconds ?? 9999) * 1000).toISOString(),
        latencyMs: cam?.status === 'ONLINE' ? Math.round(10 + Math.random() * 40) : 0,
        detectionsToday: cam?.detectionsToday ?? 0,
      })
    }
    return javaGet<CameraHealth>(`/api/v1/cameras/${id}/health`)
  },
}

export const trajectoryApi = {
  async search(plateNumber: string) {
    if (USE_MOCKS) {
      if (!plateNumber.trim()) throw new Error('Enter a plate number to search')
      return mockDelay(generateTrajectory(plateNumber.toUpperCase()), 600)
    }
    return javaGet<Trajectory>(`/api/v1/trajectories/${encodeURIComponent(plateNumber)}`)
  },
}

export const alertsApi = {
  async list() {
    if (USE_MOCKS) return mockDelay(seedAlerts)
    return javaGet<Alert[]>('/api/v1/alerts')
  },
  async acknowledge(alertId: string) {
    if (USE_MOCKS) {
      const found = seedAlerts.find((a) => a.id === alertId)
      if (found) found.status = 'ACKNOWLEDGED'
      return mockDelay(found, 200)
    }
    return javaPut<Alert>(`/api/v1/alerts/${alertId}/acknowledge`)
  },
}

export const blacklistApi = {
  async list() {
    if (USE_MOCKS) return mockDelay(seedBlacklist)
    return javaGet<BlacklistEntry[]>('/api/v1/blacklist')
  },
  async create(entry: BlacklistEntry) {
    if (USE_MOCKS) {
      seedBlacklist.unshift(entry)
      return mockDelay(entry, 300)
    }
    return javaPost<BlacklistEntry>('/api/v1/blacklist', entry)
  },
  async remove(plateNumber: string) {
    if (USE_MOCKS) {
      const idx = seedBlacklist.findIndex((b) => b.plateNumber === plateNumber)
      if (idx >= 0) seedBlacklist.splice(idx, 1)
      return mockDelay(undefined, 250)
    }
    return javaDelete<void>(`/api/v1/blacklist/${encodeURIComponent(plateNumber)}`)
  },
}

export const mediaApi = {
  async create(payload: { fileName: string; fileType: 'IMAGE' | 'VIDEO'; cameraId: string | null; manualGeoTag: { lat: number; lng: number } | null }) {
    if (USE_MOCKS) {
      const job: MediaJob = {
        mediaId: `MED-${Math.floor(1000 + Math.random() * 9000)}`,
        sourceType: 'MANUAL_UPLOAD',
        cameraId: payload.cameraId,
        manualGeoTag: payload.manualGeoTag,
        fileName: payload.fileName,
        fileType: payload.fileType,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }
      seedMedia.unshift(job)
      return mockDelay(job, 350)
    }
    return javaPost<MediaJob>('/api/v1/media', payload)
  },
  async get(mediaId: string) {
    if (USE_MOCKS) {
      const job = seedMedia.find((m) => m.mediaId === mediaId)
      if (!job) throw new Error('Media job not found')
      return mockDelay(job, 150)
    }
    return javaGet<MediaJob>(`/api/v1/media/${mediaId}`)
  },
  async listUploads() {
    if (USE_MOCKS) return mockDelay(seedMedia.filter((m) => m.sourceType === 'MANUAL_UPLOAD'))
    return javaGet<MediaJob[]>('/api/v1/media?sourceType=MANUAL_UPLOAD')
  },
}

export const analyticsApi = {
  async history(range = '6h', zone = 'all') {
    if (USE_MOCKS) return mockDelay(generateAnalyticsHistory(range === '1h' ? 12 : range === '24h' ? 48 : range === '7d' ? 96 : 24))
    return javaGet<AnalyticsSnapshot[]>(`/api/v1/analytics/history?range=${range}&zone=${encodeURIComponent(zone)}`)
  },
  async odFlow(range = '6h', zone = 'all') {
    if (USE_MOCKS) {
      const filtered = zone === 'all' ? seedOdFlow : seedOdFlow.filter((e) => e.origin === zone || e.destination === zone)
      return mockDelay(filtered)
    }
    return javaGet<ODFlowEntry[]>(`/api/v1/analytics/od-flow?range=${range}&zone=${encodeURIComponent(zone)}`)
  },
  async heatmap(range = '6h') {
    if (USE_MOCKS) return mockDelay(generateHeatmapData())
    return javaGet<HeatmapPoint[]>(`/api/v1/analytics/heatmap?range=${range}`)
  },
}

