import { heel, procent } from '@/lib/club/cijfers/opmaak'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import type { BezettingGroep } from '@/lib/club/cijfers/lessen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { BalkTabel } from './BalkTabel'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { bereikNaam, bestandsdeel, tekstVan, type CijferContext } from './context'

function bezettingRijen(groepen: BezettingGroep[], taal: Taal) {
  return groepen.map((g) => ({ label: g.label, deel: g.bezetting, waarde: procent(g.bezetting, taal), extra: [heel(g.lessen, taal)], nadruk: g.bezetting >= 0.9 }))
}

function bezettingCsv(groepen: BezettingGroep[]) {
  return groepen.map((g) => [g.label, g.lessen, g.bezet, g.capaciteit, Math.round(g.bezetting * 1000) / 10])
}

export function LessenHoofdstuk({ c }: { c: CijferContext }) {
  const tk = tekstVan(c)
  const t = tk.lessen
  const r = c.rapport
  const deel = bestandsdeel(c)
  const wl = r.wachtlijst
  const h = r.huidig.cijfers
  return (
    <Hoofdstuk nummer="03" titel={t.hoofdstuk}>
      <CijferBlok
        id="blok-lestype"
        className="club-k6"
        titel={t.perLestype}
        kern={
          <>
            {t.gemiddeld}
            <strong>{h.bezetting === null ? tk.algemeen.geenData : procent(h.bezetting, c.taal)}</strong>
          </>
        }
        definitie={tk.definities.bezetting}
        csv={{ bestand: csvBestandsnaam('bezetting-per-lestype', deel), kop: [t.lestype, ...t.csvKop], rijen: bezettingCsv(r.perLestype) }}
      >
        <BalkTabel bijschrift={t.perLestypeBijschrift(bereikNaam(c))} kolomLabel={t.lestype} waardeLabel={t.bezetting} extraLabels={[t.lessenKolom]} rijen={bezettingRijen(r.perLestype, c.taal)} leeg={t.geenLessen} />
      </CijferBlok>
      <CijferBlok
        id="blok-tijdslot"
        className="club-k6"
        titel={t.perTijdslot}
        definitie={t.tijdslotUitleg}
        csv={{ bestand: csvBestandsnaam('bezetting-per-tijdslot', deel), kop: [t.begintijd, ...t.csvKop], rijen: bezettingCsv(r.perTijdslot) }}
      >
        <BalkTabel bijschrift={t.perTijdslotBijschrift(bereikNaam(c))} kolomLabel={t.begintijd} waardeLabel={t.bezetting} extraLabels={[t.lessenKolom]} rijen={bezettingRijen(r.perTijdslot, c.taal)} leeg={t.geenLessen} />
      </CijferBlok>
      <CijferBlok
        id="blok-noshow"
        className="club-k5"
        titel={t.noShow}
        definitie={tk.definities.noShow}
        csv={{ bestand: csvBestandsnaam('no-show', deel), kop: [...t.csvNoShow], rijen: [[h.aanwezig, h.noShowAantal, h.noShow === null ? null : Math.round(h.noShow * 1000) / 10]] }}
      >
        {h.noShow === null ? (
          <p className="club-leeg">{t.geenNoShow}</p>
        ) : (
          <div className="club-cijfers-feit">
            <strong className="club-cijfers-groot">{procent(h.noShow, c.taal)}</strong>
            <span>{t.noShowFeit(heel(h.noShowAantal, c.taal), heel(h.aanwezig, c.taal))}</span>
          </div>
        )}
      </CijferBlok>
      <CijferBlok
        id="blok-wachtlijst"
        className="club-k7"
        titel={t.wachtlijst}
        kern={
          <>
            <strong>{heel(wl.wachtenden, c.taal)}</strong>
            {t.wachten(wl.wachtenden)}
          </>
        }
        definitie={tk.definities.wachtlijst}
        csv={{ bestand: csvBestandsnaam('wachtlijst', deel), kop: [...t.csvWachtlijst], rijen: wl.perLestype.map((p) => [p.label, p.lessen, p.wachtenden]) }}
      >
        <div className="club-cijfers-feitenrij">
          <div className="club-cijfers-feit">
            <strong className="club-cijfers-groot">{heel(wl.vol, c.taal)}</strong>
            <span>{t.vanVol(wl.lessen)}</span>
          </div>
          <div className="club-cijfers-feit">
            <strong className="club-cijfers-groot">{heel(wl.metWachtlijst, c.taal)}</strong>
            <span>{t.metWachtlijst(wl.metWachtlijst)}</span>
          </div>
        </div>
        {wl.perLestype.length > 0 && (
          <BalkTabel
            bijschrift={t.wachtendenBijschrift}
            kolomLabel={t.lestype}
            waardeLabel={t.wachtenden}
            extraLabels={[t.lessenKolom]}
            rijen={wl.perLestype.map((p) => ({ label: p.label, deel: p.wachtenden / Math.max(1, wl.perLestype[0].wachtenden), waarde: heel(p.wachtenden, c.taal), extra: [heel(p.lessen, c.taal)] }))}
            leeg=""
          />
        )}
      </CijferBlok>
    </Hoofdstuk>
  )
}
