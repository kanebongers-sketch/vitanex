import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalBeschikbaarheid } from '@/lib/club/personeel/opslag'
import { personeelHref, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import type { PersoneelLid } from '@/lib/club/personeel/typen'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'
import { MedewerkerInstellingen } from './MedewerkerInstellingen'
import { VasteWeek } from './VasteWeek'
import { LosseDatums } from './LosseDatums'
import { dagMaand, weekdagKort } from './weergave'
import { Avatar } from '@/components/club/ontwerp/Avatar'

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
  const taal = await getTaal()
  const alles = await clubTekst(PERSONEEL)
  const tk = alles.team
  if (team.length === 0) return <p className="club-leeg">{tk.geenMedewerkers}</p>
  const gekozen = team.find((l) => l.id === staat.mw) ?? team[0]
  const regels = await haalBeschikbaarheid(t.admin, t.userId, team.map((l) => l.id))
  if (!regels) return <p className="club-melding club-melding--fout" role="alert">{tk.laadFout}</p>
  const afwezig = regels.filter((r) => r.datum && !r.beschikbaar && (r.datumTot ?? r.datum) >= vandaag).sort((a, b) => (a.datum ?? '').localeCompare(b.datum ?? ''))
  const eigen = regels.filter((r) => r.medewerkerId === gekozen.id)
  const basis = zonderPaneel(staat)

  return (
    <div className="club-personeel-team">
      <nav className="club-kaart club-personeel-teamlijst" aria-label={tk.medewerkers}>
        <ul className="club-lijst">
          {team.map((l) => (
            <li key={l.id}>
              <Link className="club-personeel-teamnaam" data-kleur={l.kleur} href={personeelHref(basis, { mw: l.id })} aria-current={l.id === gekozen.id ? 'page' : undefined} scroll={false}>
                <Avatar naam={l.naam} foto={{ soort: 'mw', id: l.id, versie: l.foto }} maat={28} className="club-avatar club-personeel-teamfoto" />
                <span>{l.naam}</span>
                <span className="club-zacht club-getal">{l.contracturen !== null ? tk.urenKort(taal === 'nl' ? String(l.contracturen).replace('.', ',') : String(l.contracturen)) : ''}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="club-personeel-teamdetail">
        <section className="club-kaart" aria-labelledby="club-personeel-afwezig">
          <h2 id="club-personeel-afwezig">{tk.afwezig}</h2>
          {afwezig.length === 0 ? (
            <p className="club-hint">{tk.niemandAfwezig}</p>
          ) : (
            <ul className="club-lijst">
              {afwezig.map((r) => (
                <li key={r.id} className="club-rij">
                  <span className="club-rij-hoofd">
                    <span className="club-rij-titel">{team.find((l) => l.id === r.medewerkerId)?.naam ?? alles.algemeen.onbekend}</span>
                    <span className="club-rij-sub">
                      {weekdagKort(r.datum ?? vandaag, taal)} {dagMaand(r.datum ?? vandaag, taal)}
                      {r.datumTot && r.datumTot !== r.datum ? tk.totDag(`${weekdagKort(r.datumTot, taal)} ${dagMaand(r.datumTot, taal)}`) : ''}
                      {r.notitie ? ` · ${r.notitie}` : ''}
                    </span>
                  </span>
                  <span className={r.reden === 'ziek' ? 'club-chip club-chip--let-op' : 'club-chip club-chip--info'}>{r.reden ? alles.labels.reden[r.reden] : tk.nietBeschikbaar}</span>
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
