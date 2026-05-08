import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export function AccessDenied() {
  const { session, signOut } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          This account is not authorized to access the admin dashboard.
        </p>
        {session && (
          <p className="text-xs text-muted-foreground">{session.user.email}</p>
        )}
        <Button variant="outline" onClick={signOut} className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  )
}
