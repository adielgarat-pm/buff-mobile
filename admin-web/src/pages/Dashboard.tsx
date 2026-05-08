import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  const { session, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-2xl font-bold text-foreground">BUFF Admin</h1>
      <p className="text-muted-foreground">Welcome, {session?.user.email}</p>
      <Button variant="outline" onClick={signOut}>
        Sign Out
      </Button>
    </div>
  )
}
