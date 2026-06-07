import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { TesterBoard } from '@/components/TesterBoard'

export function Dashboard() {
  const { session, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">BUFF Admin</h1>
            <p className="text-xs text-muted-foreground">Tester Board</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session?.user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <TesterBoard />
      </main>
    </div>
  )
}
