import type { Metadata } from 'next'
import type { ClubToegang } from '@/lib/club/toegang'
import { eisInstellingencentrum } from '@/lib/club/instel-toegang'
import { adresVan } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { checkinMethodeLabel } from '@/lib/club/kern/org-instellingen'
import {
  instelGroepLabel,
  instelGroepUitleg,
  instelHref,
  instelIndeling,
  instelPagina,
  instelPaginaInTaal,
  zichtbareInstelPaginas,
  type InstelKijker,
  type InstelPagina,
} from '@/lib/club/kern/instel-paginas'
import { TE_DOEN_IDS, teDoenOverzicht, type TeDoenId } from '@/lib/club/kern/instel-te-doen'
import { telKiesbareOefeningen } from '@/lib/club/training/blender-bibliotheek'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { haalBedrijf } from '@/lib/club/bedrijf/opslag'
import { haalRegels } from '@/lib/club/automatisering/opslag'
import { haalBeheerders } from '@/lib/club/beheerders/beheerder-opslag'
import { haalStart } from '@/lib/club/start/opslag'
import { AANTAL_STAPPEN } from '@/lib/club/start/stappen'
import { CentrumKop } from '@/components/club/instelcentrum/CentrumKop'
import { NogTeDoen } from '@/components/club/instelcentrum/NogTeDoen'
import { InstelCentrum } from '@/components/club/instelcentrum/InstelCentrum'
import type { CentrumCategorie, CentrumRegel, CentrumStart } from '@/components/club/instelcentrum/typen'
import '@/components/club/beheer/beheer.css'
import '@/components/club/instelcentrum/instelcentrum.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: BEHEER[await getTaal()].algemeen.instellingen }
}

// Het instellingencentrum (besluit Kane 29-10-2026: rustiger). Bovenaan de
// sportschool en een zoekveld, alleen als er echt iets openstaat "Nog te doen",
// daaronder acht categorieen (src/lib/club/kern/instel-paginas.ts). Per regel
// een stand alleen als die iets zegt: een aantal, of "Nog doen". Iedereen ziet
// alleen wat hij mag en wat aan staat; de stand wordt alleen gelezen voor die regels.

/** Het aantal rijen van deze sportschool in een tabel; null bij een fout (gelogd). */
async function tel(t: ClubToegang, tabel: string): Promise<number | null> {
  const { count, error } = await t.admin.from(tabel).select('id', { count: 'exact', head: true }).eq('user_id', t.userId)
  if (error) console.error(`[club] tellen ${tabel} mislukt`, error.message)
  return error ? null : count
}

/** Kiesbare oefeningen: de Blender-oefeningen plus de eigen, zonder archief (zelfde regel als de bibliotheek). */
async function telOefeningen(t: ClubToegang): Promise<number | null> {
  const { data, error } = await t.admin.from('club_oefeningen').select('naam, actief, gearchiveerd').eq('user_id', t.userId)
  if (error) console.error('[club] oefeningen tellen mislukt', error.message)
  return error ? null : telKiesbareOefeningen(data ?? [])
}

/** Alleen lezen wat deze persoon ziet. */
function als<T>(mag: boolean, laad: () => Promise<T>): Promise<T | null> {
  return mag ? laad() : Promise.resolve(null)
}

interface Stand {
  stand: string | null
  let?: boolean
  /** Kon niet gelezen worden: telt niet mee in Nog te doen. */
  onbekend?: boolean
}

/** De stand per instel-pagina: alleen waar die iets zegt. */
async function standen(t: ClubToegang, ziet: (id: string) => boolean, taal: Taal): Promise<Record<string, Stand>> {
  const org = t.organisatie
  const s = BEHEER[taal].stand
  const tal = (n: number | null, tekst: (n: number) => string): Stand => ({ stand: n === null ? s.onbekend : tekst(n) })
  const nogDoen = (klaar: boolean): Stand => (klaar ? { stand: null } : { stand: s.nogDoen, let: true })
  const [medewerkers, leden, oefeningen, lestypen, zalen, vormen, bedrijf, regels, beheerders] = await Promise.all([
    als(ziet('medewerkers'), () => tel(t, 'club_medewerkers')),
    als(ziet('importeren'), () => tel(t, 'club_leden')),
    als(ziet('oefeningen'), () => telOefeningen(t)),
    als(ziet('lestypen'), () => tel(t, 'club_lestypen')),
    als(ziet('zalen'), () => tel(t, 'club_zalen')),
    als(ziet('lidmaatschappen'), () => tel(t, 'club_lidmaatschapsvormen')),
    als(ziet('bedrijf'), () => haalBedrijf(t.admin, t.userId)),
    als(ziet('opvolgregels'), () => haalRegels(t.admin, t.userId)),
    als(ziet('beheerders'), () => haalBeheerders(t.admin, t.userId)),
  ])
  return {
    huisstijl: nogDoen(Boolean(org.logo)),
    adres: nogDoen(Boolean(org.slug)),
    bedrijf: bedrijf === null ? { stand: null, onbekend: true } : nogDoen(Boolean(bedrijf.gegevens.kvk)),
    vestigingen: t.vestigingen.length === 0 ? { stand: s.nogDoen, let: true } : tal(t.vestigingen.length, s.vestigingen),
    zalen: tal(zalen, s.zalen),
    medewerkers: tal(medewerkers, s.medewerkers),
    beheerders: beheerders ? tal(beheerders.length, s.beheerders) : { stand: null },
    lestypen: tal(lestypen, s.lestypen),
    oefeningen: tal(oefeningen, s.oefeningen),
    lidmaatschappen: tal(vormen, s.vormen),
    importeren: tal(leden, s.leden),
    checkin: { stand: checkinMethodeLabel(org.instellingen.checkin.methode, taal, true) },
    opvolgregels: { stand: regels ? s.aanVan(regels.filter((r) => r.aan).length, regels.length) : null },
  }
}

