import { DEFINITIES } from '@/lib/club/cijfers/definities'
import { heel } from '@/lib/club/cijfers/opmaak'
import { som } from '@/lib/club/cijfers/bezoek'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import { WEEKDAG_KORT, weekdagNaam } from '@/lib/club/cijfers/tijd'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { Drukte } from './Drukte'
import { Kolommen } from './Kolommen'
import { bereikNaam, bestandsdeel, weekLabels, type CijferContext } from './context'

export function BezoekHoofdstuk({ c }: { c: CijferContext }) {
  const r = c.rapport
  const w = weekLabels(c.maandagen)
  const deel = bestandsdeel(c)
  const totaal = som(r.bezoek)
  const piek = r.piek
  const piekTekst = piek ? `${weekdagNaam(piek.weekdag)} ${piek.uur}:00 tot ${piek.uur + 1}:00` : 'geen bezoek'
  return (
    <Hoofdstuk nummer="02" titel="Bezoek">
      <CijferBlok
        id="blok-bezoek"
        className="club-k5"
        titel="Bezoek per week"
        kern={
          <>
            <strong>{heel(totaal)}</strong> check-ins
          </>
        }
        definitie={DEFINITIES.bezoek}
        csv={{ bestand: csvBestandsnaam('bezoek-per-week', deel), kop: ['Week (maandag)', 'Check-ins'], rijen: c.maandagen.map((m, i) => [m, r.bezoek[i]]) }}
      >
        <Kolommen
          id="bezoek"
          titel={`Bezoek per week, ${bereikNaam(c)}`}
          beschrijving={`${heel(totaal)} check-ins in ${c.weken} weken, gemiddeld ${heel(r.bezoekGemiddeld)} per complete week.`}
          eenheid="check-ins"
          labelElke={w.labelElke}
          kolommen={c.maandagen.map((m, i) => ({ label: w.labels[i], naam: w.namen[i], waarde: r.bezoek[i], zacht: i === c.maandagen.length - 1 }))}
        />
        <p className="club-cijfers-legenda">
          <span data-reeks="hoofd">Complete week</span>
          <span data-reeks="zacht">Lopende week</span>
        </p>
      </CijferBlok>
      <CijferBlok
        id="blok-drukte"
        className="club-k7"
        titel="Drukte per uur en weekdag"
        kern={
          <>
            Piek: <strong>{piekTekst}</strong>
          </>
        }
        definitie={DEFINITIES.drukte}
        csv={{
          bestand: csvBestandsnaam('drukte-per-uur', deel),
          kop: ['Weekdag', ...Array.from({ length: 24 }, (_, u) => `${u}:00`)],
          rijen: r.drukte.map((rij, d) => [WEEKDAG_KORT[d], ...rij]),
        }}
      >
        <Drukte raster={r.drukte} uren={r.uren} beschrijving={`Het drukst is het op ${piekTekst}.`} />
      </CijferBlok>
    </Hoofdstuk>
  )
}
