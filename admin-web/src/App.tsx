import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { AccessDenied } from '@/pages/AccessDenied'
import { RequireAdmin } from '@/components/RequireAdmin'

function RootRedirect() {
  const { session, isAdmin, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/dashboard" replace />
  return <Navigate to="/access-denied" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route
          path="/dashboard"
          element={
            <RequireAdmin>
              <Dashboard />
            </RequireAdmin>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
