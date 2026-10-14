import { DEFINITIES } from '@/lib/club/cijfers/definities'
import { heel, metTeken, procent } from '@/lib/club/cijfers/opmaak'
import { som } from '@/lib/club/cijfers/bezoek'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import type { Verdeling } from '@/lib/club/cijfers/leden'
import { BalkTabel } from './BalkTabel'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { GroeiGrafiek } from './GroeiGrafiek'
import { bereikNaam, bestandsdeel, weekLabels, type CijferContext } from './context'

function verdelingRijen(v: Verdeling[]) {
  const totaal = Math.max(1, som(v.map((x) => x.aantal)))
  const max = Math.max(1, ...v.map((x) => x.aantal))
  return v.map((x) => ({ label: x.label, deel: x.aantal / max, waarde: procent(x.aantal / totaal), extra: [heel(x.aantal)] }))
}

export function LedenHoofdstuk({ c }: { c: CijferContext }) {
  const r = c.rapport
  const w = weekLabels(c.maandagen)
  const instroom = som(r.stroom.instroom)
  const uitstroom = som(r.stroom.uitstroom)
  const deel = bestandsdeel(c)
  return (
    <Hoofdstuk nummer="01" titel="Leden">
      <CijferBlok
        id="blok-groei"
        className="club-k8"
        titel="Ledenbestand en groei"
        kern={
          <>
            <strong>{metTeken(instroom)}</strong> in · <strong>{metTeken(-uitstroom)}</strong> uit
          </>
        }
        definitie={`${DEFINITIES.ledenbestand} ${DEFINITIES.stroom}`}
        csv={{
          bestand: csvBestandsnaam('ledenbestand', deel),
          kop: ['Week (maandag)', 'Ledenbestand', 'Instroom', 'Uitstroom'],
          rijen: c.maandagen.map((m, i) => [m, r.ledenbestand[i], r.stroom.instroom[i], r.stroom.uitstroom[i]]),
        }}
      >
        <GroeiGrafiek labels={w.labels} namen={w.namen} bestand={r.ledenbestand} instroom={r.stroom.instroom} uitstroom={r.stroom.uitstroom} labelElke={w.labelElke} />
      </CijferBlok>
      <div className="club-k4 club-cijfers-stapel">
        <CijferBlok
          id="blok-leeftijd"
          titel="Leeftijd"
          definitie={DEFINITIES.demografie}
          csv={{ bestand: csvBestandsnaam('leeftijd', deel), kop: ['Leeftijd', 'Leden'], rijen: r.leeftijd.map((v) => [v.label, v.aantal]) }}
        >
          <BalkTabel bijschrift={`Leeftijd van actieve leden, ${bereikNaam(c)}`} kolomLabel="Leeftijd" waardeLabel="Aandeel" extraLabels={['Leden']} rijen={verdelingRijen(r.leeftijd)} leeg="Geen actieve leden." />
        </CijferBlok>
        <CijferBlok
          id="blok-geslacht"
          titel="Geslacht"
          definitie="Zoals vastgelegd bij het lid. Onbekend = niet ingevuld."
          csv={{ bestand: csvBestandsnaam('geslacht', deel), kop: ['Geslacht', 'Leden'], rijen: r.geslacht.map((v) => [v.label, v.aantal]) }}
        >
          <BalkTabel bijschrift={`Geslacht van actieve leden, ${bereikNaam(c)}`} kolomLabel="Geslacht" waardeLabel="Aandeel" extraLabels={['Leden']} rijen={verdelingRijen(r.geslacht)} leeg="Geen actieve leden." />
        </CijferBlok>
      </div>
    </Hoofdstuk>
  )
}
