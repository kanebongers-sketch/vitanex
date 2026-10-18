'use client'

import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Check, Minus, TrendingUp } from 'lucide-react'
import { REGEL_NAAM, type ProgressieRegel, type SuggestieSoort } from '@/lib/club/training/progressie'
import { lijnPunten, toonDatum } from '@/lib/club/training/weergave'

interface ProgressieKaartProps {
  regels: ProgressieRegel[]
  /** Het gewicht dat nu in de editor staat, per oefening ("" = leeg). */
  huidig: ReadonlyMap<string, string>
  onOvernemen: (oefeningId: string, kg: number) => void
}

const B = 132
const H = 40

const RICHTING: Record<SuggestieSoort, 'op' | 'neer' | 'gelijk'> = {
  start: 'gelijk',
  gewicht_omhoog: 'op',
  herhalingen_omhoog: 'op',
  tijd_omhoog: 'op',
  zwaardere_variant: 'op',
  vasthouden: 'gelijk',
  gewicht_omlaag: 'neer',
}

const EENHEID = { kg: 'kg', herh: 'herh.', sec: 'sec' } as const

function Lijntje({ reeks, naam }: { reeks: ProgressieRegel['reeks']; naam: string }) {
  const punten = lijnPunten(reeks, B, H, 5)
  if (punten.length === 0) return <span className="club-training-p-leeglijn" aria-hidden />
  return (
    <svg viewBox={`0 0 ${B} ${H}`} className="club-training-p-lijn" role="img" aria-label={`Verloop ${naam}: ${reeks.map((p) => p.waarde.toLocaleString('nl-NL')).join(', ')}`}>
      {punten.length > 1 && <polyline points={punten.map((p) => `${p.x},${p.y}`).join(' ')} className="club-training-lijn-pad" />}
      {punten.map((p, i) => (
        <circle key={`${p.label}-${i}`} cx={p.x} cy={p.y} r={i === punten.length - 1 ? 3.5 : 2} className={i === punten.length - 1 ? 'club-training-lijn-nu' : 'club-training-lijn-punt'} />
      ))}
    </svg>
  )
}

function Rij({ r, huidig, onOvernemen }: { r: ProgressieRegel; huidig: string | undefined; onOvernemen: ProgressieKaartProps['onOvernemen'] }) {
  const s = r.suggestie
  const richting = RICHTING[s.soort]
  const Icoon = richting === 'op' ? ArrowUpRight : richting === 'neer' ? ArrowDownRight : Minus
  const nieuwKg = s.gewichtKg !== null ? s.gewichtKg.toLocaleString('nl-NL') : null
  const alGezet = nieuwKg !== null && huidig === nieuwKg
  const kanOvernemen = s.gewichtKg !== null && (s.soort === 'gewicht_omhoog' || s.soort === 'gewicht_omlaag' || !huidig)
  const laatste = r.reeks[r.reeks.length - 1]
  return (
    <li className="club-training-p-rij">
      <div className="club-training-p-kop">
        <strong>{r.naam}</strong>
        {laatste && r.eenheid && (
          <span className="club-training-p-nu">
            {laatste.waarde.toLocaleString('nl-NL')} <small>{EENHEID[r.eenheid]}</small>
          </span>
        )}
      </div>
      <div className="club-training-p-midden">
        <Lijntje reeks={r.reeks} naam={r.naam} />
        <span className="club-zacht">{r.laatste ? `${r.aantal}x · laatst ${r.laatsteOp ? toonDatum(r.laatsteOp) : ''}: ${r.laatste}` : 'Nog niets gelogd'}</span>
      </div>
      <p className="club-training-p-advies" data-richting={richting}>
        <Icoon aria-hidden size={15} />
        <span>{s.tekst}</span>
      </p>
      {kanOvernemen && s.gewichtKg !== null && (
        <button type="button" className="club-knop club-knop--klein club-training-p-knop" onClick={() => onOvernemen(r.oefeningId, s.gewichtKg as number)} disabled={alGezet}>
          {alGezet ? <><Check aria-hidden size={14} /> {nieuwKg} kg staat erin</> : `${nieuwKg} kg in het schema zetten`}
        </button>
      )}
    </li>
  )
}

/** Per oefening het verloop van wat het lid logde en de volgende stap volgens een vaste vakregel. */
export function ProgressieKaart({ regels, huidig, onOvernemen }: ProgressieKaartProps) {
  const [alles, setAlles] = useState(false)
  const gelogd = regels.filter((r) => r.aantal > 0)
  const zicht = alles ? regels : gelogd.slice(0, 6)
  return (
    <section className="club-kaart club-training-p" aria-labelledby="progressie-kop">
      <header className="club-training-p-titel">
        <TrendingUp aria-hidden size={18} />
        <h2 id="progressie-kop">Progressie</h2>
      </header>
      <p className="club-hint">{REGEL_NAAM}. Eerst de herhalingen omhoog tot de bovenkant van het bereik, dan het gewicht de kleinste stap omhoog.</p>
      {gelogd.length === 0 && !alles ? (
        <p className="club-hint">Nog geen sets gelogd. Zodra het lid in de app per set invult wat het deed, zie je hier het verloop en de volgende stap.</p>
      ) : (
        <ul className="club-training-p-lijst">
          {zicht.map((r) => <Rij key={r.oefeningId} r={r} huidig={huidig.get(r.oefeningId)} onOvernemen={onOvernemen} />)}
        </ul>
      )}
      {regels.length > zicht.length && (
        <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setAlles(true)}>
          Alle {regels.length} oefeningen tonen
        </button>
      )}
    </section>
  )
}
