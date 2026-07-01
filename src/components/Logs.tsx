import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { LogEntry } from '@/lib/types'
import { Info, Warning, XCircle, CheckCircle } from '@phosphor-icons/react'

const WS_URL = 'ws://localhost:8000/ws/logs'
const PING_INTERVAL_MS = 20_000
const RECONNECT_DELAY_MS = 3_000
const MAX_LOGS = 100

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        // Keep-alive pings so the server doesn't close an idle connection
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping')
        }, PING_INTERVAL_MS)
      }

      ws.onmessage = (event) => {
        try {
          const entry = JSON.parse(event.data) as {
            id: string
            level: LogEntry['level']
            message: string
            timestamp: number | string
          }
          const log: LogEntry = {
            id: entry.id,
            level: entry.level,
            message: entry.message,
            // timestamp may be a Unix float (Python time.time()) or ISO string
            timestamp:
              typeof entry.timestamp === 'number'
                ? new Date(entry.timestamp * 1000)
                : new Date(entry.timestamp),
          }
          setLogs((prev) => [log, ...prev].slice(0, MAX_LOGS))
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (pingRef.current) clearInterval(pingRef.current)
        // Auto-reconnect after a short delay
        retryRef.current = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      if (pingRef.current) clearInterval(pingRef.current)
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [])

  function getLogIcon(level: LogEntry['level']) {
    switch (level) {
      case 'info':
        return <Info size={16} weight="fill" className="text-accent" />
      case 'success':
        return <CheckCircle size={16} weight="fill" className="text-success" />
      case 'warning':
        return <Warning size={16} weight="fill" className="text-yellow-500" />
      case 'error':
        return <XCircle size={16} weight="fill" className="text-destructive" />
    }
  }

  function getLogBadgeVariant(level: LogEntry['level']): 'default' | 'destructive' | 'secondary' {
    switch (level) {
      case 'error':
        return 'destructive'
      case 'warning':
      case 'info':
        return 'secondary'
      case 'success':
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground mt-1">Real-time bot activity and events</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Live Logs</span>
            <Badge
              variant={connected ? 'default' : 'secondary'}
              className={connected ? 'animate-pulse-glow' : ''}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  connected ? 'bg-accent' : 'bg-muted-foreground'
                }`}
              />
              {connected ? 'Live' : 'Connecting…'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full rounded-md border border-border p-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="mt-1">{getLogIcon(log.level)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getLogBadgeVariant(log.level)} className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm">{log.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
