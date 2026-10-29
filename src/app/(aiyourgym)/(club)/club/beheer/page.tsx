import type { Metadata } from 'next'
import type { ClubToegang } from '@/lib/club/toegang'
import { eisInstellingencentrum } from '@/lib/club/instel-toegang'
import { adresVan } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'
import { MODULES, LOGO_FIT_FACTORY, moduleTekst } from '@/lib/club/kern/organisatie'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { checkinMethodeLabel } from '@/lib/club/kern/org-instellingen'
import { INSTEL_GROEPEN, INSTEL_PAGINAS, instelGroepLabel, instelHref, instelPaginaInTaal, magInstelPagina, type InstelKijker } from '@/lib/club/kern/instel-paginas'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { haalBedrijf } from '@/lib/club/bedrijf/opslag'
import { haalRegels } from '@/lib/club/automatisering/opslag'
import { haalBeheerders } from '@/lib/club/beheerders/beheerder-opslag'
import { haalStart } from '@/lib/club/start/opslag'
import { AANTAL_STAPPEN } from '@/lib/club/start/stappen'
import { InstellingenGroep, type InstellingRegel } from '@/components/club/beheer/InstellingenGroep'
import { BeheerKop } from '@/components/club/beheer/BeheerKop'
import '@/components/club/beheer/beheer.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: BEHEER[await getTaal()].algemeen.instellingen }
}

// Het instellingencentrum: alles wat je instelt, op een plek, in acht groepen
// zonder overlap (zie src/lib/club/kern/instel-paginas.ts). Per regel de huidige
// stand en een klik naar de plek waar je het aanpast. Iedereen ziet alleen de
// regels die hij mag; de stand wordt alleen gelezen voor die regels.

/** Het aantal rijen van deze sportschool in een tabel; null bij een fout (gelogd). */
async function tel(t: ClubToegang, tabel: string, alleenEigenCoaching = false): Promise<number | null> {
  let q = t.admin.from(tabel).select('id', { count: 'exact', head: true }).eq('user_id', t.userId)
  if (alleenEigenCoaching) q = q.not('coaching', 'is', null)
  const { count, error } = await q
  if (error) console.error(`[club] tellen ${tabel} mislukt`, error.message)
  return error ? null : count
}

/** Een telling als tekst, of Onbekend bij een leesfout. */
function aantal(n: number | null, tekst: (n: number) => string, onbekend: string): string {
  return n === null ? onbekend : tekst(n)
}

interface Stand {
  stand: string
  /** Vraagt aandacht (nog niet ingesteld). */
  let?: boolean
}


/** Alleen lezen wat deze persoon ziet. */
function als<T>(mag: boolean, laad: () => Promise<T>): Promise<T | null> {
  return mag ? laad() : Promise.resolve(null)
}

