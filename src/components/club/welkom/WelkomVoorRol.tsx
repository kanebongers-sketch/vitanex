import type { ClubToegang } from '@/lib/club/toegang'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { uitlegCode, welkomRol, welkomSleutel } from '@/lib/club/rollen/welkom'
import { eigenProfielId } from '@/lib/club/profielfoto/toegang'
import { haalGezien } from '@/lib/club/uitleg/opslag'
import type { Rol } from '@/lib/club/rollen/typen'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { WELKOM } from '@/lib/aiyourgym/taal/woorden/club/welkom'
import { WelkomKaarten, type WelkomKaart } from './WelkomKaarten'

// De eerste-keer-uitleg per rol (opdracht Kane 30-10-2026). Staat op de
// startpagina's van de rollen (Vandaag, Cijfers, Groepslessen, Personeel);
// wie hem op een van die schermen wegklikt, ziet hem nergens meer.

/** Het scherm waar de uitleg nu staat; een knop naar dit scherm zelf valt weg. */
export type WelkomPagina = 'vandaag' | 'cijfers' | 'rooster' | 'personeel' | 'uren'

interface Doel {
  pagina: WelkomPagina | null
  pad: string
  extra?: Record<string, string>
  anker?: string
}

const VANDAAG: Doel = { pagina: 'vandaag', pad: '' }
const UREN: Doel = { pagina: 'uren', pad: '/personeel', extra: { tab: 'uren' } }

/** Waar de knoppen heen gaan, in de volgorde van de kaarten in WELKOM.rollen. */
function doelen(rol: Rol, persoonId: string | null): readonly Doel[] {
  const mijnLessen: Doel = { pagina: null, pad: '/rooster', extra: persoonId ? { instructeur: persoonId } : undefined }
  switch (rol) {
    case 'manager':
      return [VANDAAG, { pagina: null, pad: '/leden' }, { pagina: null, pad: '/beheer' }]
    case 'trainer':
      return [VANDAAG, { pagina: null, pad: '', anker: 'checkin' }, { pagina: null, pad: '/leden' }]
    case 'instructeur':
      return [mijnLessen, { pagina: 'rooster', pad: '/rooster' }, VANDAAG]
    case 'roosteraar':
      return [{ pagina: 'personeel', pad: '/personeel' }, { pagina: 'personeel', pad: '/personeel' }, { pagina: 'rooster', pad: '/rooster' }]
    case 'administratie':
      return [UREN, UREN, UREN]
    case 'eigenaar':
      return [{ pagina: 'cijfers', pad: '/cijfers' }, { pagina: null, pad: '/beheer', extra: { categorie: 'team' } }, { pagina: null, pad: '/beheer/abonnement' }]
  }
}

interface Props {
  t: ClubToegang
  vestiging: Vestiging
  pagina: WelkomPagina
}

export async function WelkomVoorRol({ t, vestiging, pagina }: Props) {
  const rol = welkomRol(t)
  if (!rol) return null
  const code = uitlegCode(rol)
  // Per account weggeklikt (migratie 476)? Dan nergens meer, op geen enkel apparaat.
  const profielId = await eigenProfielId(t)
  if (profielId && (await haalGezien(t.admin, t.userId, { soort: 'profiel', id: profielId })).includes(code)) return null
  const tekst = await clubTekst(WELKOM)
  const persoonId = t.profiel?.id ?? t.persoonId
  const paden = doelen(rol, persoonId)
  const kaarten: WelkomKaart[] = tekst.rollen[rol].map((k, i) => {
    const doel = paden[i]
    const href = !doel || doel.pagina === pagina ? null : `${clubPad(doel.pad, vestiging, doel.extra)}${doel.anker ? `#${doel.anker}` : ''}`
    return { ...k, href }
  })
  return <WelkomKaarten sleutel={welkomSleutel(t.organisatie.id, persoonId, rol)} kaarten={kaarten} opslaan={{ url: '/api/club/uitleg', code }} />
}
