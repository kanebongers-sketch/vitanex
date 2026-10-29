import { eenDecimaal, heel, metTeken, procent } from '@/lib/club/cijfers/opmaak'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import { vensterNaam } from '@/lib/club/cijfers/maand'
import type { Conversie } from '@/lib/club/cijfers/leads'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { CIJFERS } from '@/lib/aiyourgym/taal/woorden/club/cijfers'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import { BalkTabel } from './BalkTabel'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { bereikNaam, bestandsdeel, tekstVan, type CijferContext } from './context'

function pct(v: number | null): number | null {
  return v === null ? null : Math.round(v * 1000) / 10
}

/** De naam van de bron in de gekozen taal (de totaalregel heet Totaal). */
function bronLabel(b: Pick<Conversie, 'bron' | 'label'>, taal: Taal): string {
  if (b.bron === 'totaal') return CIJFERS[taal].algemeen.totaal
  return LEADS[taal].bron[b.bron] ?? b.label
}

export function LeadsHoofdstuk({ c }: { c: CijferContext }) {
  const tk = tekstVan(c)
  const t = tk.leads
  const { perBron, totaal } = c.rapport.leads
  const max = Math.max(0.0001, ...perBron.map((b) => b.conversie))
  const kern = t.kern(heel(totaal.leads, c.taal), totaal.leads > 0 ? procent(totaal.conversie, c.taal) : tk.algemeen.geenData)
  return (
    <Hoofdstuk nummer="04" titel={t.hoofdstuk}>
      <CijferBlok
        id="blok-leads"
        className="club-cijfers-volle"
        titel={t.perBron}
        kern={
          <>
            <strong>{kern.leads}</strong>
            {kern.midden}
            <strong>{kern.conversie}</strong>
            {kern.na}
          </>
        }
        definitie={tk.definities.leads}
        csv={{
          bestand: csvBestandsnaam('leadconversie', bestandsdeel(c)),
          kop: [...t.csvKop],
          rijen: [...perBron, totaal].map((b) => [bronLabel(b, c.taal), b.leads, b.proefles, b.lid, b.verloren, b.open, pct(b.conversie)]),
        }}
      >
        <BalkTabel
          bijschrift={t.bijschrift(bereikNaam(c))}
          kolomLabel={t.bron}
          waardeLabel={t.conversie}
          extraLabels={[...t.kolommen]}
          rijen={perBron.map((b) => ({
            label: bronLabel(b, c.taal),
            deel: b.conversie / max,
            waarde: procent(b.conversie, c.taal),
            extra: [heel(b.leads, c.taal), heel(b.proefles, c.taal), heel(b.lid, c.taal), heel(b.open, c.taal)],
          }))}
          leeg={t.leeg}
        />
      </CijferBlok>
    </Hoofdstuk>
  )
}

export function Vergelijking({ c }: { c: CijferContext }) {
  const tk = tekstVan(c)
  const t = tk.vestigingen
  const rijen = c.rapport.vergelijking
  const naam = vensterNaam(c.rapport.huidig.venster, c.taal)
  return (
    <Hoofdstuk nummer="05" titel={t.hoofdstuk}>
      <CijferBlok
        id="blok-vergelijking"
        className="club-cijfers-volle"
        titel={t.titel(rijen.length, naam)}
        definitie={tk.definities.vestigingen}
        csv={{
          bestand: csvBestandsnaam('vestigingen-vergelijking', c.maand),
          kop: [...t.csvKop],
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
            <caption className="club-sr">{t.bijschrift(naam)}</caption>
            <thead>
              <tr>
                <th scope="col">{t.vestiging}</th>
                <th scope="col" className="club-cijfers-rechts">{t.leden}</th>
                <th scope="col" className="club-cijfers-rechts">{t.groei}</th>
                <th scope="col" className="club-cijfers-rechts">{t.bezoeken}</th>
                <th scope="col" className="club-cijfers-rechts">{t.perLid}</th>
                <th scope="col" className="club-cijfers-rechts">{t.bezetting}</th>
                <th scope="col" className="club-cijfers-rechts">{t.noShow}</th>
                <th scope="col" className="club-cijfers-rechts">{t.leads}</th>
                <th scope="col" className="club-cijfers-rechts">{t.conversie}</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map(({ vestiging, label, cijfers: v }) => (
                <tr key={vestiging} aria-current={c.bereik === 'vestiging' && vestiging === c.vestiging ? 'true' : undefined}>
                  <th scope="row">{label}</th>
                  <td className="club-cijfers-rechts club-getal">{heel(v.bestandEind, c.taal)}</td>
                  <td className={`club-cijfers-rechts club-getal ${v.groei > 0 ? 'club-plus' : v.groei < 0 ? 'club-min' : ''}`}>{metTeken(v.groei, c.taal)}</td>
                  <td className="club-cijfers-rechts club-getal">{heel(v.bezoek, c.taal)}</td>
                  <td className="club-cijfers-rechts club-getal">{v.bezoekPerLidPerWeek === null ? tk.algemeen.geenData : eenDecimaal(v.bezoekPerLidPerWeek, c.taal)}</td>
                  <td className="club-cijfers-rechts club-getal">{procent(v.bezetting, c.taal)}</td>
                  <td className="club-cijfers-rechts club-getal">{procent(v.noShow, c.taal)}</td>
                  <td className="club-cijfers-rechts club-getal">{heel(v.leads, c.taal)}</td>
                  <td className="club-cijfers-rechts club-getal">{procent(v.conversie, c.taal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CijferBlok>
    </Hoofdstuk>
  )
}
