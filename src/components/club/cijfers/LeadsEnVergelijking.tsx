import { DEFINITIES } from '@/lib/club/cijfers/definities'
import { eenDecimaal, heel, metTeken, procent } from '@/lib/club/cijfers/opmaak'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import { vensterNaam } from '@/lib/club/cijfers/maand'
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
          leeg="In deze maand kwamen er geen leads binnen."
        />
      </CijferBlok>
    </Hoofdstuk>
  )
}

export function Vergelijking({ c }: { c: CijferContext }) {
  const rijen = c.rapport.vergelijking
  const naam = vensterNaam(c.rapport.huidig.venster)
  return (
    <Hoofdstuk nummer="05" titel="Vestigingen naast elkaar">
      <CijferBlok
        id="blok-vergelijking"
        className="club-cijfers-volle"
        titel={`${rijen.length === 1 ? 'De vestiging' : `Alle ${rijen.length} vestigingen`}, ${naam}`}
        definitie={DEFINITIES.vestigingen}
        csv={{
          bestand: csvBestandsnaam('vestigingen-vergelijking', c.maand),
          kop: ['Vestiging', 'Ledenbestand eind', 'Groei', 'Bezoeken', 'Bezoek per lid per week', 'Bezetting %', 'No-show %', 'Leads', 'Conversie %'],
          rijen: rijen.map(({ label, cijfers: v }) => [
            label,
            v.bestandEind,
            v.groei,
            v.bezoek,
            v.bezoekPerLidPerWeek === null ? null : Math.round(v.bezoekPerLidPerWeek * 100) / 100,
            pct(v.bezetting),
            pct(v.noShow),
            v.leads,
            pct(v.conversie),
          ]),
        }}
      >
        <div className="club-tabel-wrap club-cijfers-vergelijk">
          <table className="club-tabel">
            <caption className="club-sr">Vergelijking van alle vestigingen, {naam}</caption>
            <thead>
              <tr>
                <th scope="col">Vestiging</th>
                <th scope="col" className="club-cijfers-rechts">Leden</th>
                <th scope="col" className="club-cijfers-rechts">Groei</th>
                <th scope="col" className="club-cijfers-rechts">Bezoeken</th>
                <th scope="col" className="club-cijfers-rechts">Per lid/week</th>
                <th scope="col" className="club-cijfers-rechts">Bezetting</th>
                <th scope="col" className="club-cijfers-rechts">No-show</th>
                <th scope="col" className="club-cijfers-rechts">Leads</th>
                <th scope="col" className="club-cijfers-rechts">Conversie</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map(({ vestiging, label, cijfers: v }) => (
                <tr key={vestiging} aria-current={c.bereik === 'vestiging' && vestiging === c.vestiging ? 'true' : undefined}>
                  <th scope="row">{label}</th>
                  <td className="club-cijfers-rechts club-getal">{heel(v.bestandEind)}</td>
                  <td className={`club-cijfers-rechts club-getal ${v.groei > 0 ? 'club-plus' : v.groei < 0 ? 'club-min' : ''}`}>{metTeken(v.groei)}</td>
                  <td className="club-cijfers-rechts club-getal">{heel(v.bezoek)}</td>
                  <td className="club-cijfers-rechts club-getal">{v.bezoekPerLidPerWeek === null ? 'geen data' : eenDecimaal(v.bezoekPerLidPerWeek)}</td>
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
