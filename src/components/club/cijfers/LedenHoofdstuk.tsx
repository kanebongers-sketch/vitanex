import { heel, metTeken, procent } from '@/lib/club/cijfers/opmaak'
import { som } from '@/lib/club/cijfers/bezoek'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import type { Verdeling } from '@/lib/club/cijfers/leden'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { CIJFERS } from '@/lib/aiyourgym/taal/woorden/club/cijfers'
import { BalkTabel } from './BalkTabel'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { GroeiGrafiek } from './GroeiGrafiek'
import { bereikNaam, bestandsdeel, maandLabels, tekstVan, type CijferContext } from './context'

/** Het label van een groep (leeftijd of geslacht) in de gekozen taal; onbekend label blijft zoals het is. */
function groepLabel(label: string, taal: Taal): string {
  const lijst: Readonly<Record<string, string>> = CIJFERS[taal].leden.verdeling
  return lijst[label] ?? label
}

function verdelingRijen(v: Verdeling[], taal: Taal) {
  const totaal = Math.max(1, som(v.map((x) => x.aantal)))
  const max = Math.max(1, ...v.map((x) => x.aantal))
  return v.map((x) => ({ label: groepLabel(x.label, taal), deel: x.aantal / max, waarde: procent(x.aantal / totaal, taal), extra: [heel(x.aantal, taal)] }))
}

export function LedenHoofdstuk({ c }: { c: CijferContext }) {
  const tk = tekstVan(c)
  const t = tk.leden
  const r = c.rapport
  const trend = r.trend
  const m = maandLabels(trend.map((k) => k.venster.maand), c.taal)
  const bestand = trend.map((k) => k.cijfers.bestandEind)
  const instroom = trend.map((k) => k.cijfers.instroom)
  const uitstroom = trend.map((k) => k.cijfers.uitstroom)
  const h = r.huidig.cijfers
  const deel = bestandsdeel(c)
  return (
    <Hoofdstuk nummer="01" titel={t.hoofdstuk}>
      <CijferBlok
        id="blok-groei"
        className="club-k8"
        titel={t.groeiTitel}
        kern={
          <>
            {t.dezeMaand} <strong>{metTeken(h.instroom, c.taal)}</strong> {t.in} · <strong>{metTeken(-h.uitstroom, c.taal)}</strong> {t.uit}
          </>
        }
        definitie={`${tk.definities.ledenbestand} ${tk.definities.stroom}`}
        csv={{
          bestand: csvBestandsnaam('ledenbestand-per-maand', deel),
          kop: [tk.algemeen.maand, t.csvBegin, t.csvEind, tk.groei.instroom, tk.groei.uitstroom, tk.tegels.groei],
          rijen: trend.map((k) => [k.venster.maand, k.cijfers.bestandBegin, k.cijfers.bestandEind, k.cijfers.instroom, k.cijfers.uitstroom, k.cijfers.groei]),
        }}
      >
        <GroeiGrafiek labels={m.labels} namen={m.namen} bestand={bestand} instroom={instroom} uitstroom={uitstroom} labelElke={1} zacht={trend.map((k) => k.venster.lopend)} taal={c.taal} />
      </CijferBlok>
      <div className="club-k4 club-cijfers-stapel">
        <CijferBlok
          id="blok-leeftijd"
          titel={t.leeftijd}
          definitie={tk.definities.demografie}
          csv={{ bestand: csvBestandsnaam('leeftijd', deel), kop: [t.leeftijd, t.ledenKolom], rijen: r.leeftijd.map((v) => [groepLabel(v.label, c.taal), v.aantal]) }}
        >
          <BalkTabel bijschrift={t.leeftijdBijschrift(bereikNaam(c))} kolomLabel={t.leeftijd} waardeLabel={t.aandeel} extraLabels={[t.ledenKolom]} rijen={verdelingRijen(r.leeftijd, c.taal)} leeg={t.geenActief} />
        </CijferBlok>
        <CijferBlok
          id="blok-geslacht"
          titel={t.geslacht}
          definitie={t.geslachtUitleg}
          csv={{ bestand: csvBestandsnaam('geslacht', deel), kop: [t.geslacht, t.ledenKolom], rijen: r.geslacht.map((v) => [groepLabel(v.label, c.taal), v.aantal]) }}
        >
          <BalkTabel bijschrift={t.geslachtBijschrift(bereikNaam(c))} kolomLabel={t.geslacht} waardeLabel={t.aandeel} extraLabels={[t.ledenKolom]} rijen={verdelingRijen(r.geslacht, c.taal)} leeg={t.geenActief} />
        </CijferBlok>
      </div>
    </Hoofdstuk>
  )
}
