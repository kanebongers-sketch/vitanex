import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalBeschikbaarheid } from '@/lib/club/personeel/opslag'
import { personeelHref, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import { REDEN_LABEL, type PersoneelLid } from '@/lib/club/personeel/typen'
import { MedewerkerInstellingen } from './MedewerkerInstellingen'
import { VasteWeek } from './VasteWeek'
import { LosseDatums } from './LosseDatums'
import { dagMaand, weekdagKort } from './weergave'

// Beschikbaarheid en verlof per medewerker: vaste week, losse datums,
// contracturen en roosterkleur. Bovenaan wie de komende tijd afwezig is.

interface Props {
  t: ClubToegang
  staat: PersoneelStaat
  vestiging: Vestiging
  team: PersoneelLid[]
  vandaag: string
}

export async function TeamTab({ t, staat, team, vandaag }: Props) {
  if (team.length === 0) return <p className="club-leeg">Er staan nog geen medewerkers in deze vestiging. Voeg ze toe bij Instellingen.</p>
  const gekozen = team.find((l) => l.id === staat.mw) ?? team[0]
  const regels = await haalBeschikbaarheid(t.admin, t.userId, team.map((l) => l.id))
  if (!regels) return <p className="club-melding club-melding--fout" role="alert">De beschikbaarheid kon niet worden geladen.</p>
  const afwezig = regels.filter((r) => r.datum && !r.beschikbaar && (r.datumTot ?? r.datum) >= vandaag).sort((a, b) => (a.datum ?? '').localeCompare(b.datum ?? ''))
  const eigen = regels.filter((r) => r.medewerkerId === gekozen.id)
  const basis = zonderPaneel(staat)

  return (
    <div className="club-personeel-team">
      <nav className="club-kaart club-personeel-teamlijst" aria-label="Medewerkers">
        <ul className="club-lijst">
          {team.map((l) => (
            <li key={l.id}>
              <Link className="club-personeel-teamnaam" data-kleur={l.kleur} href={personeelHref(basis, { mw: l.id })} aria-current={l.id === gekozen.id ? 'page' : undefined} scroll={false}>
                <span className="club-personeel-stip" aria-hidden />
                <span>{l.naam}</span>
                <span className="club-zacht club-getal">{l.contracturen !== null ? `${String(l.contracturen).replace('.', ',')} u` : ''}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="club-personeel-teamdetail">
        <section className="club-kaart" aria-labelledby="club-personeel-afwezig">
          <h2 id="club-personeel-afwezig">Afwezig vanaf vandaag</h2>
          {afwezig.length === 0 ? (
            <p className="club-hint">Niemand heeft verlof, vrij of ziek staan.</p>
          ) : (
            <ul className="club-lijst">
              {afwezig.map((r) => (
                <li key={r.id} className="club-rij">
                  <span className="club-rij-hoofd">
                    <span className="club-rij-titel">{team.find((l) => l.id === r.medewerkerId)?.naam ?? 'Onbekend'}</span>
                    <span className="club-rij-sub">
                      {weekdagKort(r.datum ?? vandaag)} {dagMaand(r.datum ?? vandaag)}
                      {r.datumTot && r.datumTot !== r.datum ? ` tot ${weekdagKort(r.datumTot)} ${dagMaand(r.datumTot)}` : ''}
                      {r.notitie ? ` · ${r.notitie}` : ''}
                    </span>
                  </span>
                  <span className={r.reden === 'ziek' ? 'club-chip club-chip--let-op' : 'club-chip club-chip--info'}>{r.reden ? REDEN_LABEL[r.reden] : 'Niet beschikbaar'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="club-kaart" aria-labelledby="club-personeel-gekozen" data-kleur={gekozen.kleur}>
          <h2 id="club-personeel-gekozen" className="club-personeel-gekozen">
            <span className="club-personeel-stip" aria-hidden /> {gekozen.naam}
          </h2>
          <MedewerkerInstellingen key={`i-${gekozen.id}`} lid={gekozen} />
        </section>
        <VasteWeek key={`v-${gekozen.id}`} medewerkerId={gekozen.id} regels={eigen.filter((r) => r.weekdag !== null)} />
        <LosseDatums key={`l-${gekozen.id}`} medewerkerId={gekozen.id} regels={eigen.filter((r) => r.datum !== null)} vandaag={vandaag} />
      </div>
    </div>
  )
}
