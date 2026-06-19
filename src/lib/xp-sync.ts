import { supabase } from '@/lib/supabase'
import { type XPData, laadXPData, slaXPOp } from '@/lib/xp'

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? `Bearer ${session.access_token}` : null
}

export async function laadXPVanServer(): Promise<XPData | null> {
  try {
    const token = await getToken()
    if (!token) return null

    const res = await fetch('/api/xp', {
      headers: { Authorization: token },
      cache: 'no-store',
    })
    if (!res.ok) return null

    const serverData: XPData | null = await res.json()
    if (!serverData) return null

    // Neem de hoogste XP (beschermt tegen regressie als localStorage voorloopt)
    const lokaal = laadXPData()
    if (serverData.xp >= lokaal.xp) {
      slaXPOp({ ...lokaal, ...serverData })
    }

    return serverData
  } catch {
    return null
  }
}

export async function syncXPNaarServer(data: XPData): Promise<void> {
  try {
    const token = await getToken()
    if (!token) return

    await fetch('/api/xp', {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  } catch { /* stil falen — localStorage is source of truth */ }
}
