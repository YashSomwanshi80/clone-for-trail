import { javaDelete, javaGet, javaPost, javaPost_noAuth, javaPut, mockDelay, setAccessToken, USE_MOCKS, DEFAULT_CITY_ID, prefetchCsrf } from './http'
import type { Alert, AnalyticsSnapshot, BlacklistEntry, Camera, CameraHealth, CongestionResponse, HeatmapPoint, HeatmapResponse, MediaJob, ODFlowEntry, OdMatrixResponse, Trajectory } from '@/types'
import { alerts as seedAlerts, seedCameras, seedBlacklist, seedMedia, generateTrajectory, generateAnalyticsHistory, generateHeatmapData, odFlow as seedOdFlow } from '@/mocks/store'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
// /api/v1/auth/** — no JWT, no CSRF (both exempted in SecurityConfig).
export const authApi = {
  async login(username: string, password: string) {
    const res = await javaPost_noAuth<{ accessToken: string; refreshToken: string; tokenType: string }>(
      '/api/v1/auth/login',
      { username, password },
    )
    setAccessToken(res.accessToken)
    // Warm up the XSRF-TOKEN cookie immediately — see prefetchCsrf() in http.ts.
    void prefetchCsrf()
    return res
  },
  async refresh(refreshToken: string) {
    const res = await javaPost_noAuth<{ accessToken: string; refreshToken: string; tokenType: string }>(
      '/api/v1/auth/refresh',
      { refreshToken },
    )
    setAccessToken(res.accessToken)
    void prefetchCsrf()
    return res
  },
  async logout(refreshToken: string) {
    setAccessToken(null)
    return javaPost_noAuth<void>('/api/v1/auth/logout', { refreshToken })
  },
}

