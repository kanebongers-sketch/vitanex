import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { eisModule } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { binnenVestigingen, hoortBij, naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { Medewerker } from '@/lib/club/kern/medewerker'
import { haalLidKaart, type LidKaart } from '@/lib/club/leden/kaart'
import { datumKort, datumUitSleutel, laatsteBezoekTekst, leeftijd, tijdNl } from '@/lib/club/leden/tijd'
import { LidKop } from '@/components/club/leden/LidKop'
import { BehoudKaart } from '@/components/club/leden/BehoudKaart'
import { Bezoekpatroon } from '@/components/club/leden/Bezoekpatroon'
import { Reserveringen } from '@/components/club/leden/Reserveringen'
import { Notities } from '@/components/club/leden/Notities'
import { LidGegevens } from '@/components/club/leden/LidGegevens'
import { Voortgangskaart } from '@/components/club/voortgang/Voortgangskaart'
import { AfsprakenVanLid } from '@/components/club/afspraken/AfsprakenVanLid'
import { haalVoortgang } from '@/lib/club/voortgang/data'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { haalPlan } from '@/lib/club/voeding/lezen'
import { VoedingOpKaart } from '@/components/club/voeding/VoedingOpKaart'
import { LedenappLink } from '@/components/club/ledenlogin/LedenappLink'
import { isUuid, moduleAan } from '@/lib/club/kern/organisatie'
import { AvgKaart } from '@/components/club/leden/AvgKaart'
import { magLidVerwijderen, verzoekTekst } from '@/lib/club/leden/avg/verwijderen'
import { haalVerwijderverzoek } from '@/lib/club/leden/avg/opslag'
import { LidTraining } from '@/components/club/training/LidTraining'
import '@/components/club/leden/leden.css'

export const metadata: Metadata = { title: 'Ledenkaart' }

const BRON_LABEL: Record<string, string> = { balie: 'Balie', qr: 'QR-code', bandje: 'Bandje', les: 'Les' }

function geenBehoudTekst(kaart: LidKaart): string {
  if (kaart.lid.status === 'gepauzeerd') return 'Gepauzeerd: we verwachten nu geen bezoek, dus geen score.'
  if (kaart.lid.status === 'opgezegd') return 'Opgezegd: geen score meer. Wel een kans voor een gesprek voor de einddatum.'
  if (kaart.lid.status === 'gestopt') return 'Gestopt: geen score.'
  return 'De bezoeken konden niet worden geladen, dus er is nu geen score.'
}

/** Trainers om uit te kiezen, plus de huidige coach als die geen trainer is. */
function coachKeuzes(medewerkers: Medewerker[], coachId: string | null): { id: string; naam: string }[] {
  const trainers = medewerkers.filter((m) => m.rollen.includes('trainer'))
  const huidig = medewerkers.find((m) => m.id === coachId)
  const lijst = huidig && !trainers.includes(huidig) ? [...trainers, huidig] : trainers
  return lijst.map((m) => ({ id: m.id, naam: m.naam }))
}

function LaatsteBezoeken({ kaart, nu, vestigingen }: { kaart: LidKaart; nu: Date; vestigingen: readonly VestigingInfo[] }) {
  const lijst = kaart.bezoeken.slice(0, 8)
  return (
    <section className="club-kaart" aria-labelledby="bezoeken-kop">
      <h2 id="bezoeken-kop">Laatste bezoeken</h2>
      {lijst.length ? (
        <ul className="club-lijst">
          {lijst.map((b) => {
            const elders = b.vestiging && b.vestiging !== kaart.lid.vestiging ? naamVan(vestigingen, b.vestiging) : null
            return (
              <li key={b.id} className="club-rij">
                <span className="club-rij-hoofd">
                  <span className="club-rij-titel">{laatsteBezoekTekst(b.op, nu)}</span>
                  <span className="club-rij-sub club-getal">{datumKort(b.op, nu)}, {tijdNl(b.op)}</span>
                </span>
                {elders ? <span className="club-chip club-chip--info">In {elders}</span> : null}
                <span className="club-chip club-chip--geen">{BRON_LABEL[b.bron] ?? b.bron}</span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="club-hint">
          {kaart.laatsteBezoek
            ? `Geen bezoek in de laatste 12 weken. Laatste bezoek: ${datumKort(kaart.laatsteBezoek, nu)}.`
            : `Nog nooit geweest.${kaart.lid.lidSinds ? ` Ingeschreven op ${datumUitSleutel(kaart.lid.lidSinds)}.` : ''}`}
        </p>
      )}
    </section>
  )
}

export default async function LidPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: ZoekParams }) {
  const t = await eisModule('leden')
  const [{ id }, ruw] = await Promise.all([params, searchParams])
  // Geen geldig id: meteen 404, zonder vier queries met onzin.
  if (!isUuid(id)) notFound()
  const nu = new Date()
  // Voeding alleen voor wie het onderdeel mag zien (een clubmanager kan het missen).
  const toonVoeding = magOnderdeel(t.onderdelen, 'voeding')
  // Training (schema's en intakes) alleen als het onderdeel aan staat en deze persoon het mag.
  const toonTraining = moduleAan(t.organisatie, 'training') && magOnderdeel(t.onderdelen, 'schemas')
  // Voortgang, voeding en verwijderverzoek hangen alleen van het lid-id af (alles filtert op de
  // sportschool): tegelijk met de kaart ophalen. Hoort het lid niet bij deze persoon, dan vervalt het.
  const [gelezen, voortgang, voeding, verzoek] = await Promise.all([
    haalLidKaart(t.admin, t.userId, id, nu),
    haalVoortgang(t.admin, t.userId, id, nu),
    toonVoeding ? haalPlan(t.admin, t.userId, id) : Promise.resolve(null),
    haalVerwijderverzoek(t.admin, t.userId, id),
  ])
  // Een lid van een vestiging die niet van deze persoon is: dezelfde 404 als een onbekend lid.
  const kaart = gelezen && binnenVestigingen(t.vestigingen, gelezen.lid) ? gelezen : null
  if (!kaart) notFound()
  const { lid } = kaart
  // De vestiging uit de URL als die bij deze sportschool hoort, anders die van het lid.
  const vestiging = typeof ruw.v === 'string' && hoortBij(t.vestigingen, ruw.v) ? ruw.v : lid.vestiging
  const coach = kaart.medewerkers.find((m) => m.id === lid.coachId)

  return (
    <>
      <LidKop lid={lid} vestiging={vestiging} vestigingNaam={naamVan(t.vestigingen, lid.vestiging)} coachNaam={coach?.naam ?? null} naar={{ training: toonTraining, rooster: moduleAan(t.organisatie, 'rooster') && magOnderdeel(t.onderdelen, 'rooster') }} />
      <nav className="club-segment club-leden-secties" aria-label="Spring naar">
        <a href="#overzicht">Overzicht</a>
        {toonTraining && <a href="#training">Training</a>}
        <a href="#voortgang">Voortgang</a>
        {toonVoeding && <a href="#voeding">Voeding</a>}
        <a href="#notities">Notities</a>
        <a href="#gegevens">Gegevens</a>
        <a href="#privacy">Privacy</a>
      </nav>
      {verzoek ? (
        <p className="club-melding club-melding--fout" role="status">
          {verzoekTekst(verzoek, nu)} Dit lid kan niet meer inloggen, inchecken of boeken.{magLidVerwijderen(t) ? <> <a href="#privacy">Terugdraaien</a></> : null}
        </p>
      ) : null}
      {kaart.fouten.length ? (
        <p className="club-melding club-melding--fout" role="alert">Niet alles kon worden geladen ({kaart.fouten.join(', ')}). Ververs de pagina om het opnieuw te proberen.</p>
      ) : null}
      <div className="club-raster">
        <div className="club-k8 club-leden-kolom" id="overzicht">
          {/* Eerst de hoofdzaak: hoe staat dit lid ervoor (behoud) en wanneer was het er. */}
          <div className="club-leden-tweekolom">
            <BehoudKaart behoud={kaart.behoud} geenTekst={geenBehoudTekst(kaart)} />
            <LaatsteBezoeken kaart={kaart} nu={nu} vestigingen={t.vestigingen} />
          </div>
          <section className="club-kaart" aria-labelledby="patroon-kop">
            <div className="club-sectiekop">
              <h2 id="patroon-kop">Bezoekpatroon</h2>
              <span>Laatste 12 weken · {kaart.laatsteBezoek ? `laatste bezoek ${laatsteBezoekTekst(kaart.laatsteBezoek, nu).toLowerCase()}` : 'nog nooit geweest'}</span>
            </div>
            <Bezoekpatroon bezoeken={kaart.bezoeken.map((b) => b.op)} nu={nu} />
          </section>
          <Reserveringen aankomend={kaart.aankomend} recent={kaart.recent} checkins={kaart.bezoeken} nu={nu} />
          <Suspense fallback={<div className="club-skelet" style={{ minHeight: 120 }} aria-hidden />}>
            <AfsprakenVanLid lidId={kaart.lid.id} vestiging={kaart.lid.vestiging} />
          </Suspense>
          <div id="voortgang">
            <Voortgangskaart
              begin={voortgang}
              medewerkers={kaart.medewerkers.map((m) => ({ id: m.id, naam: m.naam }))}
              vandaag={dagSleutelNl(nu)}
              nu={nu.toISOString()}
            />
          </div>
          {toonVoeding && <VoedingOpKaart lidId={lid.id} vestiging={vestiging} plan={voeding} />}
        </div>
        <aside className="club-k4 club-leden-kolom" aria-label="Training, notities en gegevens">
          {toonTraining && (
            <Suspense fallback={<div className="club-skelet" style={{ minHeight: 160 }} aria-hidden />}>
              <LidTraining t={t} lidId={lid.id} voornaam={lid.voornaam} vestiging={vestiging} />
            </Suspense>
          )}
          {moduleAan(t.organisatie, 'app') && <LedenappLink lidId={lid.id} voornaam={lid.voornaam} />}
          <Notities lidId={lid.id} notities={kaart.notities} />
          <LidGegevens
            lidId={lid.id}
            email={lid.email}
            telefoon={lid.telefoon}
            geboortedatum={datumUitSleutel(lid.geboortedatum)}
            leeftijd={leeftijd(lid.geboortedatum, nu)}
            coachId={lid.coachId}
            trainers={coachKeuzes(kaart.medewerkers, lid.coachId)}
            tags={lid.tags}
          />
          <AvgKaart
            lidId={lid.id}
            voornaam={lid.voornaam}
            achternaam={lid.achternaam}
            magVerwijderen={magLidVerwijderen(t)}
            verzoekTekst={verzoek ? verzoekTekst(verzoek, nu) : null}
          />
        </aside>
      </div>
    </>
  )
}
