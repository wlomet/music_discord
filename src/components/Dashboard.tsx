import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, Users, Headphones, Queue as QueueIcon, Clock } from '@phosphor-icons/react'
import { mockApi, formatDuration } from '@/lib/api'
import { BotStatus, CurrentTrack } from '@/lib/types'

export function Dashboard() {
  const [status, setStatus] = useState<BotStatus | null>(null)
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const [statusData, trackData] = await Promise.all([
      mockApi.getBotStatus(),
      mockApi.getCurrentTrack()
    ])
    setStatus(statusData)
    setCurrentTrack(trackData)
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const progressPercentage = currentTrack 
    ? (currentTrack.elapsed / currentTrack.duration) * 100 
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time bot monitoring and control</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bot Status</CardTitle>
            {status.online ? (
              <CheckCircle className="text-success" size={20} weight="fill" />
            ) : (
              <XCircle className="text-destructive" size={20} weight="fill" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {status.online ? 'Online' : 'Offline'}
            </div>
            <Badge 
              variant={status.online ? 'default' : 'destructive'} 
              className="mt-2"
            >
              {status.online && <span className="inline-block w-2 h-2 bg-accent rounded-full mr-2 animate-pulse-glow" />}
              {status.online ? 'Active' : 'Disconnected'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servers</CardTitle>
            <Users size={20} weight="fill" className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{status.guilds}</div>
            <p className="text-xs text-muted-foreground mt-2">Discord guilds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice Channels</CardTitle>
            <Headphones size={20} weight="fill" className="text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{status.voiceChannels}</div>
            <p className="text-xs text-muted-foreground mt-2">Connected now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue</CardTitle>
            <QueueIcon size={20} weight="fill" className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{status.queueSize}</div>
            <p className="text-xs text-muted-foreground mt-2">Tracks waiting</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Now Playing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTrack ? (
              <>
                <div>
                  <h3 className="font-semibold text-lg">{currentTrack.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDuration(currentTrack.elapsed)} / {formatDuration(currentTrack.duration)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>{formatDuration(currentTrack.elapsed)}</span>
                    <span>-{formatDuration(currentTrack.duration - currentTrack.elapsed)}</span>
                  </div>
                </div>
                <Badge variant={currentTrack.isPlaying ? 'default' : 'secondary'}>
                  {currentTrack.isPlaying ? 'Playing' : 'Paused'}
                </Badge>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No track currently playing
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>System Info</CardTitle>
            <Clock size={20} weight="fill" className="text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-mono font-semibold">{status.uptime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Connections</span>
                <span className="font-mono font-semibold">{status.voiceChannels}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Servers</span>
                <span className="font-mono font-semibold">{status.guilds}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Queue Length</span>
                <span className="font-mono font-semibold">{status.queueSize} tracks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
