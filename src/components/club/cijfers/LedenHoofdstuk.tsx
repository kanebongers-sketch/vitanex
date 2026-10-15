import { DEFINITIES } from '@/lib/club/cijfers/definities'
import { heel, metTeken, procent } from '@/lib/club/cijfers/opmaak'
import { som } from '@/lib/club/cijfers/bezoek'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import type { Verdeling } from '@/lib/club/cijfers/leden'
import { BalkTabel } from './BalkTabel'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { GroeiGrafiek } from './GroeiGrafiek'
import { bereikNaam, bestandsdeel, maandLabels, type CijferContext } from './context'

function verdelingRijen(v: Verdeling[]) {
  const totaal = Math.max(1, som(v.map((x) => x.aantal)))
  const max = Math.max(1, ...v.map((x) => x.aantal))
  return v.map((x) => ({ label: x.label, deel: x.aantal / max, waarde: procent(x.aantal / totaal), extra: [heel(x.aantal)] }))
}

export function LedenHoofdstuk({ c }: { c: CijferContext }) {
  const r = c.rapport
  const trend = r.trend
  const m = maandLabels(trend.map((k) => k.venster.maand))
  const bestand = trend.map((k) => k.cijfers.bestandEind)
  const instroom = trend.map((k) => k.cijfers.instroom)
  const uitstroom = trend.map((k) => k.cijfers.uitstroom)
  const h = r.huidig.cijfers
  const deel = bestandsdeel(c)
  return (
    <Hoofdstuk nummer="01" titel="Leden">
      <CijferBlok
        id="blok-groei"
        className="club-k8"
        titel="Ledenbestand, 12 maanden"
        kern={
          <>
            Deze maand <strong>{metTeken(h.instroom)}</strong> in · <strong>{metTeken(-h.uitstroom)}</strong> uit
          </>
        }
        definitie={`${DEFINITIES.ledenbestand} ${DEFINITIES.stroom}`}
        csv={{
          bestand: csvBestandsnaam('ledenbestand-per-maand', deel),
          kop: ['Maand', 'Ledenbestand begin', 'Ledenbestand eind', 'Instroom', 'Uitstroom', 'Groei'],
          rijen: trend.map((k) => [k.venster.maand, k.cijfers.bestandBegin, k.cijfers.bestandEind, k.cijfers.instroom, k.cijfers.uitstroom, k.cijfers.groei]),
        }}
      >
        <GroeiGrafiek
          labels={m.labels}
          namen={m.namen}
          bestand={bestand}
          instroom={instroom}
          uitstroom={uitstroom}
          labelElke={1}
          zacht={trend.map((k) => k.venster.lopend)}
        />
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
