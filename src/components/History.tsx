import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { HistoryItem } from '@/lib/types'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const ITEMS_PER_PAGE = 10

export function History() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const loadHistory = useCallback(async (page: number) => {
    try {
      const res = await fetch(
        `${API_BASE}/bot/history?page=${page}&per_page=${ITEMS_PER_PAGE}`
      )
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      // Bot offline — keep current state
    }
  }, [])

  useEffect(() => {
    loadHistory(currentPage)
  }, [currentPage, loadHistory])

  function goToPage(page: number) {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Playback History</h1>
        <p className="text-muted-foreground mt-1">View all previously played tracks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History ({total} tracks)</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[200px]">Played At</TableHead>
                    <TableHead className="w-[150px]">Server</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
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
                      <TableCell className="font-mono text-sm">
                        {new Date(item.playedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.guildId}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <CaretLeft size={16} weight="bold" className="mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <CaretRight size={16} weight="bold" className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No playback history yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