/** De stand per instel-pagina, in een paar woorden. */
async function standen(t: ClubToegang, ziet: (id: string) => boolean, taal: Taal): Promise<Record<string, Stand>> {
  const org = t.organisatie
  const s = BEHEER[taal].stand
  /** Bij een leesfout: neutraal, zonder aandachtsteken. */
  const ONBEKEND: Stand = { stand: s.onbekend }
  const tal = (n: number | null, tekst: (n: number) => string) => aantal(n, tekst, s.onbekend)
  const [medewerkers, leden, oefeningen, eigenCoaching, lestypen, zalen, vormen, bedrijf, regels, beheerders, start] = await Promise.all([
    als(ziet('medewerkers'), () => tel(t, 'club_medewerkers')),
    als(ziet('importeren'), () => tel(t, 'club_leden')),
    als(ziet('oefeningen'), () => tel(t, 'club_oefeningen')),
    als(ziet('oefeningen'), () => tel(t, 'club_oefeningen', true)),
    als(ziet('lestypen'), () => tel(t, 'club_lestypen')),
    als(ziet('zalen'), () => tel(t, 'club_zalen')),
    als(ziet('lidmaatschappen'), () => tel(t, 'club_lidmaatschapsvormen')),
    als(ziet('bedrijf'), () => haalBedrijf(t.admin, t.userId)),
    als(ziet('opvolgregels'), () => haalRegels(t.admin, t.userId)),
    als(ziet('beheerders'), () => haalBeheerders(t.admin, t.userId)),
    als(ziet('start'), () => haalStart(t)),
  ])
  const app = org.instellingen.ledenapp
  const aanTal = MODULES.length - org.uit.length
  const voortgang = start?.ok ? start.voortgang : null
  return {
    start: start?.ok === false ? ONBEKEND : { stand: voortgang?.afgerondOp ? s.afgerond : voortgang ? s.bijStap(voortgang.stap, AANTAL_STAPPEN) : s.nietBegonnen },
    huisstijl: { stand: org.logo ? (org.logo === LOGO_FIT_FACTORY ? s.eigenLogo : s.logoGeupload) : s.geenLogo, let: !org.logo },
    onderdelen: { stand: s.aanVan(aanTal, MODULES.length) },
    adres: { stand: org.slug ? adresVan(org.slug, subdomeinenActief()) : s.nietGekozen, let: !org.slug },
    bedrijf: bedrijf === null ? ONBEKEND : { stand: bedrijf.gegevens.kvk ? s.kvkIngevuld : s.nietIngevuld, let: !bedrijf.gegevens.kvk },
    vestigingen: { stand: tal(t.vestigingen.length, s.vestigingen), let: t.vestigingen.length === 0 },
    regels: { stand: s.perVestiging },
    sluiting: { stand: s.sluiting },
    zalen: { stand: tal(zalen, s.zalen) },
    medewerkers: { stand: tal(medewerkers, s.medewerkers) },
    rechten: { stand: s.rechten },
    beheerders: { stand: beheerders ? tal(beheerders.length, s.beheerders) : s.beheerdersOnbekend },
    lestypen: { stand: tal(lestypen, s.lestypen) },
    weekrooster: { stand: s.perVestiging },
    afspraaktypen: { stand: s.afspraaktypen },
    intake: { stand: s.intake },
    oefeningen: { stand: `${tal(oefeningen, s.oefeningen)}${eigenCoaching ? `, ${s.eigenCoaching(eigenCoaching)}` : ''}` },
    lidmaatschappen: { stand: tal(vormen, s.vormen) },
    importeren: { stand: tal(leden, s.leden) },
    checkin: { stand: checkinMethodeLabel(org.instellingen.checkin.methode, taal, true) },
    ledenapp: { stand: s.ledenapp(Boolean(app.welkom), app.qr) },
    meldingen: { stand: s.meldingen },
    opvolgregels: { stand: regels ? s.aanVan(regels.filter((r) => r.aan).length, regels.length) : s.onbekend },
    betalen: { stand: s.betalen },
    kortingen: { stand: s.kortingen },
    abonnement: { stand: s.abonnement },
  }
}

/** De regels per groep die deze persoon mag zien. Onderdeel uit of geen vestiging: zichtbaar maar niet beschikbaar. */
function groepen(kijker: InstelKijker, stand: Record<string, Stand>, vestiging: string | null, taal: Taal) {
  return INSTEL_GROEPEN.map((g) => ({
    titel: instelGroepLabel(g.sleutel, taal),
    regels: INSTEL_PAGINAS.filter((p) => p.groep === g.sleutel && magInstelPagina(p, kijker)).map((bron): InstellingRegel => {
      const p = instelPaginaInTaal(bron, taal)
      return {
        titel: p.titel,
        uitleg: p.uitleg,
        stand: stand[p.id]?.stand ?? '',
        href: instelHref(p, vestiging),
        let: stand[p.id]?.let,
        uit: Boolean((p.module && kijker.uit.includes(p.module)) || (p.perVestiging && !vestiging)),
      }
    }),
  })).filter((g) => g.regels.length > 0)
}

export default async function InstellingenCentrum({ searchParams }: { searchParams: ZoekParams }) {
  const { t, kijker } = await eisInstellingencentrum()
  const org = t.organisatie
  const taal = await getTaal()
  const v = kiesUit(t.vestigingen, (await searchParams).v)
  const ziet = (id: string) => INSTEL_PAGINAS.some((p) => p.id === id && magInstelPagina(p, kijker))
  const lijst = groepen(kijker, await standen(t, ziet, taal), v, taal)
  const teDoen = lijst.flatMap((g) => g.regels).filter((r) => r.let && !r.uit).map((r) => r.titel)
  const huisstijl = magOnderdeel(t.onderdelen, 'huisstijl')

  return (
    <>
      <BeheerKop
        naam={org.naam}
        demo={org.demo}
        adres={huisstijl ? (org.slug ? adresVan(org.slug, subdomeinenActief()) : null) : undefined}
        kleur={org.kleurAccent}
        modules={MODULES.filter((m) => !org.uit.includes(m)).map((m) => moduleTekst(m, taal).label)}
        teDoen={teDoen}
        magNieuw={t.isPlatformEigenaar}
      />
      <div className="club-beheer-groepen">
        {lijst.map((g) => (
          <InstellingenGroep key={g.titel} titel={g.titel} regels={g.regels} />
        ))}
      </div>
    </>
  )
}
