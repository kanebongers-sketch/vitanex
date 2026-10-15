import { DEFINITIES } from '@/lib/club/cijfers/definities'
import { eenDecimaal, heel } from '@/lib/club/cijfers/opmaak'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import { maandNaam, vensterNaam } from '@/lib/club/cijfers/maand'
import { dagLang, WEEKDAG_KORT, weekdagNaam } from '@/lib/club/cijfers/tijd'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { Drukte } from './Drukte'
import { Kolommen } from './Kolommen'
import { bereikNaam, bestandsdeel, maandLabels, type CijferContext } from './context'

// Bezoek van de gekozen maand per dag, de 12 maanden ernaast en de drukte per
// uur. Een maand van voor de eerste check-in staat als "geen data", niet als nul.

function PerDag({ c }: { c: CijferContext }) {
  const r = c.rapport
  const v = r.huidig.venster
  const totaal = r.huidig.cijfers.bezoek
  const gemiddeld = v.dagen > 0 ? totaal / v.dagen : 0
  return (
    <CijferBlok
      id="blok-bezoek-dag"
      className="club-k7"
      titel="Bezoek per dag"
      kern={
        <>
          <strong>{heel(totaal)}</strong> check-ins · gemiddeld <strong>{eenDecimaal(gemiddeld)}</strong> per dag
        </>
      }
      definitie={DEFINITIES.bezoek}
      csv={{ bestand: csvBestandsnaam('bezoek-per-dag', bestandsdeel(c)), kop: ['Dag', 'Check-ins'], rijen: r.perDag.map((d) => [d.dag, d.aantal]) }}
    >
      <Kolommen
        id="bezoek-dag"
        titel={`Bezoek per dag, ${vensterNaam(v)}, ${bereikNaam(c)}`}
        beschrijving={`${heel(totaal)} check-ins in ${v.dagen} dagen.`}
        eenheid="check-ins"
        labelElke={r.perDag.length > 16 ? 2 : 1}
        kolommen={r.perDag.map((d) => ({ label: String(Number(d.dag.slice(8, 10))), naam: dagLang(d.dag), waarde: d.aantal, zacht: v.lopend && d.dag === c.vandaag }))}
      />
      {v.lopend && (
        <p className="club-cijfers-legenda">
          <span data-reeks="hoofd">Hele dag</span>
          <span data-reeks="zacht">Vandaag, tot nu</span>
        </p>
      )}
    </CijferBlok>
  )
}

function PerMaand({ c }: { c: CijferContext }) {
  const trend = c.rapport.trend
  const m = maandLabels(trend.map((k) => k.venster.maand))
  const vanaf = c.rapport.vanaf.bezoek
  const geen = (tot: string) => vanaf === null || vanaf > tot
  return (
    <CijferBlok
      id="blok-bezoek-maand"
      className="club-k5"
      titel="Bezoek per maand"
      kern={
        <>
          Per lid per week <strong>{c.rapport.huidig.cijfers.bezoekPerLidPerWeek === null ? 'geen data' : eenDecimaal(c.rapport.huidig.cijfers.bezoekPerLidPerWeek)}</strong>
        </>
      }
      definitie={DEFINITIES.bezoekPerLid}
      csv={{
        bestand: csvBestandsnaam('bezoek-per-maand', bestandsdeel(c)),
        kop: ['Maand', 'Check-ins', 'Bezoek per lid per week'],
        rijen: trend.map((k) => [k.venster.maand, geen(k.venster.tot) ? null : k.cijfers.bezoek, k.cijfers.bezoekPerLidPerWeek === null ? null : Math.round(k.cijfers.bezoekPerLidPerWeek * 100) / 100]),
      }}
    >
      <Kolommen
        id="bezoek-maand"
        titel={`Bezoek per maand, ${bereikNaam(c)}`}
        beschrijving={`Check-ins per kalendermaand, van ${maandNaam(trend[0].venster.maand)} tot en met ${maandNaam(c.maand)}. Lichter = nog niet compleet.`}
        eenheid="check-ins"
        kolommen={trend.map((k, i) => ({ label: m.labels[i], naam: m.namen[i], waarde: k.cijfers.bezoek, zacht: k.venster.lopend || (vanaf !== null && vanaf > k.venster.van), geenData: geen(k.venster.tot) }))}
      />
    </CijferBlok>
  )
}

export function BezoekHoofdstuk({ c }: { c: CijferContext }) {
  const r = c.rapport
  const piek = r.piek
  const piekTekst = piek ? `${weekdagNaam(piek.weekdag)} ${piek.uur}:00 tot ${piek.uur + 1}:00` : 'geen bezoek'
  return (
    <Hoofdstuk nummer="02" titel="Bezoek">
      <PerDag c={c} />
      <PerMaand c={c} />
      <CijferBlok
        id="blok-drukte"
        className="club-cijfers-volle"
        titel="Drukte per uur en weekdag"
        kern={
          <>
            Piek: <strong>{piekTekst}</strong>
          </>
        }
        definitie={DEFINITIES.drukte}
        csv={{
          bestand: csvBestandsnaam('drukte-per-uur', bestandsdeel(c)),
          kop: ['Weekdag', ...Array.from({ length: 24 }, (_, u) => `${u}:00`)],
          rijen: r.drukte.map((rij, d) => [WEEKDAG_KORT[d], ...rij]),
        }}
      >
        <Drukte raster={r.drukte} uren={r.uren} beschrijving={`Het drukst is het op ${piekTekst}.`} />
      </CijferBlok>
    </Hoofdstuk>
  )
}
