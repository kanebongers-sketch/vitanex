import type { Metadata } from 'next'
import { eisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { adresVan } from '@/lib/club/kern/subdomein'
import { MODULES, MODULE_LABEL, LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { clubPad } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { InstellingenGroep, type InstellingRegel } from '@/components/club/beheer/InstellingenGroep'
import { BeheerKop } from '@/components/club/beheer/BeheerKop'
import '@/components/club/beheer/beheer.css'

export const metadata: Metadata = { title: 'Instellingencentrum' }

// Het instellingencentrum: alles wat de eigenaar van een sportschool instelt,
// op een plek, met per onderdeel de huidige stand. Elk onderdeel opent de
// plek waar je het aanpast (besluit Kane: de eigenaar stelt alles zelf in).

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

export default async function BeheerPagina() {
  const t = await eisClubToegang()
  const org = t.organisatie
  const v = kiesUit(t.vestigingen, null)
  const pad = (p: string, extra?: Record<string, string>) => (v ? clubPad(p, v, extra) : `/clubkane${p}`)
  const [medewerkers, leden, oefeningen, eigenCoaching, lestypen, zalen, vormen] = await Promise.all([
    tel(t, 'club_medewerkers'),
    tel(t, 'club_leden'),
    tel(t, 'club_oefeningen'),
    tel(t, 'club_oefeningen', true),
    tel(t, 'club_lestypen'),
    tel(t, 'club_zalen'),
    tel(t, 'club_lidmaatschapsvormen'),
  ])
  const aanTal = MODULES.length - org.uit.length
  const app = org.instellingen.ledenapp

  const sportschool: InstellingRegel[] = [
    { titel: 'Huisstijl', uitleg: 'Naam, slogan, logo, accentkleur en donker of licht.', stand: org.logo ? (org.logo === LOGO_FIT_FACTORY ? 'Eigen logo' : 'Logo geupload') : 'Nog geen logo', href: '/clubkane/huisstijl' },
    { titel: 'Bedrijf en huisregels', uitleg: 'KvK, btw, hoofdkantoor, social links, huisregels, voorwaarden en privacy.', stand: 'Gegevens en teksten', href: '/clubkane/beheer/bedrijf' },
    { titel: 'Adres', uitleg: 'Je eigen adres voor medewerkers en leden.', stand: org.slug ? adresVan(org.slug) : 'Nog niet gekozen', href: '/clubkane/huisstijl#adres-kop', let: !org.slug },
    { titel: 'Onderdelen', uitleg: 'Zet uit wat je sportschool niet gebruikt.', stand: `${aanTal} van ${MODULES.length} aan`, href: '/clubkane/huisstijl#modules-kop' },
  ]
  const locaties: InstellingRegel[] = [
    { titel: 'Vestigingen', uitleg: 'Toevoegen, naam, volgorde en welke standaard open gaat.', stand: aantal(t.vestigingen.length, 'vestiging', 'vestigingen'), href: pad('/instellingen', { tab: 'vestigingen' }), let: t.vestigingen.length === 0 },
    { titel: 'Regels en openingstijden', uitleg: 'Boeken, annuleren, no-shows en openingstijden per vestiging.', stand: 'Per vestiging', href: pad('/instellingen', { tab: 'regels' }), uit: !v },
    { titel: 'Sluitingsdagen en feestdagen', uitleg: 'Dagen dat een vestiging dicht is of andere tijden heeft; het rooster houdt er rekening mee.', stand: 'Feestdagen en sluitingen', href: '/clubkane/beheer/sluiting' },
    { titel: 'Zalen', uitleg: 'De ruimtes voor groepslessen en hoeveel mensen erin passen.', stand: aantal(zalen, 'zaal', 'zalen'), href: pad('/instellingen', { tab: 'zalen' }), uit: !v },
  ]
  const mensen: InstellingRegel[] = [
    { titel: 'Medewerkers', uitleg: 'Wie er werkt, in welke rol en op welke vestiging.', stand: aantal(medewerkers, 'medewerker', 'medewerkers'), href: pad('/instellingen', { tab: 'medewerkers' }), uit: !v },
    { titel: 'Rechten per rol', uitleg: 'Welke onderdelen trainers, instructeurs, clubmanagers en de administratie zien.', stand: 'Vier rollen', href: '/clubkane/beheer/rechten' },
  ]
  const planning: InstellingRegel[] = [
    { titel: 'Lestypen', uitleg: 'De groepslessen die je geeft.', stand: aantal(lestypen, 'lestype', 'lestypen'), href: pad('/instellingen', { tab: 'lestypen' }), uit: !v || org.uit.includes('rooster') },
    { titel: 'Afspraaktypen', uitleg: 'Soorten afspraken, duur, buffer en boekregels voor de app.', stand: 'Intake, personal training, metingen', href: '/clubkane/afspraken?tab=typen', uit: org.uit.includes('afspraken') },
    { titel: 'Weekrooster', uitleg: 'De vaste lessen per week.', stand: 'Per vestiging', href: pad('/instellingen', { tab: 'weekrooster' }), uit: !v || org.uit.includes('rooster') },
  ]
  const training: InstellingRegel[] = [
    { titel: 'Intakeformulier', uitleg: 'De vragen bij een intake: eigen vragen, secties, volgorde en wat aan staat.', stand: 'Vaste en eigen vragen', href: '/clubkane/beheer/intake', uit: org.uit.includes('training') },
    { titel: 'Oefeningen en coaching', uitleg: 'Je bibliotheek met beelden, eigen oefeningen en je eigen coachteksten.', stand: `${aantal(oefeningen, 'oefening', 'oefeningen')}${eigenCoaching ? `, ${eigenCoaching} met eigen coaching` : ''}`, href: pad('/training', { tab: 'oefeningen' }), uit: org.uit.includes('training') },
  ]
  const ledenRegels: InstellingRegel[] = [
    { titel: 'Lidmaatschappen en labels', uitleg: 'Vormen zoals in Sportivity, met vestigingen, groepslessen en daluren, en de labels voor leden.', stand: aantal(vormen, 'vorm', 'vormen'), href: '/clubkane/beheer/lidmaatschappen' },
    { titel: 'Automatiseringen', uitleg: 'Wie het team opvolgt: nieuwe leden, proefleden, wegblijvers, verjaardagen, opzeggingen en mijlpalen.', stand: 'Zeven regels', href: '/clubkane/beheer/automatiseringen' },
    { titel: 'Challenges en badges', uitleg: 'Doelen voor leden met voortgang, ranglijst en badges.', stand: 'Lopend en gepland', href: '/clubkane/challenges' },
    { titel: 'Ledenbestand inlezen', uitleg: 'Een export uit Sportivity of Excel inlezen.', stand: aantal(leden, 'lid', 'leden'), href: pad('/leden/importeren'), uit: !v || org.uit.includes('leden') },
    { titel: 'Meldingen aan leden', uitleg: 'Bevestigingen, herinneringen en annuleringen van lessen en afspraken, per mail en in de app.', stand: 'Herinnertijden en welke aan staan', href: '/clubkane/beheer/meldingen' },
    { titel: 'Berichten aan leden', uitleg: 'Nieuws, acties en mededelingen op Home in de ledenapp.', stand: 'Nieuws en acties', href: '/clubkane/berichten', uit: org.uit.includes('app') },
    { titel: 'Ledenapp', uitleg: 'Welkomsttekst, tabbladen en de check-in code in de app voor leden.', stand: `${app.welkom ? 'Eigen welkom' : 'Standaard welkom'}, QR ${app.qr ? 'aan' : 'uit'}`, href: '/clubkane/beheer/ledenapp', uit: org.uit.includes('app') },
  ]

  return (
    <>
      <BeheerKop
        naam={org.naam}
        demo={org.demo}
        adres={org.slug ? adresVan(org.slug) : null}
        kleur={org.kleurAccent}
        modules={MODULES.filter((m) => !org.uit.includes(m)).map((m) => MODULE_LABEL[m].label)}
      />
      <div className="club-beheer-groepen">
        <InstellingenGroep titel="Sportschool" regels={sportschool} />
        <InstellingenGroep titel="Locaties" regels={locaties} />
        <InstellingenGroep titel="Mensen en rechten" regels={mensen} />
        <InstellingenGroep titel="Planning" regels={planning} />
        <InstellingenGroep titel="Training" regels={training} />
        <InstellingenGroep titel="Leden" regels={ledenRegels} />
        <InstellingenGroep
          titel="Abonnement"
          regels={[
            { titel: 'Abonnement en facturen', uitleg: 'Je pakket, betalingen en facturen van AI Your Gym.', stand: 'Pakket, status en facturen', href: '/clubkane/beheer/abonnement', uit: !(t.isKane || t.rol === 'eigenaar') },
            { titel: 'Hulp en support', uitleg: 'Handleidingen per onderdeel en een vraag of probleem melden.', stand: 'Handleidingen', href: '/clubkane/hulp' },
          ]}
        />
      </div>
    </>
  )
}
