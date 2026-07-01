import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockApi } from '@/lib/api'
import { Stats } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export function Statistics() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const data = await mockApi.getStats()
    setStats(data)
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading statistics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground mt-1">Bot usage analytics and insights</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Played Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topTracks}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.01 250)" />
                <XAxis 
                  dataKey="title" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: 'oklch(0.60 0 0)', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'oklch(0.60 0 0)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'oklch(0.22 0.02 250)', 
                    border: '1px solid oklch(0.30 0.01 250)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Bar dataKey="plays" fill="oklch(0.55 0.25 290)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Plays (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyPlays}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.01 250)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'oklch(0.60 0 0)', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fill: 'oklch(0.60 0 0)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'oklch(0.22 0.02 250)', 
                    border: '1px solid oklch(0.30 0.01 250)',
                    borderRadius: '0.5rem'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="count" stroke="oklch(0.75 0.15 200)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.01 250)" />
                <XAxis dataKey="day" tick={{ fill: 'oklch(0.60 0 0)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'oklch(0.60 0 0)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'oklch(0.22 0.02 250)', 
                    border: '1px solid oklch(0.30 0.01 250)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Bar dataKey="minutes" fill="oklch(0.75 0.15 200)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Listening Time</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            <div className="text-center space-y-2">
              <div className="text-6xl font-bold font-mono text-primary">
                {Math.floor(stats.totalListeningTime / 60)}
              </div>
              <div className="text-2xl text-muted-foreground">Hours</div>
              <div className="text-sm text-muted-foreground">
                ({stats.totalListeningTime.toLocaleString()} minutes total)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