// ---------------------------------------------------------------------------
// Cameras
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Trajectory
// ---------------------------------------------------------------------------
// Java's TrajectoryController.getTrajectory() requires both `from` and `to`
// as mandatory @RequestParam Instant values — without them Spring returns 400.
// Previously the client called the endpoint with no params at all.
export const trajectoryApi = {
  async search(plateNumber: string, from?: string, to?: string) {
    if (USE_MOCKS) {
      if (!plateNumber.trim()) throw new Error('Enter a plate number to search')
      return mockDelay(generateTrajectory(plateNumber.toUpperCase()), 600)
    }
    const now = new Date().toISOString()
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const fromTs = from ?? dayAgo
    const toTs = to ?? now
    return javaGet<Trajectory>(
      `/api/v1/trajectories/${encodeURIComponent(plateNumber)}?from=${encodeURIComponent(fromTs)}&to=${encodeURIComponent(toTs)}`,
    )
  },
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Blacklist
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------
// BUG FIX: previous payload sent { fileName, fileType, cameraId, manualGeoTag }
// which does NOT match Java's MediaRegisterRequest record:
//   { sourceType, cameraId, mediaType, capturedAt, cityId }
// Fields renamed and mapped to their correct Java names.
// `cityId` defaults to "default" for the manual-upload portal flow.
export const mediaApi = {
  async create(payload: {
    fileType: 'IMAGE' | 'VIDEO'
    cameraId: string | null
    cityId?: string
  }) {
    if (USE_MOCKS) {
      const job: MediaJob = {
        mediaId: `MED-${Math.floor(1000 + Math.random() * 9000)}`,
        sourceType: 'MANUAL_UPLOAD',
        cameraId: payload.cameraId,
        manualGeoTag: null,
        fileName: '',
        fileType: payload.fileType,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }
      seedMedia.unshift(job)
      return mockDelay(job, 350)
    }
    return javaPost<MediaJob>('/api/v1/media', {
      // Java: @NotNull Media.SourceType sourceType
      sourceType: 'MANUAL_UPLOAD',
      // Java: String cameraId  (nullable)
      cameraId: payload.cameraId ?? null,
      // Java: @NotNull Media.MediaType mediaType
      mediaType: payload.fileType,    // 'IMAGE' | 'VIDEO' — enums match exactly
      // Java: @NotNull Instant capturedAt
      capturedAt: new Date().toISOString(),
      // Java: @NotNull String cityId
      cityId: payload.cityId ?? DEFAULT_CITY_ID,
    })
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
    // Java's MediaController.listManualUploads() ignores the sourceType param and
    // always returns MANUAL_UPLOAD records — the query param is accepted but unused.
    return javaGet<MediaJob[]>('/api/v1/media?sourceType=MANUAL_UPLOAD')
  },
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
// Every function fetches the real Java DTO, then maps it to the shape the
// UI/charts expect at the API boundary — no conversion scattered in components.
//
// Real Java endpoints + response types:
//   GET /api/v1/analytics/heatmap?cityId=   → HeatmapResponse { cityId, cells: {lat,lng,count}[] }
//   GET /api/v1/analytics/od-matrix?cityId= → OdMatrixResponse { cityId, pairs: {fromCameraId,toCameraId,count}[] }
//   GET /api/v1/analytics/congestion?cityId=→ CongestionResponse { cityId, zones: {gridCell,density,level}[] }
export const analyticsApi = {
  /**
   * Returns AnalyticsSnapshot[] for the trend charts.
   * Java has no time-series /history endpoint — congestion zones are used as a
   * proxy: each zone becomes one data point stamped with "now".
   * (The charts get live rolling data from the WebSocket; this REST call just
   *  seeds the initial window.)
   */
  async history(range = '6h', cityId = DEFAULT_CITY_ID): Promise<AnalyticsSnapshot[]> {
    if (USE_MOCKS) return mockDelay(generateAnalyticsHistory(range === '1h' ? 12 : range === '24h' ? 48 : range === '7d' ? 96 : 24))
    const res = await javaGet<CongestionResponse>(
      `/api/v1/analytics/congestion?cityId=${encodeURIComponent(cityId)}`,
    )
    // Map each congestion zone → one AnalyticsSnapshot data point
    const now = new Date().toISOString()
    return res.zones.map((z) => ({
      timestamp: now,
      volume: z.density,
      avgSpeedKmh: 0,       // not available from this endpoint
      congestionIndex: z.level === 'HIGH' ? 80 : z.level === 'MEDIUM' ? 50 : 20,
    }))
  },

  /** Returns ODFlowEntry[] for the origin–destination bar chart. */
  async odFlow(range = '6h', cityId = DEFAULT_CITY_ID): Promise<ODFlowEntry[]> {
    if (USE_MOCKS) {
      const zone = cityId
      const filtered = zone === 'all' ? seedOdFlow : seedOdFlow.filter((e) => e.origin === zone || e.destination === zone)
      return mockDelay(filtered)
    }
    const res = await javaGet<OdMatrixResponse>(
      `/api/v1/analytics/od-matrix?cityId=${encodeURIComponent(cityId)}`,
    )
    // Map Java's {fromCameraId, toCameraId, count} → UI's {origin, destination, count}
    return res.pairs.map((p) => ({
      origin: p.fromCameraId,
      destination: p.toCameraId,
      count: Number(p.count),
    }))
  },

  /** Returns HeatmapPoint[] for the map component (uses `intensity`, not `count`). */
  async heatmap(_range = '6h', cityId = DEFAULT_CITY_ID): Promise<HeatmapPoint[]> {
    if (USE_MOCKS) return mockDelay(generateHeatmapData())
    const res = await javaGet<HeatmapResponse>(
      `/api/v1/analytics/heatmap?cityId=${encodeURIComponent(cityId)}`,
    )
    // Map Java's `count` (long) → UI's `intensity` (number)
    return res.cells.map((c) => ({ lat: c.lat, lng: c.lng, intensity: Number(c.count) }))
  },
}
