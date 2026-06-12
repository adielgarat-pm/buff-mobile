import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { callRpc } from '@/lib/api'
import type { TesterFamily } from '@/lib/types'

const AUTO_REFRESH_MS = 60_000 // live monitoring: re-fetch every 60s

export function useTesterBoard() {
  const { session } = useAuth()
  const [data, setData] = useState<TesterFamily[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true) // full spinner only until first load
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const firstLoad = useRef(true)

  const reload = useCallback(async () => {
    if (!session) return
    setError(null)
    try {
      const families = await callRpc<TesterFamily[]>(
        'get_admin_tester_board',
        session.access_token,
      )
      setData(families) // subsequent loads swap data silently, no spinner
      setUpdatedAt(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (firstLoad.current) {
        setLoading(false)
        firstLoad.current = false
      }
    }
  }, [session])

  // Initial load + auto-refresh on an interval and whenever the tab regains focus
  // (so a kid completing a task shows up without a manual refresh).
  useEffect(() => {
    void reload()
    const id = setInterval(() => void reload(), AUTO_REFRESH_MS)
    const onFocus = () => void reload()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [reload])

  return { data, error, loading, reload, updatedAt }
}
