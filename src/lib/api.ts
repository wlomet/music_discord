import { BotStatus, CurrentTrack, QueueItem, Stats } from './types'

const API_BASE = 'http://localhost:8000'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options)
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const mockApi = {
  async getBotStatus(): Promise<BotStatus> {
    try {
      return await apiFetch<BotStatus>('/bot/status')
    } catch {
      // Bot server unreachable — return offline status so the dashboard degrades gracefully
      return { online: false, guilds: 0, voiceChannels: 0, uptime: '—', queueSize: 0 }
    }
  },

  async getCurrentTrack(): Promise<CurrentTrack | null> {
    try {
      return await apiFetch<CurrentTrack | null>('/bot/current-track')
    } catch {
      return null
    }
  },

  async play(url: string): Promise<void> {
    await apiFetch('/bot/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
  },

  async pause(): Promise<void> {
    await apiFetch('/bot/pause', { method: 'POST' })
  },

  async resume(): Promise<void> {
    await apiFetch('/bot/resume', { method: 'POST' })
  },

  async skip(): Promise<void> {
    await apiFetch('/bot/skip', { method: 'POST' })
  },

  async stop(): Promise<void> {
    await apiFetch('/bot/stop', { method: 'POST' })
  },

  async getQueue(): Promise<QueueItem[]> {
    return apiFetch<QueueItem[]>('/bot/queue')
  },

  async removeFromQueue(id: string): Promise<void> {
    await apiFetch(`/bot/queue/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async reorderQueue(_from: number, _to: number): Promise<void> {
    // Queue reordering is handled client-side; no server endpoint needed yet.
  },

  async getStats(): Promise<Stats> {
    return apiFetch<Stats>('/bot/stats')
  },
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function isValidYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
  return youtubeRegex.test(url)
}
