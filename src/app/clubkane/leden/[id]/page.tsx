import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { eisModule } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { hoortBij, naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
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
import { haalVoortgang } from '@/lib/club/voortgang/data'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
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
  const nu = new Date()
  const kaart = await haalLidKaart(t.admin, t.userId, id, nu)
  if (!kaart) notFound()
  const voortgang = await haalVoortgang(t.admin, t.userId, kaart.lid.id, nu)
  const { lid } = kaart
  // De vestiging uit de URL als die bij deze sportschool hoort, anders die van het lid.
  const vestiging = typeof ruw.v === 'string' && hoortBij(t.vestigingen, ruw.v) ? ruw.v : lid.vestiging
  const coach = kaart.medewerkers.find((m) => m.id === lid.coachId)

  return (
    <>
      <LidKop lid={lid} vestiging={vestiging} vestigingNaam={naamVan(t.vestigingen, lid.vestiging)} coachNaam={coach?.naam ?? null} />
      <nav className="club-segment club-leden-secties" aria-label="Spring naar">
        <a href="#overzicht">Overzicht</a>
        <a href="#voortgang">Voortgang</a>
        <a href="#notities">Notities</a>
        <a href="#gegevens">Gegevens</a>
      </nav>
      {kaart.fouten.length ? (
        <p className="club-melding club-melding--fout" role="alert">Niet alles kon worden geladen ({kaart.fouten.join(', ')}). Ververs de pagina om het opnieuw te proberen.</p>
      ) : null}
      <div className="club-raster">
        <div className="club-k8 club-leden-kolom" id="overzicht">
          <section className="club-kaart" aria-labelledby="patroon-kop">
            <div className="club-sectiekop">
              <h2 id="patroon-kop">Bezoekpatroon</h2>
              <span>Laatste 12 weken · {kaart.laatsteBezoek ? `laatste bezoek ${laatsteBezoekTekst(kaart.laatsteBezoek, nu).toLowerCase()}` : 'nog nooit geweest'}</span>
            </div>
            <Bezoekpatroon bezoeken={kaart.bezoeken.map((b) => b.op)} nu={nu} />
          </section>
          <div className="club-leden-tweekolom">
            <BehoudKaart behoud={kaart.behoud} geenTekst={geenBehoudTekst(kaart)} />
            <LaatsteBezoeken kaart={kaart} nu={nu} vestigingen={t.vestigingen} />
          </div>
          <Reserveringen aankomend={kaart.aankomend} recent={kaart.recent} checkins={kaart.bezoeken} nu={nu} />
          <div id="voortgang">
            <Voortgangskaart
              begin={voortgang}
              medewerkers={kaart.medewerkers.map((m) => ({ id: m.id, naam: m.naam }))}
              vandaag={dagSleutelNl(nu)}
              nu={nu.toISOString()}
            />
          </div>
        </div>
        <aside className="club-k4 club-leden-kolom" aria-label="Notities en gegevens">
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
        </aside>
      </div>
    </>
  )
}
