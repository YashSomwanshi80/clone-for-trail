import { mockDelay, pythonMediaUrl, pythonPostForm, USE_MOCKS } from './http'
import { seedMedia, plateOptions } from '@/mocks/store'

export interface InferResponse {
  mediaId: string
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

// Sent directly to Python's host/port — never proxied through Java (A1 hard rule).
export const inferenceApi = {
  async inferImage(file: File, mediaId: string) {
    if (USE_MOCKS) return mockDelay(runMockInference(file, mediaId), 250)
    const form = new FormData()
    form.append('file', file)
    form.append('mediaId', mediaId)
    return pythonPostForm<InferResponse>('/infer/image', form)
  },
  async inferVideo(file: File, mediaId: string) {
    if (USE_MOCKS) return mockDelay(runMockInference(file, mediaId), 250)
    const form = new FormData()
    form.append('file', file)
    form.append('mediaId', mediaId)
    return pythonPostForm<InferResponse>('/infer/video', form)
  },
}

function runMockInference(file: File, mediaId: string): InferResponse {
  const job = seedMedia.find((m) => m.mediaId === mediaId)
  const looksUnreadable = /fail|corrupt|bad/i.test(file.name)
  setTimeout(() => {
    if (!job) return
    job.status = 'PROCESSING'
    setTimeout(() => {
      if (looksUnreadable) {
        job.status = 'FAILED'
        job.result = { plateNumber: '', confidence: 0, cropFilename: '', hasPriorSightings: false, errorMessage: 'Unreadable file — no frames could be decoded' }
        return
      }
      const noPlate = Math.random() < 0.12
      if (noPlate) {
        job.status = 'FAILED'
        job.result = { plateNumber: '', confidence: 0, cropFilename: '', hasPriorSightings: false, errorMessage: 'No plate detected in frame' }
        return
      }
      const plate = plateOptions[Math.floor(Math.random() * plateOptions.length)]
      job.status = 'COMPLETED'
      job.result = {
        plateNumber: plate,
        confidence: 0.81 + Math.random() * 0.18,
        cropFilename: `crop_${mediaId}.jpg`,
        hasPriorSightings: Math.random() < 0.55,
      }
    }, 1400 + Math.random() * 1200)
  }, 300)
  return { mediaId, status: 'PROCESSING' }
}

export function cropImageUrl(filename: string) {
  return pythonMediaUrl(filename)
}
