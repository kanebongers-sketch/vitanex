// ─── AI Your Gym: het master account achter de sessie van nu (SERVER-ONLY) ──
// Voor de Platform-pagina en de route die een wachtwoord zet: alleen het
// account van de sessiecookie, nooit een id uit de browser.

import { cookies } from 'next/headers'
import { clubDatabase } from '@/lib/club/kern/database'
import { platformVanSessie } from './opslag'
import { platformCookie, type PlatformAccount } from './platform'

export async function huidigPlatformAccount(): Promise<PlatformAccount | null> {
  const token = (await cookies()).get(platformCookie())?.value
  return token ? platformVanSessie(clubDatabase(), token, new Date()) : null
}
