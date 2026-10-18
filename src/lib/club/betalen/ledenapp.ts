// ─── Club, betalen: wat de ledenapp nodig heeft (SERVER-ONLY) ───────────────
// Alleen met CLUB_BETALEN_ACTIEF aan en betalen aan bij de sportschool;
// anders null en toont de app niets van kopen.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lid } from '@/lib/club/kern/lid'
import { betalenActief, clubStripeSleutel } from './config'
import { haalBetaalAccount, haalProducten, haalTegoeden, kanAfrekenen } from './opslag'
import { bruikbaarSaldo, productVoorVestiging, tegoedBruikbaar } from './regels'
import type { Product, Tegoed } from './model'

export interface KopenData {
  /** Kan het lid nu echt afrekenen (Stripe klaar)? */
  open: boolean
  producten: Product[]
  /** Bruikbare tegoeden van het lid in de eigen vestiging. */
  tegoeden: Tegoed[]
  strippen: number
  ptSessies: number
}

/** null = betalen staat uit voor deze sportschool; 'fout' = leesfout. */
export async function haalKopenVoorLid(admin: SupabaseClient, userId: string, lid: Lid, nu: Date): Promise<KopenData | null | 'fout'> {
  if (!betalenActief()) return null
  const account = await haalBetaalAccount(admin, userId)
  if (!account) return 'fout'
  if (!account.betalenAan) return null
  const [producten, tegoeden] = await Promise.all([haalProducten(admin, userId, true), haalTegoeden(admin, userId, lid.id)])
  if (!producten || !tegoeden) return 'fout'
  return {
    open: clubStripeSleutel() !== null && kanAfrekenen(account),
    producten: producten.filter((p) => productVoorVestiging(p, lid.vestiging)),
    tegoeden: tegoeden.filter((t) => tegoedBruikbaar(t, lid.vestiging, nu)),
    strippen: bruikbaarSaldo(tegoeden, 'les', lid.vestiging, nu),
    ptSessies: bruikbaarSaldo(tegoeden, 'pt', lid.vestiging, nu),
  }
}
