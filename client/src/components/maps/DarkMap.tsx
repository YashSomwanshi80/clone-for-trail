/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useMemo, Fragment } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap, Marker } from 'react-leaflet'
import type { Camera, TrajectoryPoint, HeatmapPoint } from '@/types'
import * as L from 'leaflet'
import 'leaflet.heat'

const TEAL = '#57C7B5'
const TEAL_BRIGHT = '#8EDBD0'
const BRASS = '#B79A62'
const CRIMSON = '#C95B63'
const MUTED = '#565C63'

// Standard OpenStreetMap raster tiles — genuinely free, no API key required.
// (CARTO's basemaps.cartocdn.com now requires a free API key and serves an
// "API KEY REQUIRED" watermark tile without one — not worth the extra signup
// step for a local demo. These are light by default; .map-tiles-dark in
// globals.css inverts + tints them to match the app's dark theme.)
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function FlyTo({ lat, lng, zoom = 14 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.6 })
  }, [lat, lng, zoom, map])
  return null
}

function makeArrowIcon(direction: number, color: string) {
  return L.divIcon({
    html: `<div style="transform: rotate(${direction}deg); width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="${color}">
        <path d="M12 2L22 20L12 16L2 20Z" />
      </svg>
    </div>`,
    className: '',
    iconSize: [16, 16] as any,
    iconAnchor: [8, 8] as any,
  })
}

export function CameraMap({
  cameras,
  center,
  selectedId,
  onSelect,
  height = 420,
}: {
  cameras: Camera[]
  center?: [number, number]
  selectedId?: string | null
  onSelect?: (camera: Camera) => void
  height?: number
}) {
  const mapCenter = useMemo<[number, number]>(() => {
    if (center) return center
    if (cameras.length === 0) return [17.385, 78.4867]
    return [
      cameras.reduce((s, c) => s + c.lat, 0) / cameras.length,
      cameras.reduce((s, c) => s + c.lng, 0) / cameras.length,
    ]
  }, [cameras, center])

  const selected = cameras.find((c) => c.id === selectedId)

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-border-soft">
      <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={true}>
        <TileLayer className="map-tiles-dark" attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        {cameras.map((cam) => {
          const isSelected = cam.id === selectedId
          const color = cam.status === 'ONLINE' ? (isSelected ? BRASS : TEAL) : cam.status === 'MAINTENANCE' ? '#C58A4A' : MUTED
          return (
            <CircleMarker
              key={cam.id}
              center={[cam.lat, cam.lng]}
              radius={isSelected ? 8 : 6}
              pathOptions={{
                color: isSelected ? BRASS : color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{ click: () => onSelect?.(cam) }}
            >
              <Popup>
                <div className="text-[12px]">
                  <p className="font-medium">{cam.name}</p>
                  <p className="text-text-tertiary">{cam.status} · {cam.detectionsToday} detections today</p>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
        {selected && <FlyTo lat={selected.lat} lng={selected.lng} />}
      </MapContainer>
    </div>
  )
}

export function TrajectoryMap({
  points,
  selectedIndex,
  height = 480,
}: {
  points: TrajectoryPoint[]
  selectedIndex?: number | null
  height?: number
}) {
  const positions = points.map((p) => [p.lat, p.lng]) as [number, number][]
  const center = positions[Math.floor(positions.length / 2)] ?? [17.385, 78.4867]
  const selected = selectedIndex != null ? points[selectedIndex] : null

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-border-soft">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer className="map-tiles-dark" attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <Polyline positions={positions} pathOptions={{ color: TEAL, weight: 3, opacity: 0.85 }} />
        {points.map((p, i) => {
          const isSelected = i === selectedIndex
          const color = p.isAnomaly ? CRIMSON : isSelected ? BRASS : TEAL_BRIGHT
          const key = `${p.cameraId}-${p.timestamp}`
          const arrowIcon = makeArrowIcon(p.direction, color)

          return (
            <Fragment key={key}>
              <CircleMarker
                center={[p.lat, p.lng]}
                radius={isSelected ? 9 : 6}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: isSelected ? 3 : 1.5 }}
              >
                <Popup>
                  <div className="text-[12px]">
                    <p className="font-medium">{p.cameraName}</p>
                    <p className="text-text-tertiary">{new Date(p.timestamp).toLocaleString()}</p>
                    <p className="text-text-tertiary">Confidence {(p.confidence * 100).toFixed(0)}%</p>
                    <p className="text-text-tertiary">Direction {p.direction}°</p>
                    {p.isAnomaly && <p className="text-critical">Anomaly flagged</p>}
                  </div>
                </Popup>
              </CircleMarker>
              <Marker position={[p.lat, p.lng]} icon={arrowIcon} interactive={false} />
            </Fragment>
          )
        })}
        {selected && <FlyTo lat={selected.lat} lng={selected.lng} zoom={14} />}
      </MapContainer>
    </div>
  )
}

/** Heatmap layer — renders inside a MapContainer, syncs with the Leaflet map instance */
function HeatLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) return

    const data: [number, number, number][] = points.map((p) => [p.lat, p.lng, p.intensity])
    const layer = L.heatLayer(data, {
      radius: 30,
      blur: 20,
      maxZoom: 15,
      max: 1.0,
      gradient: {
        0.2: '#1a1a2e',
        0.4: '#16213e',
        0.6: '#0f3460',
        0.8: BRASS,
        1.0: CRIMSON,
      },
    })
    layer.addTo(map)
    return () => {
      map.removeLayer(layer)
    }
  }, [points, map])

  return null
}

export function HeatmapMap({
  points,
  height = 360,
}: {
  points: HeatmapPoint[]
  height?: number
}) {
  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) return [17.385, 78.4867]
    return [
      points.reduce((s, p) => s + p.lat, 0) / points.length,
      points.reduce((s, p) => s + p.lng, 0) / points.length,
    ]
  }, [points])

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-border-soft">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer className="map-tiles-dark" attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <HeatLayer points={points} />
      </MapContainer>
    </div>
  )
}
