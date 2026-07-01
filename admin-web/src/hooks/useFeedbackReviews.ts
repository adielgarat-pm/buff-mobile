import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchRows } from '@/lib/api'

const AUTO_REFRESH_MS = 60_000

export interface AdminReview {
  id: string
  display_name: string | null
  rating: number
  review_text: string | null
  status: string
  detected_lang: string | null
  created_at: string
  /** Parent's family — links a feedback row to the Tester Board family card. */
  family_id: string | null
}

const SELECT =
  'reviews?select=id,display_name,rating,review_text,status,detected_lang,created_at,family_id&order=created_at.desc'

/**
 * All reviews submitted from the app (pkg/rate-us-port). Admins see every row
 * via the has_role('admin') SELECT policy — including the low-rating 'private'
 * feedback that never appears publicly. This is the "input reaches Adi" surface.
 */
export function useFeedbackReviews() {
  const { session } = useAuth()
  const [data, setData] = useState<AdminReview[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const firstLoad = useRef(true)

  const reload = useCallback(async () => {
    if (!session) return
    setError(null)
    try {
      const rows = await fetchRows<AdminReview[]>(SELECT, session.access_token)
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
