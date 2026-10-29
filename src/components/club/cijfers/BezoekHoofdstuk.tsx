import { eenDecimaal, heel } from '@/lib/club/cijfers/opmaak'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import { maandNaam, vensterNaam } from '@/lib/club/cijfers/maand'
import { dagLang, weekdagNaam } from '@/lib/club/cijfers/tijd'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { Drukte } from './Drukte'
import { Kolommen } from './Kolommen'
import { bereikNaam, bestandsdeel, maandLabels, tekstVan, type CijferContext } from './context'

// Bezoek van de gekozen maand per dag, de 12 maanden ernaast en de drukte per
// uur. Een maand van voor de eerste check-in staat als "geen data", niet als nul.

function PerDag({ c }: { c: CijferContext }) {
  const tk = tekstVan(c)
  const t = tk.bezoek
  const r = c.rapport
  const v = r.huidig.venster
  const totaal = r.huidig.cijfers.bezoek
  const gemiddeld = v.dagen > 0 ? totaal / v.dagen : 0
  const kern = t.perDagKern(heel(totaal, c.taal), eenDecimaal(gemiddeld, c.taal))
  return (
    <CijferBlok
      id="blok-bezoek-dag"
      className="club-k7"
      titel={t.perDag}
      kern={
        <>
          <strong>{kern.totaal}</strong>
          {kern.midden}
          <strong>{kern.gemiddeld}</strong>
          {kern.na}
        </>
      }
      definitie={tk.definities.bezoek}
      csv={{ bestand: csvBestandsnaam('bezoek-per-dag', bestandsdeel(c)), kop: [tk.algemeen.dag, t.csvCheckins], rijen: r.perDag.map((d) => [d.dag, d.aantal]) }}
    >
      <Kolommen
        id="bezoek-dag"
        titel={t.perDagTitel(vensterNaam(v, c.taal), bereikNaam(c))}
        beschrijving={t.perDagUitleg(heel(totaal, c.taal), v.dagen)}
        eenheid={tk.algemeen.checkins}
        labelElke={r.perDag.length > 16 ? 2 : 1}
        taal={c.taal}
        kolommen={r.perDag.map((d) => ({ label: String(Number(d.dag.slice(8, 10))), naam: dagLang(d.dag, c.taal), waarde: d.aantal, zacht: v.lopend && d.dag === c.vandaag }))}
      />
      {v.lopend && (
        <p className="club-cijfers-legenda">
          <span data-reeks="hoofd">{t.heleDag}</span>
          <span data-reeks="zacht">{t.vandaagTotNu}</span>
        </p>
      )}
    </CijferBlok>
  )
}

function PerMaand({ c }: { c: CijferContext }) {
  const tk = tekstVan(c)
  const t = tk.bezoek
  const trend = c.rapport.trend
  const m = maandLabels(trend.map((k) => k.venster.maand), c.taal)
  const vanaf = c.rapport.vanaf.bezoek
  const geen = (tot: string) => vanaf === null || vanaf > tot
  const perLid = c.rapport.huidig.cijfers.bezoekPerLidPerWeek
  return (
    <CijferBlok
      id="blok-bezoek-maand"
      className="club-k5"
      titel={t.perMaand}
      kern={
        <>
          {t.perLidPerWeek} <strong>{perLid === null ? tk.algemeen.geenData : eenDecimaal(perLid, c.taal)}</strong>
        </>
      }
      definitie={tk.definities.bezoekPerLid}
      csv={{
        bestand: csvBestandsnaam('bezoek-per-maand', bestandsdeel(c)),
        kop: [tk.algemeen.maand, t.csvCheckins, t.csvPerLid],
        rijen: trend.map((k) => [k.venster.maand, geen(k.venster.tot) ? null : k.cijfers.bezoek, k.cijfers.bezoekPerLidPerWeek === null ? null : Math.round(k.cijfers.bezoekPerLidPerWeek * 100) / 100]),
      }}
    >
      <Kolommen
        id="bezoek-maand"
        titel={t.perMaandTitel(bereikNaam(c))}
        beschrijving={t.perMaandUitleg(maandNaam(trend[0].venster.maand, c.taal), maandNaam(c.maand, c.taal))}
        eenheid={tk.algemeen.checkins}
        taal={c.taal}
        kolommen={trend.map((k, i) => ({ label: m.labels[i], naam: m.namen[i], waarde: k.cijfers.bezoek, zacht: k.venster.lopend || (vanaf !== null && vanaf > k.venster.van), geenData: geen(k.venster.tot) }))}
      />
    </CijferBlok>
  )
}

export function BezoekHoofdstuk({ c }: { c: CijferContext }) {
  const tk = tekstVan(c)
  const t = tk.bezoek
  const r = c.rapport
  const piek = r.piek
  const piekTekst = piek ? t.piekTekst(weekdagNaam(piek.weekdag, c.taal), piek.uur) : t.geenBezoek
  return (
    <Hoofdstuk nummer="02" titel={t.hoofdstuk}>
      <PerDag c={c} />
      <PerMaand c={c} />
      <CijferBlok
        id="blok-drukte"
        className="club-cijfers-volle"
        titel={t.drukte}
        kern={
          <>
            {t.piek}
            <strong>{piekTekst}</strong>
          </>
        }
        definitie={tk.definities.drukte}
        csv={{
          bestand: csvBestandsnaam('drukte-per-uur', bestandsdeel(c)),
          kop: [t.weekdag, ...Array.from({ length: 24 }, (_, u) => `${u}:00`)],
          rijen: r.drukte.map((rij, d) => [tk.drukte.weekdagKort[d], ...rij]),
        }}
      >
        <Drukte raster={r.drukte} uren={r.uren} beschrijving={t.drukst(piekTekst)} taal={c.taal} />
      </CijferBlok>
    </Hoofdstuk>
  )
}
