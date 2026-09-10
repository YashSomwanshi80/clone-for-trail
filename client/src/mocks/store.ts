import {
  cameras,
  blacklist,
  users,
  mediaHistory,
  generateAlerts,
  generateTrajectory,
  generateAnalyticsHistory,
  generateHeatmapData,
  odFlow,
  plateOptions,
} from './data'

export const seedCameras = cameras
export const seedBlacklist = blacklist
export const seedUsers = users
export const seedMedia = mediaHistory
export const alerts = generateAlerts(28)
export { generateTrajectory, generateAnalyticsHistory, generateHeatmapData, odFlow, plateOptions }
