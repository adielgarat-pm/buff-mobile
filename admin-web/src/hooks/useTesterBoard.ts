import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { callRpc } from '@/lib/api'
import type { TesterFamily } from '@/lib/types'

export function useTesterBoard() {
  const { session } = useAuth()
  const [data, setData] = useState<TesterFamily[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const families = await callRpc<TesterFamily[]>(
        'get_admin_tester_board',
        session.access_token,
      )
      setData(families)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, loading, reload }
}
