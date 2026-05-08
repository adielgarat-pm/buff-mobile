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

// userId: pass the user.id directly from the session already in hand.
// Do NOT call getSession() internally — when invoked from onAuthStateChange,
// the fresh session may not yet be in storage, causing getSession() to return
// null and the RPC to be skipped (zero network requests, isAdmin stays false).
export async function checkIsAdmin(userId?: string): Promise<boolean> {
  let uid = userId
  if (!uid) {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return false
    uid = sessionData.session.user.id
  }
  const { data, error } = await supabase.rpc('is_admin', { uid })
  if (error) {
    console.error('is_admin check failed:', error)
    return false
  }
  return data === true
}
