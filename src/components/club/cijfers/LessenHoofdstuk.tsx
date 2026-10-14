import { DEFINITIES } from '@/lib/club/cijfers/definities'
import { aantal, heel, procent } from '@/lib/club/cijfers/opmaak'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import type { BezettingGroep } from '@/lib/club/cijfers/lessen'
import { BalkTabel } from './BalkTabel'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { bereikNaam, bestandsdeel, type CijferContext } from './context'

function bezettingRijen(groepen: BezettingGroep[]) {
  return groepen.map((g) => ({ label: g.label, deel: g.bezetting, waarde: procent(g.bezetting), extra: [heel(g.lessen)], nadruk: g.bezetting >= 0.9 }))
}

function bezettingCsv(groepen: BezettingGroep[]) {
  return groepen.map((g) => [g.label, g.lessen, g.bezet, g.capaciteit, Math.round(g.bezetting * 1000) / 10])
}

const BEZETTING_KOP = ['Lessen', 'Geboekt', 'Capaciteit', 'Bezetting %']

export function LessenHoofdstuk({ c }: { c: CijferContext }) {
  const r = c.rapport
  const deel = bestandsdeel(c)
  const wl = r.wachtlijst
  return (
    <Hoofdstuk nummer="03" titel="Lessen">
      <CijferBlok
        id="blok-lestype"
        className="club-k6"
        titel="Bezetting per lestype"
        kern={
          <>
            Gemiddeld <strong>{r.totalen.lessen > 0 ? procent(r.totalen.bezetting) : 'geen data'}</strong>
          </>
        }
        definitie={DEFINITIES.bezetting}
        csv={{ bestand: csvBestandsnaam('bezetting-per-lestype', deel), kop: ['Lestype', ...BEZETTING_KOP], rijen: bezettingCsv(r.perLestype) }}
      >
        <BalkTabel bijschrift={`Bezetting per lestype, ${bereikNaam(c)}`} kolomLabel="Lestype" waardeLabel="Bezetting" extraLabels={['Lessen']} rijen={bezettingRijen(r.perLestype)} leeg="In deze periode zijn nog geen lessen geweest." />
      </CijferBlok>
      <CijferBlok
        id="blok-tijdslot"
        className="club-k6"
        titel="Bezetting per tijdslot"
        definitie="Zelfde telling als bij lestype, gegroepeerd op de begintijd van de les."
        csv={{ bestand: csvBestandsnaam('bezetting-per-tijdslot', deel), kop: ['Begintijd', ...BEZETTING_KOP], rijen: bezettingCsv(r.perTijdslot) }}
      >
        <BalkTabel bijschrift={`Bezetting per begintijd, ${bereikNaam(c)}`} kolomLabel="Begintijd" waardeLabel="Bezetting" extraLabels={['Lessen']} rijen={bezettingRijen(r.perTijdslot)} leeg="In deze periode zijn nog geen lessen geweest." />
      </CijferBlok>
      <CijferBlok
        id="blok-noshow"
        className="club-k5"
        titel="No-show"
        definitie={DEFINITIES.noShow}
        csv={{ bestand: csvBestandsnaam('no-show', deel), kop: ['Aanwezig', 'No-show', 'No-show %'], rijen: [[r.totalen.aanwezig, r.totalen.noShow, r.totalen.noShowAandeel === null ? null : Math.round(r.totalen.noShowAandeel * 1000) / 10]] }}
      >
        {r.totalen.noShowAandeel === null ? (
          <p className="club-leeg">Nog geen lessen met afgeronde reserveringen in deze periode.</p>
        ) : (
          <div className="club-cijfers-feit">
            <strong className="club-cijfers-groot">{procent(r.totalen.noShowAandeel)}</strong>
            <span>
              {heel(r.totalen.noShow)} keer niet gekomen tegen {heel(r.totalen.aanwezig)} keer wel.
            </span>
          </div>
        )}
      </CijferBlok>
      <CijferBlok
        id="blok-wachtlijst"
        className="club-k7"
        titel="Wachtlijstdruk"
        kern={
          <>
            <strong>{heel(wl.wachtenden)}</strong> {wl.wachtenden === 1 ? 'persoon wacht' : 'mensen wachten'}
          </>
        }
        definitie={DEFINITIES.wachtlijst}
        csv={{ bestand: csvBestandsnaam('wachtlijst', deel), kop: ['Lestype', 'Lessen met wachtlijst', 'Wachtenden'], rijen: wl.perLestype.map((p) => [p.label, p.lessen, p.wachtenden]) }}
      >
        <div className="club-cijfers-feitenrij">
          <div className="club-cijfers-feit">
            <strong className="club-cijfers-groot">{heel(wl.vol)}</strong>
            <span>van {aantal(wl.lessen, 'les', 'lessen')} vol</span>
          </div>
          <div className="club-cijfers-feit">
            <strong className="club-cijfers-groot">{heel(wl.metWachtlijst)}</strong>
            <span>{wl.metWachtlijst === 1 ? 'les' : 'lessen'} met wachtlijst</span>
          </div>
        </div>
        {wl.perLestype.length > 0 && (
          <BalkTabel
            bijschrift="Wachtenden per lestype, komende 14 dagen"
            kolomLabel="Lestype"
            waardeLabel="Wachtenden"
            extraLabels={['Lessen']}
            rijen={wl.perLestype.map((p) => ({ label: p.label, deel: p.wachtenden / Math.max(1, wl.perLestype[0].wachtenden), waarde: heel(p.wachtenden), extra: [heel(p.lessen)] }))}
            leeg=""
          />
        )}
      </CijferBlok>
    </Hoofdstuk>
  )
}
