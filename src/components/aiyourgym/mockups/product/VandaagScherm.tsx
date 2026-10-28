import { Plus } from 'lucide-react'
import { formatDatum, formatProcent } from '@/lib/aiyourgym/taal/formaat'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { PRODUCTSCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/mockups/productschermen'
import { Venster } from '../kaders'
import { LES, VOORBEELD_VESTIGING } from '../voorbeeld'
import { PBlok, PCijfer, PMeter, PStrook } from './bouwstenen'

// Het scherm Vandaag van Club in de nieuwe stijl: een strook met het hoofdcijfer
// (nu binnen, met het verloop per uur), de taken en de bezetting, daaronder de
// lessen van de dag met hun meter en wie er net binnenkwam. Vaste voorbeelddata
// van Kernhal; de cijfers kloppen onderling (bezetting = geboekt / plekken).

const DAG = '2026-10-20T12:00:00Z'
const CHECKINS_PER_UUR = [6, 14, 9, 5, 4, 7, 8, 5, 4, 6, 11, 17] as const
const TAKEN = { gedaan: 7, totaal: 12 } as const
const OPVOLGEN = 5

const LESSEN = [
  { tijd: '07:00', naam: LES.strength, bezet: 9, plekken: 12 },
  { tijd: '09:00', naam: LES.mobility, bezet: 10, plekken: 12 },
  { tijd: '12:00', naam: LES.kettlebell, bezet: 6, plekken: 10 },
  { tijd: '18:30', naam: LES.barbell, bezet: 12, plekken: 12, wachtlijst: 3 },
  { tijd: '20:00', naam: LES.conditioning, bezet: 11, plekken: 14 },
] as const

const NET_BINNEN = [
  { ini: 'SB', naam: 'Sanne Bakker', tijd: '17:58' },
  { ini: 'RJ', naam: 'Ravi Janssen', tijd: '17:54' },
  { ini: 'LS', naam: 'Lotte Smit', tijd: '17:51' },
  { ini: 'NP', naam: 'Noah Peters', tijd: '17:46' },
] as const

const BEZET = LESSEN.reduce((s, l) => s + l.bezet, 0)
const PLEKKEN = LESSEN.reduce((s, l) => s + l.plekken, 0)

export async function VandaagScherm() {
  const taal = await getSiteTaal()
  const t = PRODUCTSCHERMEN[taal].vandaag
  return (
    <Venster actief="Werkvloer" hier="Vandaag">
      <div className="aygp">
        <div className="aygp-paginakop">
          <div>
            <p className="aygp-waar">{t.waar(VOORBEELD_VESTIGING, formatDatum(DAG, taal, 'dag'))}</p>
            <p className="aygp-titel">{t.kop}</p>
          </div>
          <span className="aygp-knop">
            <Plus size={14} aria-hidden /> {t.checkin}
          </span>
        </div>
        <PStrook label={t.strook} kolommen={4}>
          <PCijfer hoofd label={t.binnen} waarde="23" verschil={t.binnenVerschil} sub={t.binnenSub} trend={{ waarden: CHECKINS_PER_UUR, label: t.binnenTrend }} />
          <PCijfer
            label={t.taken}
            waarde={String(TAKEN.gedaan)}
            eenheid={t.takenVan(TAKEN.totaal)}
            meter={{ deel: TAKEN.gedaan / TAKEN.totaal, label: t.taken }}
            sub={t.takenOpen(TAKEN.totaal - TAKEN.gedaan)}
          />
          <PCijfer label={t.bezetting} waarde={formatProcent(BEZET / PLEKKEN, taal)} meter={{ deel: BEZET / PLEKKEN, label: t.bezetting }} sub={t.bezettingSub(LESSEN.length)} />
        </PStrook>
        <div className="aygp-twee">
          <PBlok titel={t.lessen} extra={`${BEZET}/${PLEKKEN}`}>
            <ul className="aygp-lessen">
              {LESSEN.map((l) => {
                const vol = l.bezet >= l.plekken
                return (
                  <li key={l.tijd} data-vol={vol || undefined}>
                    <span className="aygp-tijd">{l.tijd}</span>
                    <span className="aygp-les">
                      <b>{l.naam}</b>
                      <PMeter deel={l.bezet / l.plekken} label={t.lessenLabel} />
                    </span>
                    <span className="aygp-stand">{vol && 'wachtlijst' in l ? t.vol(l.wachtlijst) : `${l.bezet}/${l.plekken}`}</span>
                  </li>
                )
              })}
            </ul>
          </PBlok>
          <div className="aygp-kolom">
            <PBlok titel={t.netBinnen} className="aygp-blok--verhoogd">
              <ul className="aygp-mensen">
                {NET_BINNEN.map((m) => (
                  <li key={m.ini}>
                    <span className="aygp-avatar">{m.ini}</span>
                    <b>{m.naam}</b>
                    <span className="aygp-tijd">{m.tijd}</span>
                  </li>
                ))}
              </ul>
            </PBlok>
            <PCijfer label={t.opvolgen} waarde={String(OPVOLGEN)} sub={t.opvolgenSub} />
          </div>
        </div>
      </div>
    </Venster>
  )
}
