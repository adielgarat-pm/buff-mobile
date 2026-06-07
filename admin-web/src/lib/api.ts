// RPC layer using raw fetch (not the supabase-js client).
//
// WHY raw fetch: supabase-js enters a lock-based deadlock when called right
// after the Magic Link session commit (same reason checkIsAdmin in lib/auth.ts
// uses fetch). We pass the access token in explicitly so we never touch the
// client's internal lock.

export async function callRpc<T>(
  fn: string,
  accessToken: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/${fn}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    throw new Error(`RPC ${fn} failed: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<T>
}
