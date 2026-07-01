import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Pause, Stop, SkipForward, Plus, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { mockApi, formatDuration, isValidYouTubeUrl } from '@/lib/api'
import { CurrentTrack, QueueItem } from '@/lib/types'

const API_BASE = 'http://localhost:8000'

type Guild = { id: string; name: string; memberCount: number }

export function MusicControl() {
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [newTrackUrl, setNewTrackUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [activeGuildId, setActiveGuildId] = useState<string | null>(null)

  const loadCurrentTrack = useCallback(async () => {
    const track = await mockApi.getCurrentTrack()
    setCurrentTrack(track)
  }, [])

  const loadQueue = useCallback(async () => {
    try {
      const items = await mockApi.getQueue()
      setQueue(items)
    } catch {
      // silently keep previous queue if request fails
    }
  }, [])

  const loadGuilds = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/bot/guilds`)
      if (!res.ok) return
      const data: Guild[] = await res.json()
      setGuilds(data)
      // Sync active guild from bot if we don't have one selected yet
      if (activeGuildId === null && data.length > 0) {
        setActiveGuildId(data[0].id)
      }
    } catch {
      // bot offline
    }
  }, [activeGuildId])

  async function handleGuildChange(guildId: string) {
    try {
      const res = await fetch(`${API_BASE}/bot/guilds/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guild_id: guildId }),
      })
      if (res.ok) {
        setActiveGuildId(guildId)
        await loadQueue()
        toast.success(`Switched to ${guilds.find(g => g.id === guildId)?.name ?? guildId}`)
      }
    } catch {
      toast.error('Could not switch server')
    }
  }

  useEffect(() => {
    loadGuilds()
    loadCurrentTrack()
    loadQueue()
    const interval = setInterval(() => {
      loadCurrentTrack()
      loadQueue()
    }, 3000)
    return () => clearInterval(interval)
  }, [loadCurrentTrack, loadQueue, loadGuilds])

  async function handlePlay() {
    setIsLoading(true)
    try {
      await mockApi.resume()
      toast.success('Playback resumed')
      await loadCurrentTrack()
    } catch (error) {
      toast.error('Failed to resume playback')
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePause() {
    setIsLoading(true)
    try {
      await mockApi.pause()
      toast.success('Playback paused')
      await loadCurrentTrack()
    } catch (error) {
      toast.error('Failed to pause playback')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStop() {
    setIsLoading(true)
    try {
      await mockApi.stop()
      toast.success('Playback stopped')
      setCurrentTrack(null)
    } catch (error) {
      toast.error('Failed to stop playback')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSkip() {
    setIsLoading(true)
    try {
      await mockApi.skip()
      toast.success('Track skipped')
      await loadCurrentTrack()
    } catch (error) {
      toast.error('Failed to skip track')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddTrack() {
    if (!newTrackUrl.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }

    if (!isValidYouTubeUrl(newTrackUrl)) {
      toast.error('Invalid YouTube URL')
      return
    }

    setIsLoading(true)
    try {
      await mockApi.play(newTrackUrl)
      setNewTrackUrl('')
      toast.success('Track added to queue')
      await loadQueue()
    } catch (error) {
      toast.error('Failed to add track — is the bot running?')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemoveTrack(id: string) {
    try {
      await mockApi.removeFromQueue(id)
      toast.success('Track removed from queue')
      await loadQueue()
    } catch {
      toast.error('Failed to remove track')
    }
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    setQueue((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function handleMoveDown(index: number) {
    if (index === queue.length - 1) return
    setQueue((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  const progressPercentage = currentTrack 
    ? (currentTrack.elapsed / currentTrack.duration) * 100 
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Music Control</h1>
        <p className="text-muted-foreground mt-1">Manage playback and queue</p>
      </div>

      {/* Server selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <Label className="shrink-0 text-sm font-medium">Discord Server</Label>
            {guilds.length > 0 ? (
              <Select
                value={activeGuildId ?? ''}
                onValueChange={handleGuildChange}
              >
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select a server…" />
                </SelectTrigger>
                <SelectContent>
                  {guilds.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({g.memberCount} members)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-muted-foreground">
                Bot offline or not in any server
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Track</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTrack ? (
              <>
                <div>
                  <h3 className="font-semibold text-lg">{currentTrack.title}</h3>
                  <a 
                    href={currentTrack.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline"
                  >
                    View on YouTube
                  </a>
                </div>

                <div className="space-y-2">
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>{formatDuration(currentTrack.elapsed)}</span>
                    <span>{formatDuration(currentTrack.duration)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {currentTrack.isPlaying ? (
                    <Button onClick={handlePause} disabled={isLoading}>
                      <Pause className="mr-2" size={18} weight="fill" />
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={handlePlay} disabled={isLoading}>
                      <Play className="mr-2" size={18} weight="fill" />
                      Play
                    </Button>
                  )}
                  <Button onClick={handleSkip} variant="secondary" disabled={isLoading}>
                    <SkipForward className="mr-2" size={18} weight="fill" />
                    Skip
                  </Button>
                  <Button onClick={handleStop} variant="destructive" disabled={isLoading}>
                    <Stop className="mr-2" size={18} weight="fill" />
                    Stop
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No track currently playing
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="track-url">YouTube URL</Label>
                <Input
                  id="track-url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={newTrackUrl}
                  onChange={(e) => setNewTrackUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTrack()}
                />
              </div>
              <Button 
                onClick={handleAddTrack} 
                disabled={isLoading || !newTrackUrl.trim()}
                className="w-full"
              >
                <Plus className="mr-2" size={18} weight="bold" />
                Add to Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue ({queue.length} tracks)</CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Pos</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[100px]">Duration</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item, index) => (
                  <TableRow key={item.track.id}>
                    <TableCell className="font-mono font-semibold">{item.position}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.track.title}</div>
                        <a
                          href={item.track.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          {item.track.url}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatDuration(item.track.duration)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp size={16} weight="bold" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === queue.length - 1}
                        >
                          <ArrowDown size={16} weight="bold" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveTrack(item.track.id)}
                        >
                          <Trash size={16} weight="bold" className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Queue is empty. Add tracks above to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
