// ─── Club, nieuwe leden: wat de knoppen nodig hebben (SERVER-ONLY) ──────────
// Een plek voor de ledenlijst, Vandaag en de pagina met aanmeldlinks: de
// vormen die in deze vestiging te kiezen zijn, het adres van de sportschool
// voor de aanmeldlink, of de mail klaar is, en de paden naar ledenkaart en links.

import type { SupabaseClient } from '@supabase/supabase-js'
import { subdomeinenActief } from '@/lib/aiyourgym/schakelaar'
import { aygUrl, sportschoolUrl } from '@/lib/club/kern/subdomein'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import type { Organisatie } from '@/lib/club/kern/organisatie'
import { haalVormen } from '@/lib/club/lidmaatschappen/lezen'
import { aanmeldMailKlaar } from './mail'
import { vormenVoorVestiging } from './regels'

export interface KnoppenData {
  vestiging: string
  vormen: { id: string; naam: string }[]
  sportschool: string
  basis: string
  mailKlaar: boolean
  ledenkaart: string
  linksHref: string
}

/** Het adres waar de aanmeldlinks van deze sportschool naar wijzen (zonder slash aan het eind). */
export function sportschoolBasis(org: Pick<Organisatie, 'slug'>): string {
  return org.slug ? sportschoolUrl(org.slug, subdomeinenActief()) : aygUrl('/').replace(/\/$/, '')
}

export async function knoppenData(admin: SupabaseClient, org: Pick<Organisatie, 'id' | 'naam' | 'slug'>, vestiging: Vestiging): Promise<KnoppenData> {
  const vormen = (await haalVormen(admin, org.id)) ?? []
  return {
    vestiging,
    vormen: vormenVoorVestiging(vormen, vestiging).map((v) => ({ id: v.id, naam: v.naam })),
    sportschool: org.naam,
    basis: sportschoolBasis(org),
    mailKlaar: aanmeldMailKlaar(),
    ledenkaart: clubPad('/leden/__id__', vestiging),
    linksHref: clubPad('/leden/aanmeldlinks', vestiging),
  }
}
