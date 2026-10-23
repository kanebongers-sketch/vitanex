import type { Metadata } from 'next'
import type { ClubToegang } from '@/lib/club/toegang'
import { eisInstellingencentrum } from '@/lib/club/instel-toegang'
import { adresVan } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'
import { MODULES, MODULE_LABEL, LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { CHECKIN_METHODE_LABEL } from '@/lib/club/kern/org-instellingen'
import { INSTEL_GROEPEN, INSTEL_PAGINAS, instelHref, magInstelPagina, type InstelKijker } from '@/lib/club/kern/instel-paginas'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { haalBedrijf } from '@/lib/club/bedrijf/opslag'
import { haalRegels } from '@/lib/club/automatisering/opslag'
import { haalBeheerders } from '@/lib/club/beheerders/beheerder-opslag'
import { haalStart } from '@/lib/club/start/opslag'
import { AANTAL_STAPPEN } from '@/lib/club/start/stappen'
import { InstellingenGroep, type InstellingRegel } from '@/components/club/beheer/InstellingenGroep'
import { BeheerKop } from '@/components/club/beheer/BeheerKop'
import '@/components/club/beheer/beheer.css'

export const metadata: Metadata = { title: 'Instellingen' }

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

function aantal(n: number | null, enkel: string, meer: string): string {
  if (n === null) return 'Onbekend'
  return `${n} ${n === 1 ? enkel : meer}`
}

interface Stand {
  stand: string
  /** Vraagt aandacht (nog niet ingesteld). */
  let?: boolean
}

/** Bij een leesfout: neutraal, zonder aandachtsteken. */
const ONBEKEND: Stand = { stand: 'Onbekend' }

/** Alleen lezen wat deze persoon ziet. */
function als<T>(mag: boolean, laad: () => Promise<T>): Promise<T | null> {
  return mag ? laad() : Promise.resolve(null)
}

/** De stand per instel-pagina, in een paar woorden. */
async function standen(t: ClubToegang, ziet: (id: string) => boolean): Promise<Record<string, Stand>> {
  const org = t.organisatie
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
    start: start?.ok === false ? ONBEKEND : { stand: voortgang?.afgerondOp ? 'Afgerond' : voortgang ? `Bij stap ${voortgang.stap} van ${AANTAL_STAPPEN}` : 'Nog niet begonnen' },
    huisstijl: { stand: org.logo ? (org.logo === LOGO_FIT_FACTORY ? 'Eigen logo' : 'Logo geupload') : 'Nog geen logo', let: !org.logo },
    onderdelen: { stand: `${aanTal} van ${MODULES.length} aan` },
    adres: { stand: org.slug ? adresVan(org.slug, subdomeinenActief()) : 'Nog niet gekozen', let: !org.slug },
    bedrijf: bedrijf === null ? ONBEKEND : { stand: bedrijf.gegevens.kvk ? 'KvK ingevuld' : 'Nog niet ingevuld', let: !bedrijf.gegevens.kvk },
    vestigingen: { stand: aantal(t.vestigingen.length, 'vestiging', 'vestigingen'), let: t.vestigingen.length === 0 },
    regels: { stand: 'Per vestiging' },
    sluiting: { stand: 'Feestdagen en sluitingen' },
    zalen: { stand: aantal(zalen, 'zaal', 'zalen') },
    medewerkers: { stand: aantal(medewerkers, 'medewerker', 'medewerkers') },
    rechten: { stand: 'Vier rollen' },
    beheerders: { stand: beheerders ? aantal(beheerders.length, 'beheerder', 'beheerders') : 'Eigenaren en clubmanagers' },
    lestypen: { stand: aantal(lestypen, 'lestype', 'lestypen') },
    weekrooster: { stand: 'Per vestiging' },
    afspraaktypen: { stand: 'Intake, personal training, metingen' },
    intake: { stand: 'Vaste en eigen vragen' },
    oefeningen: { stand: `${aantal(oefeningen, 'oefening', 'oefeningen')}${eigenCoaching ? `, ${eigenCoaching} met eigen coaching` : ''}` },
    lidmaatschappen: { stand: aantal(vormen, 'vorm', 'vormen') },
    importeren: { stand: aantal(leden, 'lid', 'leden') },
    checkin: { stand: CHECKIN_METHODE_LABEL[org.instellingen.checkin.methode].split(' (')[0].split(':')[0] },
    ledenapp: { stand: `${app.welkom ? 'Eigen welkom' : 'Standaard welkom'}, QR ${app.qr ? 'aan' : 'uit'}` },
    meldingen: { stand: 'Herinnertijden en welke aan staan' },
    opvolgregels: { stand: regels ? `${regels.filter((r) => r.aan).length} van ${regels.length} aan` : 'Onbekend' },
    betalen: { stand: 'Stripe, producten en verkopen' },
    abonnement: { stand: 'Pakket, status en facturen' },
  }
}

/** De regels per groep die deze persoon mag zien. Onderdeel uit of geen vestiging: zichtbaar maar niet beschikbaar. */
function groepen(kijker: InstelKijker, stand: Record<string, Stand>, vestiging: string | null) {
  return INSTEL_GROEPEN.map((g) => ({
    titel: g.label,
    regels: INSTEL_PAGINAS.filter((p) => p.groep === g.sleutel && magInstelPagina(p, kijker)).map(
      (p): InstellingRegel => ({
        titel: p.titel,
        uitleg: p.uitleg,
        stand: stand[p.id]?.stand ?? '',
        href: instelHref(p, vestiging),
        let: stand[p.id]?.let,
        uit: Boolean((p.module && kijker.uit.includes(p.module)) || (p.perVestiging && !vestiging)),
      }),
    ),
  })).filter((g) => g.regels.length > 0)
}

export default async function InstellingenCentrum({ searchParams }: { searchParams: ZoekParams }) {
  const { t, kijker } = await eisInstellingencentrum()
  const org = t.organisatie
  const v = kiesUit(t.vestigingen, (await searchParams).v)
  const ziet = (id: string) => INSTEL_PAGINAS.some((p) => p.id === id && magInstelPagina(p, kijker))
  const lijst = groepen(kijker, await standen(t, ziet), v)
  const teDoen = lijst.flatMap((g) => g.regels).filter((r) => r.let && !r.uit).map((r) => r.titel)
  const huisstijl = magOnderdeel(t.onderdelen, 'huisstijl')

  return (
    <>
      <BeheerKop
        naam={org.naam}
        demo={org.demo}
        adres={huisstijl ? (org.slug ? adresVan(org.slug, subdomeinenActief()) : null) : undefined}
        kleur={org.kleurAccent}
        modules={MODULES.filter((m) => !org.uit.includes(m)).map((m) => MODULE_LABEL[m].label)}
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
