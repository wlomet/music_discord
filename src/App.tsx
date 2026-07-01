import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { MusicControl } from './components/MusicControl'
import { History } from './components/History'
import { Statistics } from './components/Statistics'
import { Logs } from './components/Logs'
import { SquaresFour, MusicNotes, ClockCounterClockwise, ChartBar, Terminal } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'

type Page = 'dashboard' | 'music' | 'history' | 'stats' | 'logs'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const menuItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: SquaresFour },
    { id: 'music' as Page, label: 'Music', icon: MusicNotes },
    { id: 'history' as Page, label: 'History', icon: ClockCounterClockwise },
    { id: 'stats' as Page, label: 'Statistics', icon: ChartBar },
    { id: 'logs' as Page, label: 'Logs', icon: Terminal }
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'music':
        return <MusicControl />
      case 'history':
        return <History />
      case 'stats':
        return <Statistics />
      case 'logs':
        return <Logs />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r border-border bg-card flex-shrink-0">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">Discord Bot</h1>
          <p className="text-sm text-muted-foreground mt-1">Music Dashboard</p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      currentPage === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon size={20} weight={currentPage === item.id ? 'fill' : 'regular'} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>

      <Toaster position="bottom-right" />
    </div>
  )
}

export default App
