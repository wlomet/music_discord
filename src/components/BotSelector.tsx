import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Radio, Headphones, Music } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { mockApi } from '@/lib/api'
import { BotInstance } from '@/lib/types'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

interface BotSelectorProps {
  onBotSelected: (botInstance: BotInstance) => void
  selectedBotId?: string
}

export function BotSelector({ onBotSelected, selectedBotId }: BotSelectorProps) {
  const [bots, setBots] = useState<BotInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBots = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const botsList = await mockApi.getConnectedBots()
      setBots(botsList)

      if (botsList.length === 0) {
        setError('No bots connected to voice channels. Use /join in Discord to connect a bot.')
      }
    } catch (err) {
      setError(`Failed to load bots: ${err instanceof Error ? err.message : 'Unknown error'}`)
      toast.error('Failed to load connected bots')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBots()
    // Refresh every 5 seconds to update bot status
    const interval = setInterval(loadBots, 5000)
    return () => clearInterval(interval)
  }, [loadBots])

  const handleBotSelect = async (bot: BotInstance) => {
    try {
      // Switch active guild on the backend
      const res = await fetch(`${API_BASE}/bot/guilds/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guild_id: bot.guildId }),
      })

      if (!res.ok) {
        toast.error('Failed to select bot')
        return
      }

      onBotSelected(bot)
      toast.success(`Connected to ${bot.guildName} → ${bot.voiceChannel?.name || 'Unknown'}`)
    } catch (err) {
      toast.error('Failed to select bot')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a Bot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading bots...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-orange-500/50">
        <CardHeader>
          <CardTitle>Select a Bot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-start">
            <AlertCircle className="text-orange-500 mt-1 flex-shrink-0" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadBots}
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Bots</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bots.map((bot) => (
            <div
              key={`${bot.botId}-${bot.guildId}`}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedBotId === `${bot.botId}-${bot.guildId}`
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
              onClick={() => handleBotSelect(bot)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio
                      size={16}
                      weight={selectedBotId === `${bot.botId}-${bot.guildId}` ? 'fill' : 'regular'}
                      className={selectedBotId === `${bot.botId}-${bot.guildId}` ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <span className="font-semibold">{bot.guildName}</span>
                  </div>

                  <div className="ml-6 space-y-1">
                    {bot.voiceChannel ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Headphones size={14} />
                          <span>{bot.voiceChannel.name}</span>
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {bot.voiceChannel.memberCount} member{bot.voiceChannel.memberCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {bot.isPlaying && (
                          <div className="flex items-center gap-2 text-sm text-accent">
                            <Music size={14} weight="fill" />
                            <span>Playing</span>
                          </div>
                        )}

                        {bot.queueSize > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {bot.queueSize} track{bot.queueSize !== 1 ? 's' : ''} in queue
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        Not connected to voice channel
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant={selectedBotId === `${bot.botId}-${bot.guildId}` ? 'default' : 'outline'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBotSelect(bot)
                  }}
                >
                  {selectedBotId === `${bot.botId}-${bot.guildId}` ? 'Active' : 'Select'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
