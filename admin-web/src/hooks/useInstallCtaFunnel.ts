import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { callRpc } from '@/lib/api'

const AUTO_REFRESH_MS = 60_000

export interface InstallCtaFunnelRow {
  target: string
  placement: string
  impressions: number
  clicks: number
  dismisses: number
  opens: number
  last_seen: string | null
}

/**
 * Web-to-native install-CTA funnel — one row per (visitor target × placement)
 * with impression/click/dismiss/open counts. Backed by the
 * admin_install_cta_funnel() SECURITY DEFINER RPC (is_admin() guarded), fed by
 * the track-install-cta edge-function beacon. v1 is the engagement funnel; the
 * per-family install→activation join is a later refinement.
 */
export function useInstallCtaFunnel() {
  const { session } = useAuth()
  const [data, setData] = useState<InstallCtaFunnelRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const firstLoad = useRef(true)

  const reload = useCallback(async () => {
    if (!session) return
    setError(null)
    try {
      const rows = await callRpc<InstallCtaFunnelRow[]>(
        'admin_install_cta_funnel',
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
