// ─── Club: bedrijfsgegevens lezen en bewaren (SERVER-ONLY) ──────────────────
// Altijd gefilterd op de sportschool die open staat (userId uit ClubToegang).

import type { SupabaseClient } from '@supabase/supabase-js'
import { BEDRIJF_KOLOMMEN, bedrijfUitRij, type Bedrijf } from './model'
import type { BedrijfInvoer } from './invoer'

export interface VestigingContact {
  sleutel: string
  naam: string
  adres: string | null
  telefoon: string | null
  email: string | null
}

/** De gegevens van deze sportschool; leeg als er nog niets is ingevuld, null bij een leesfout. */
export async function haalBedrijf(admin: SupabaseClient, userId: string): Promise<Bedrijf | null> {
  const { data, error } = await admin.from('club_bedrijfsgegevens').select(BEDRIJF_KOLOMMEN).eq('user_id', userId).maybeSingle()
  if (error) {
    console.error('[club] bedrijfsgegevens lezen mislukt', error.message)
    return null
  }
  return bedrijfUitRij(data)
}

/** Het adres, telefoon en e-mail per vestiging (de bron blijft club_vestigingen). */
export async function haalVestigingContact(admin: SupabaseClient, userId: string): Promise<VestigingContact[] | null> {
  const { data, error } = await admin
    .from('club_vestigingen')
    .select('vestiging, naam, adres, telefoon, email')
    .eq('user_id', userId)
    .order('volgorde')
    .order('naam')
  if (error) {
    console.error('[club] contact per vestiging lezen mislukt', error.message)
    return null
  }
  const tekst = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null)
  return (data ?? []).flatMap((r: Record<string, unknown>) =>
    typeof r.vestiging === 'string'
      ? [{ sleutel: r.vestiging, naam: tekst(r.naam) ?? r.vestiging, adres: tekst(r.adres), telefoon: tekst(r.telefoon), email: tekst(r.email) }]
      : [],
  )
}

/**
 * Bewaart een tabblad (gegevens of teksten); de andere kolommen blijven staan.
 * Wie zelf iets bewaart, maakt de rij echt (demo = false), zodat een
 * opruimactie voor demodata zijn eigen tekst nooit weghaalt.
 */
export async function bewaarBedrijf(admin: SupabaseClient, userId: string, invoer: BedrijfInvoer): Promise<boolean> {
  const velden = invoer.soort === 'gegevens' ? invoer.gegevens : invoer.teksten
  const { error } = await admin
    .from('club_bedrijfsgegevens')
    .upsert({ user_id: userId, ...velden, demo: false, bijgewerkt_op: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) console.error('[club] bedrijfsgegevens bewaren mislukt', error.message)
  return !error
}
