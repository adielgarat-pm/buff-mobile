import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { callRpc } from '@/lib/api'

const AUTO_REFRESH_MS = 60_000

export interface ReferralFunnelRow {
  code: string
  status: 'pending' | 'completed'
  created_at: string
  completed_at: string | null
  referrer_family: string | null
  referred_family: string | null
  clicks: number
}

/**
 * Referral funnel — one row per code: who shared it, how many clicks it got
 * (buffadhd.com/join?ref=CODE hits, logged by the track-referral-click edge
 * function), and whether a family redeemed it. Backed by the
 * admin_referral_funnel() SECURITY DEFINER RPC (is_admin() guarded).
 */
export function useReferralFunnel() {
  const { session } = useAuth()
  const [data, setData] = useState<ReferralFunnelRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const firstLoad = useRef(true)

  const reload = useCallback(async () => {
    if (!session) return
    setError(null)
    try {
      const rows = await callRpc<ReferralFunnelRow[]>(
        'admin_referral_funnel',
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
