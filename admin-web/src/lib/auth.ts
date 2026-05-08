import { supabase } from './supabase'

export async function signInWithMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin + '/dashboard',
    },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function checkIsAdmin(userId?: string, accessToken?: string): Promise<boolean> {
  // If userId/token not provided, try to get them from supabase
  // (this only works when client isn't locked)
  let uid = userId
  let token = accessToken
  if (!uid || !token) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      uid = uid ?? sessionData.session?.user?.id
      token = token ?? sessionData.session?.access_token
    } catch (e) {
      console.error('checkIsAdmin: getSession failed', e)
    }
  }
  if (!uid || !token) return false

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/is_admin`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uid }),
    })
    if (!response.ok) {
      console.error('is_admin check failed:', response.status, await response.text())
      return false
    }
    const data = await response.json()
    return data === true
  } catch (err) {
    console.error('is_admin check error:', err)
    return false
  }
}