/** De startwizard als losse link, met waar de eigenaar is. */
async function startLink(t: ClubToegang, kijker: InstelKijker, taal: Taal): Promise<CentrumStart | null> {
  const p = instelPagina('start')
  if (!p || !zichtbareInstelPaginas(kijker).includes(p)) return null
  const start = await haalStart(t)
  const s = BEHEER[taal].stand
  const v = start.ok ? start.voortgang : null
  return { href: instelHref(p, null), stand: !start.ok ? null : v?.afgerondOp ? s.afgerond : v ? s.bijStap(v.stap, AANTAL_STAPPEN) : null }
}

/** De categorieen met hun regels, in de taal en met de vestiging in de links. */
function categorieen(kijker: InstelKijker, stand: Record<string, Stand>, vestiging: string | null, taal: Taal): CentrumCategorie[] {
  const nietBeschikbaar = BEHEER[taal].algemeen.nietBeschikbaar
  const regel = (bron: InstelPagina, links: InstelPagina[]): CentrumRegel => {
    const p = instelPaginaInTaal(bron, taal)
    const beschikbaar = !(p.perVestiging && !vestiging)
    return {
      id: p.id,
      titel: p.titel,
      uitleg: p.uitleg,
      stand: beschikbaar ? (stand[p.id]?.stand ?? null) : nietBeschikbaar,
      let: beschikbaar && Boolean(stand[p.id]?.let),
      href: beschikbaar ? instelHref(p, vestiging) : null,
      links: links.filter((l) => !(l.perVestiging && !vestiging)).map((l) => ({ id: l.id, titel: instelPaginaInTaal(l, taal).titel, href: instelHref(l, vestiging) })),
    }
  }
  return instelIndeling(kijker).map((c) => {
    const rijen = c.rijen.map((r) => regel(r.pagina, r.links))
    return { sleutel: c.sleutel, label: instelGroepLabel(c.sleutel, taal), uitleg: instelGroepUitleg(c.sleutel, taal), let: rijen.some((r) => r.let), rijen }
  })
}

export default async function InstellingenCentrum({ searchParams }: { searchParams: ZoekParams }) {
  const { t, kijker } = await eisInstellingencentrum()
  const org = t.organisatie
  const taal = await getTaal()
  const v = kiesUit(t.vestigingen, (await searchParams).v)
  const zichtbaar = zichtbareInstelPaginas(kijker)
  const ziet = (id: string) => zichtbaar.some((p) => p.id === id)
  const [stand, start] = await Promise.all([standen(t, ziet, taal), startLink(t, kijker, taal)])
  const lijst = categorieen(kijker, stand, v, taal)

  // Nog te doen: alleen de punten die deze persoon ziet en die al gelezen konden worden.
  const teDoenPunten = TE_DOEN_IDS.filter((id) => ziet(id) && !stand[id]?.onbekend)
  const overzicht = teDoenOverzicht(teDoenPunten.map((id) => ({ id, klaar: !stand[id]?.let })))
  const hrefTeDoen = Object.fromEntries(TE_DOEN_IDS.map((id) => [id, instelHref(instelPagina(id) ?? { pad: '' }, v)])) as Record<TeDoenId, string>
  const huisstijl = magOnderdeel(t.onderdelen, 'huisstijl')

  return (
    <div className="club-ic-pagina">
      <CentrumKop
        naam={org.naam}
        demo={org.demo}
        adres={ziet('adres') ? (org.slug ? adresVan(org.slug, subdomeinenActief()) : null) : undefined}
        kleur={org.kleurAccent}
        naamHref={huisstijl && ziet('huisstijl') ? '/club/huisstijl' : null}
        magNieuw={t.isPlatformEigenaar}
      />
      {overzicht && <NogTeDoen overzicht={overzicht} href={hrefTeDoen} />}
      <InstelCentrum categorieen={lijst} start={start} />
    </div>
  )
}
