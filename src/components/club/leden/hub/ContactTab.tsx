import Link from 'next/link'
import { Suspense } from 'react'
import type { ClubToegang } from '@/lib/club/toegang'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import type { Lid } from '@/lib/club/kern/lid'
import type { LidKaart } from '@/lib/club/leden/kaart'
import { datumUitSleutel, leeftijd } from '@/lib/club/leden/tijd'
import { haalBerichtenVoorLid } from '@/lib/club/berichten/data'
import { SOORT_CHIP } from '@/lib/club/berichten/model'
import type { KaartRechten } from '@/lib/club/leden/hub/rechten'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { tekst } from '@/lib/aiyourgym/taal/woordenboek'
import { LEDENKAART, LIDKAART_BLOKKEN } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { Contact } from '../LidGegevens'
import { FotoKiezer } from '@/components/club/profielfoto/FotoKiezer'
import { PROFIELFOTO } from '@/lib/aiyourgym/taal/woorden/club/profielfoto'
import { minstens } from '@/lib/club/rollen/typen'
import { initialen, volledigeNaam } from '@/lib/club/kern/lid'
import { Notities } from '../Notities'

// Tabblad Contact en notities: hoe je het lid bereikt, de notities van het team
// en de berichten die het lid nu in de ledenapp ziet.

interface ContactTabProps {
  t: ClubToegang
  kaart: LidKaart
  vestiging: Vestiging
  rechten: KaartRechten
  nu: Date
}

async function Berichten({ t, lid, vestiging, nu }: { t: ClubToegang; lid: Lid; vestiging: Vestiging; nu: Date }) {
  const taal = await getTaal()
  const w = tekst(LEDENKAART, taal).contact
  const soort = tekst(LIDKAART_BLOKKEN, taal).kaart.berichtSoort
  const berichten = await haalBerichtenVoorLid(t.admin, t.userId, lid, nu)
  return (
    <section className="club-kaart" aria-labelledby="berichten-kop">
      <div className="club-sectiekop">
        <h2 id="berichten-kop">{w.berichten}</h2>
        <Link href={clubPad('/berichten', vestiging)}>{w.naarBerichten}</Link>
      </div>
      <p className="club-hint">{w.berichtenUitleg}</p>
      {berichten === null ? <p className="club-melding club-melding--fout" role="alert">{w.berichtenFout}</p>
        : berichten.length === 0 ? <p className="club-hint">{w.geenBerichten}</p>
          : (
            <ul className="club-lijst">
              {berichten.slice(0, 6).map((b) => (
                <li key={b.id} className="club-rij">
                  <span className="club-rij-hoofd">
                    <span className="club-rij-titel">{b.titel}</span>
                    <span className="club-rij-sub club-lidhub-tweeregels">{b.tekst}</span>
                  </span>
                  {b.vastgepind ? <span className="club-chip club-chip--geen">{w.vastgepind}</span> : null}
                  <span className={`club-chip club-chip--${SOORT_CHIP[b.soort]}`}>{soort[b.soort]}</span>
                </li>
              ))}
            </ul>
          )}
    </section>
  )
}

/**
 * Profielfoto van het lid. De sportschool zet hem alleen met toestemming van
 * het lid (vinkje, vastgelegd in club_profielfotos); weghalen kan altijd.
 * Alleen voor wie Leden mag bewerken (rollen v2) of de kaart mag openen (oud model).
 */
async function Profielfoto({ t, lid }: { t: ClubToegang; lid: Lid }) {
  const taal = await getTaal()
  const w = tekst(PROFIELFOTO, taal)
  const magBewerken = !t.profiel || minstens(t.profiel.niveaus.leden ?? 'geen', 'bewerken')
  return (
    <section className="club-kaart" aria-labelledby="profielfoto-kop">
      <h2 id="profielfoto-kop">{w.titel}</h2>
      <FotoKiezer
        naam={volledigeNaam(lid)}
        initialen={initialen(lid)}
        foto={{ soort: 'lid', id: lid.id, versie: lid.foto ?? null }}
        adres={`/api/club/leden/${lid.id}/profielfoto`}
        waar="club"
        balie
        uitleg={w.uitlegBalie}
        alleenLezen={!magBewerken}
      />
    </section>
  )
}

export async function ContactTab({ t, kaart, vestiging, rechten, nu }: ContactTabProps) {
  const taal = await getTaal()
  const w = tekst(LEDENKAART, taal).contact
  const { lid } = kaart
  return (
    <div className="club-lidhub-tab club-lidhub-twee">
      <div className="club-leden-kolom">
        <section className="club-kaart" aria-labelledby="contact-kop">
          <h2 id="contact-kop">{w.gegevens}</h2>
          <Contact email={lid.email} telefoon={lid.telefoon} geboortedatum={datumUitSleutel(lid.geboortedatum, taal)} leeftijd={leeftijd(lid.geboortedatum, nu)} />
          <p className="club-hint">{w.contactHint}</p>
        </section>
        <Profielfoto t={t} lid={lid} />
        {rechten.bewerk.berichten && (
          <Suspense fallback={<div className="club-skelet" style={{ minHeight: 120 }} aria-hidden />}>
            <Berichten t={t} lid={lid} vestiging={vestiging} nu={nu} />
          </Suspense>
        )}
      </div>
      <div className="club-leden-kolom">
        <Notities lidId={lid.id} notities={kaart.notities} alleenLezen={!rechten.bewerk.leden} />
      </div>
    </div>
  )
}
