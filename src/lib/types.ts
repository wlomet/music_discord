export interface BotStatus {
  online: boolean
  guilds: number
  voiceChannels: number
  uptime: string
  queueSize: number
}

export interface Track {
  id: string
  title: string
  url: string
  duration: number
  addedAt?: Date
}

export interface CurrentTrack extends Track {
  elapsed: number
  isPlaying: boolean
}

export interface QueueItem {
  position: number
  track: Track
}

export interface HistoryItem {
  track: Track
  playedAt: Date
  guildId: string
}

export interface LogEntry {
  id: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: Date
}

export interface Stats {
  topTracks: { title: string; plays: number }[]
  dailyPlays: { date: string; count: number }[]
  totalListeningTime: number
  weeklyActivity: { day: string; minutes: number }[]
}

export interface Guild {
  id: string
  name: string
  memberCount: number
}

export interface VoiceChannel {
  id: string
  name: string
  memberCount: number
}

export interface BotInstance {
  botId: string
  botName: string
  guildId: string
  guildName: string
  voiceChannel?: VoiceChannel | null
  isPlaying: boolean
  queueSize: number
}
