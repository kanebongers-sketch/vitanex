// ─── Club: wie mag in het instellingencentrum ───────────────────────────────
// Het instellingencentrum (/club/beheer) is open voor iedereen die minstens
// een instel-pagina mag zien (zie src/lib/club/kern/instel-paginas.ts); het toont
// dan alleen die pagina's. Elke instel-pagina controleert zelf nog haar eigen
// recht, zodat een clubmanager of medewerker nooit iets extra ziet.

import { notFound } from 'next/navigation'
import { betalenActief, lidgeldActief } from '@/lib/club/betalen/config'
import { heeftInstellingen, type InstelKijker } from '@/lib/club/kern/instel-paginas'
import { eisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { isEigenaar, isMedewerkerSessie } from '@/lib/club/rollen/wie'
import { rollenV2Aan } from '@/lib/club/rollen/schakelaar'

export function instelKijker(t: Pick<ClubToegang, 'organisatie' | 'onderdelen' | 'rol' | 'isPlatformEigenaar' | 'profiel'>): InstelKijker {
  return {
    uit: t.organisatie.uit,
    toegestaan: t.onderdelen,
    medewerker: isMedewerkerSessie(t),
    betalenAan: betalenActief(),
    lidgeldAan: lidgeldActief(),
    rollenV2: rollenV2Aan(t.organisatie.id),
    eigenaar: isEigenaar(t),
  }
}

/** Voor het instellingencentrum zelf: wie er niets mag instellen krijgt een gewone 404. */
export async function eisInstellingencentrum(): Promise<{ t: ClubToegang; kijker: InstelKijker }> {
  const t = await eisClubToegang()
  const kijker = instelKijker(t)
  if (!heeftInstellingen(kijker)) notFound()
  return { t, kijker }
}
