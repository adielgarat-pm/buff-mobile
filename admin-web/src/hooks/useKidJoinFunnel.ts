import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { callRpc } from '@/lib/api'

const AUTO_REFRESH_MS = 60_000

export interface KidJoinFunnelRow {
  cohort_week: string
  children: number
  joined_48h: number
  joined_ever: number
  joined_estimated: number
  week2_eligible: number
  week2_routine: number
  week4_eligible: number
  week4_active: number
}

/**
 * Kid-on-board cohort table — one row per child-signup week. Backed by the
 * admin_kid_join_funnel() SECURITY DEFINER RPC (migration 065, is_admin()
 * guarded). joined_at = the server-side kid_joined event, else the child's
 * auth-user creation time (estimate for children linked before 065).
 */
export function useKidJoinFunnel() {
  const { session } = useAuth()
  const [data, setData] = useState<KidJoinFunnelRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const firstLoad = useRef(true)

  const reload = useCallback(async () => {
    if (!session) return
    setError(null)
    try {
      const rows = await callRpc<KidJoinFunnelRow[]>(
        'admin_kid_join_funnel',
        session.access_token,
      )
      setData(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (firstLoad.current) {
        setLoading(false)
        firstLoad.current = false
      }
    }
  }, [session])

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

  return { data, error, loading, reload }
}
