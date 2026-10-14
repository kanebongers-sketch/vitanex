import { DEFINITIES } from '@/lib/club/cijfers/definities'
import { eenDecimaal, heel, metTeken, procent } from '@/lib/club/cijfers/opmaak'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import { BalkTabel } from './BalkTabel'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { bereikNaam, bestandsdeel, type CijferContext } from './context'

function pct(v: number | null): number | null {
  return v === null ? null : Math.round(v * 1000) / 10
}

export function LeadsHoofdstuk({ c }: { c: CijferContext }) {
  const { perBron, totaal } = c.rapport.leads
  const max = Math.max(0.0001, ...perBron.map((b) => b.conversie))
  return (
    <Hoofdstuk nummer="04" titel="Leads">
      <CijferBlok
        id="blok-leads"
        className="club-cijfers-volle"
        titel="Leadconversie per bron"
        kern={
          <>
            <strong>{heel(totaal.leads)}</strong> leads · <strong>{totaal.leads > 0 ? procent(totaal.conversie) : 'geen data'}</strong> werd lid
          </>
        }
        definitie={DEFINITIES.leads}
        csv={{
          bestand: csvBestandsnaam('leadconversie', bestandsdeel(c)),
          kop: ['Bron', 'Leads', 'Proefles', 'Lid', 'Verloren', 'Open', 'Conversie %'],
          rijen: [...perBron, totaal].map((b) => [b.label, b.leads, b.proefles, b.lid, b.verloren, b.open, pct(b.conversie)]),
        }}
      >
        <BalkTabel
          bijschrift={`Leadconversie per bron, ${bereikNaam(c)}`}
          kolomLabel="Bron"
          waardeLabel="Conversie"
          extraLabels={['Leads', 'Proefles', 'Lid', 'Open']}
          rijen={perBron.map((b) => ({
            label: b.label,
            deel: b.conversie / max,
            waarde: procent(b.conversie),
            extra: [heel(b.leads), heel(b.proefles), heel(b.lid), heel(b.open)],
          }))}
          leeg="In deze periode kwamen er geen leads binnen."
        />
      </CijferBlok>
    </Hoofdstuk>
  )
}

export function Vergelijking({ c }: { c: CijferContext }) {
  const rijen = c.rapport.vergelijking
  return (
    <Hoofdstuk nummer="05" titel="Vestigingen naast elkaar">
      <CijferBlok
        id="blok-vergelijking"
        className="club-cijfers-volle"
        titel={`Alle 8 vestigingen, laatste ${c.weken} weken`}
        definitie={`${DEFINITIES.vergelijking} ${DEFINITIES.actief}`}
        csv={{
          bestand: csvBestandsnaam('vestigingen-vergelijking', `${c.weken}w`),
          kop: ['Vestiging', 'Actieve leden', 'Groei', 'Bezoek per week', 'Bezoek per lid per week', 'Bezetting %', 'No-show %', 'Leads', 'Conversie %'],
          rijen: rijen.map((v) => [v.label, v.actief, v.groei, Math.round(v.bezoekPerWeek), v.bezoekPerLid, pct(v.bezetting), pct(v.noShow), v.leads, pct(v.conversie)]),
        }}
      >
        <div className="club-tabel-wrap club-cijfers-vergelijk">
          <table className="club-tabel">
            <caption className="club-sr">Vergelijking van alle vestigingen</caption>
            <thead>
              <tr>
                <th scope="col">Vestiging</th>
                <th scope="col" className="club-cijfers-rechts">Actief</th>
                <th scope="col" className="club-cijfers-rechts">Groei</th>
                <th scope="col" className="club-cijfers-rechts">Bezoek/week</th>
                <th scope="col" className="club-cijfers-rechts">Per lid</th>
                <th scope="col" className="club-cijfers-rechts">Bezetting</th>
                <th scope="col" className="club-cijfers-rechts">No-show</th>
                <th scope="col" className="club-cijfers-rechts">Leads</th>
                <th scope="col" className="club-cijfers-rechts">Conversie</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((v) => (
                <tr key={v.vestiging} aria-current={v.vestiging === c.vestiging ? 'true' : undefined}>
                  <th scope="row">{v.label}</th>
                  <td className="club-cijfers-rechts club-getal">{heel(v.actief)}</td>
                  <td className={`club-cijfers-rechts club-getal ${v.groei > 0 ? 'club-plus' : v.groei < 0 ? 'club-min' : ''}`}>{metTeken(v.groei)}</td>
                  <td className="club-cijfers-rechts club-getal">{heel(v.bezoekPerWeek)}</td>
                  <td className="club-cijfers-rechts club-getal">{v.bezoekPerLid === null ? 'geen data' : eenDecimaal(v.bezoekPerLid)}</td>
                  <td className="club-cijfers-rechts club-getal">{procent(v.bezetting)}</td>
                  <td className="club-cijfers-rechts club-getal">{procent(v.noShow)}</td>
                  <td className="club-cijfers-rechts club-getal">{heel(v.leads)}</td>
                  <td className="club-cijfers-rechts club-getal">{procent(v.conversie)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CijferBlok>
    </Hoofdstuk>
  )
}
