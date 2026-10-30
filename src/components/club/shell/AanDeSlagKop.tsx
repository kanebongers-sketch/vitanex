import type { ClubToegang } from '@/lib/club/toegang'
import { isEigenaar, isLeiding } from '@/lib/club/rollen/wie'
import { instelHref, instelPagina, instelPaginaInTaal, zichtbareInstelPaginas, type InstelKijker } from '@/lib/club/kern/instel-paginas'
import { TE_DOEN_IDS, type TeDoenId } from '@/lib/club/kern/instel-te-doen'
import { nodigeStappen, startPad, stappenStand, toonStartKaart } from '@/lib/club/start/stappen'
import { haalStartFeiten, haalStartVoorPagina } from '@/lib/club/start/opslag'
import { haalBedrijf } from '@/lib/club/bedrijf/opslag'
import { aanDeSlagStand, aanDeSlagStappen } from '@/lib/club/menu/aan-de-slag'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { AanDeSlag } from './AanDeSlag'

// "Aan de slag" in de kop (server): leest de stand van de startwizard en van
// Nog te doen en geeft het compacte blok door, alleen voor eigenaar en
// clubmanager van een nieuwe sportschool zolang er iets open staat. Fit Factory
// (de eigen omgeving) en een demo krijgen het nooit. Laadt los in een Suspense,
// zodat de balk er nooit op wacht.

interface Props {
  t: ClubToegang
  kijker: InstelKijker
  taal: Taal
  persoon: string
}

/** Is een punt van Nog te doen klaar? null: niet te lezen (telt dan niet mee, zoals in het instellingencentrum). */
async function teDoenKlaar(t: ClubToegang, ids: readonly TeDoenId[]): Promise<Partial<Record<TeDoenId, boolean>>> {
  const bedrijf = ids.includes('bedrijf') ? await haalBedrijf(t.admin, t.userId) : null
  const org = t.organisatie
  const uit: Partial<Record<TeDoenId, boolean>> = {
    vestigingen: t.vestigingen.length > 0,
    huisstijl: Boolean(org.logo),
    adres: Boolean(org.slug),
  }
  if (bedrijf) uit.bedrijf = Boolean(bedrijf.gegevens.kvk)
  return uit
}

export async function AanDeSlagKop({ t, kijker, taal, persoon }: Props) {
  const org = t.organisatie
  if (!isLeiding(t) || org.demo || org.id === t.beheerderId) return null
  const gelezen = await haalStartVoorPagina(t)
  if (!gelezen.ok) return null
  const zichtbaar = zichtbareInstelPaginas(kijker)
  const ziet = (id: string) => zichtbaar.some((p) => p.id === id)
  const ids = TE_DOEN_IDS.filter((id) => ziet(id))
  const [feiten, klaar] = await Promise.all([haalStartFeiten(t), teDoenKlaar(t, ids)])
  const wizard = nodigeStappen(stappenStand(gelezen.voortgang, feiten, taal, org.afgenomen))
  const teDoen = ids.flatMap((id) => {
    const p = instelPagina(id)
    const k = klaar[id]
    return p && k !== undefined ? [{ id, klaar: k, titel: instelPaginaInTaal(p, taal).titel, href: instelHref(p, null) }] : []
  })
  const stand = aanDeSlagStand(aanDeSlagStappen({ wizard, wizardHref: ziet('start') ? (n) => startPad(n, null) : null, teDoen }))
  if (!stand) return null
  // Op Vandaag staat zolang de wizard loopt al de grote startkaart (alleen voor de eigenaar): dan niet dubbel.
  const kaartOpVandaag = isEigenaar(t) && toonStartKaart(gelezen.voortgang)
  return <AanDeSlag stand={stand} persoon={persoon} sportschool={org.id} nietOpVandaag={kaartOpVandaag} />
}
