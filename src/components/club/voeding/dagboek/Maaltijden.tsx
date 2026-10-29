import { Plus, X } from 'lucide-react'
import { perMaaltijd } from '@/lib/club/voeding/dagboek/berekeningen'
import type { DagboekRegel, Maaltijd } from '@/lib/club/voeding/dagboek/model'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'

// De vier maaltijden van een dag met wat erin zit. De maaltijd van dit moment
// (voorkeur) staat licht gemarkeerd, zodat de eerste tik meteen goed zit.

interface MaaltijdenProps {
  regels: readonly DagboekRegel[]
  t: VoedingDagboekTekst
  alleenLezen: boolean
  voorkeur: Maaltijd | null
  onToevoegen: (m: Maaltijd) => void
  onVerwijder: (id: string) => void
}

function portieTekst(r: DagboekRegel, t: VoedingDagboekTekst): string | null {
  if (r.maat && r.aantal && r.maat in t.maten) return t.portie.maat(r.aantal, t.maten[r.maat as keyof VoedingDagboekTekst['maten']])
  return r.gram ? t.portie.gram(Math.round(r.gram)) : null
}

export function Maaltijden({ regels, t, alleenLezen, voorkeur, onToevoegen, onVerwijder }: MaaltijdenProps) {
  return (
    <div className="club-vd-maaltijden">
      {perMaaltijd([...regels]).map(({ maaltijd, regels: lijst, totaal }) => {
        const naam = t.maaltijd[maaltijd]
        return (
          <section key={maaltijd} className={`club-vd-maaltijd${voorkeur === maaltijd ? ' is-nu' : ''}`} aria-labelledby={`vd-m-${maaltijd}`}>
            <header className="club-vd-maaltijd-kop">
              <h4 id={`vd-m-${maaltijd}`}>{naam}</h4>
              <span className="club-vd-maaltijd-kcal">{totaal.kcal} {t.macro.kcal}</span>
              {!alleenLezen && (
                <button type="button" className="club-vd-plus" onClick={() => onToevoegen(maaltijd)} aria-label={t.maaltijdKop.toevoegen(naam)}>
                  <Plus size={20} aria-hidden />
                </button>
              )}
            </header>
            {lijst.length === 0 ? (
              <p className="club-vd-hint">{t.maaltijdKop.leeg}</p>
            ) : (
              <ul className="club-vd-regels">
                {lijst.map((r) => (
                  <li key={r.id} className="club-vd-regel">
                    <span className="club-vd-product-tekst">
                      <strong>{r.naam}</strong>
                      <span>{[portieTekst(r, t), `${t.macro.kortEiwit} ${Math.round(r.eiwitG)} · ${t.macro.kortKh} ${Math.round(r.koolhydratenG)} · ${t.macro.kortVet} ${Math.round(r.vetG)}`].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="club-vd-regel-kcal">{r.kcal}</span>
                    {!alleenLezen && (
                      <button type="button" className="club-vd-x" onClick={() => onVerwijder(r.id)} aria-label={t.maaltijdKop.weghalen(r.naam)}>
                        <X size={16} aria-hidden />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
