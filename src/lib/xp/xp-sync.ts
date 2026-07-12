import { supabase } from '@/lib/supabase/supabase'
import { type XPData, laadXPData, slaXPOp } from '@/lib/xp/xp'

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

    const lokaal = laadXPData()

    // Server is de duurzame bron van waarheid. Maar omdat XP op sommige plekken
    // lokaal verdiend werd zonder direct te syncen, kan localStorage vóórlopen.
    // We reconciliëren verliesvrij op basis van de hoogste XP:
    //  • server ≥ lokaal  → adopteer de server (cross-device correct)
    //  • lokaal  > server  → haal de server bij (push), zodat voortgang nooit
    //                        alleen in de browser blijft hangen.
    if (serverData && serverData.xp >= lokaal.xp) {
      slaXPOp({ ...lokaal, ...serverData })
      return serverData
    }

    // Lokaal loopt voor (of server is leeg): persisteer lokaal naar de server.
    await syncXPNaarServer(lokaal)
    return lokaal
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
