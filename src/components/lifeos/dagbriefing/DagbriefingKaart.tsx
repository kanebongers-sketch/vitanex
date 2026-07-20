'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Sparkles, Sunrise, Target, TriangleAlert, type LucideIcon } from 'lucide-react'
import { haalJson, isObject, tekstOfNull } from '@/lib/lifeos/api/http'
import { datumSleutel, tijdLabel } from '@/lib/lifeos/datum/datum'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// ─── De dagbriefing-band ────────────────────────────────────────────────────
// De luidste band bovenaan de cockpit: een rustige "COO-ochtendbriefing" die de
// dag in één oogopslag samenvat. Leest `GET /api/lifeos/dagbriefing` met hetzelfde
// `haalJson`-narrow-patroon als de rest van LifeOS (fout ≠ leeg).
//
// Drie staten die echt verschillen, plus laden:
//   laden — rustige skeleton in navy, geen spinner-spektakel.
//   fout  — de gedeelde Foutmelding met een weg terug (een storing is geen "lege
//           dag"; nooit "rustige dag" tonen als we de briefing niet kónden ophalen).
//   ok    — de briefing zelf. Lege secties laten we WEG i.p.v. "geen risico's" op te
//           dringen; is álles leeg, dan één eerlijke regel "Rustige dag".
//
// Rang via schaal, niet via kleur: de band draagt zijn gewicht via breedte, een
// zachte cyaan-gloed en groter formaat — cyaan blijft strikt accent, geen vlak.

interface Dagbriefing {
  groet: string
  briefing: string
  prioriteiten: string[]
  risicos: string[]
  kansen: string[]
  gegenereerdOp: string
}

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; data: Dagbriefing }

/**
 * Een lijst korte regels: alleen niet-lege strings tellen. Geen array (of de
 * sleutel ontbreekt) → leeg, geen fout: 0-N regels is een geldige, rustige dag.
 */
function leesRegels(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map(tekstOfNull).filter((r): r is string => r !== null)
}

/**
 * Het antwoord van `GET /api/lifeos/dagbriefing`. Geen cast: mist de kern
 * (groet/briefing/gegenereerdOp), dan `null` → nette fout via `haalJson`, geen
 * half object dat de band verderop laat crashen.
 */
function leesDagbriefing(ruw: unknown): Dagbriefing | null {
  if (!isObject(ruw)) return null
  const groet = tekstOfNull(ruw.groet)
  const briefing = tekstOfNull(ruw.briefing)
  const gegenereerdOp = tekstOfNull(ruw.gegenereerdOp)
  if (groet === null || briefing === null || gegenereerdOp === null) return null
  return {
    groet,
    briefing,
    prioriteiten: leesRegels(ruw.prioriteiten),
    risicos: leesRegels(ruw.risicos),
    kansen: leesRegels(ruw.kansen),
    gegenereerdOp,
  }
}

export function DagbriefingKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [bezig, setBezig] = useState(false)

  // Generatieteller: een vlucht die na unmount of een verse ververs terugkomt,
  // zet niets meer — anders wint de oudste die toevallig als laatste binnenkomt.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/dagbriefing', leesDagbriefing).then((uitkomst) => {
      if (mijn !== generatie.current) return
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', data: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  // Ververs houdt de huidige briefing in beeld (bezig-staat op de knop) i.p.v.
  // terug te vallen op de skeleton — een handmatige verversing is geen koude start.
  const ververs = useCallback(() => {
    setBezig(true)
    void laad().finally(() => setBezig(false))
  }, [laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  return (
    <section className="dagbrief" aria-label="Dagbriefing">
      <style href="dagbrief" precedence="medium">
        {CSS}
      </style>

      <DagbriefKop
        groet={staat.fase === 'ok' ? staat.data.groet : null}
        gegenereerdOp={staat.fase === 'ok' ? staat.data.gegenereerdOp : null}
        bezig={bezig}
        kanVerversen={staat.fase === 'ok'}
        onVervers={ververs}
      />

      {staat.fase === 'laden' ? <DagbriefSkelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? <DagbriefInhoud data={staat.data} /> : null}
    </section>
  )
}

interface KopProps {
  groet: string | null
  gegenereerdOp: string | null
  bezig: boolean
  kanVerversen: boolean
  onVervers: () => void
}

/** De kop: eyebrow + groet groot, met rechts de "bijgewerkt"-tijd en ververs-knop. */
function DagbriefKop({ groet, gegenereerdOp, bezig, kanVerversen, onVervers }: KopProps) {
  const tijd = gegenereerdOp ? bijgewerktLabel(gegenereerdOp) : null
  return (
    <header className="dagbrief__kop">
      <div className="dagbrief__intro">
        <p className="dagbrief__label">
          <Sunrise size={13} strokeWidth={2.2} aria-hidden="true" />
          Ochtendbriefing
        </p>
        <h2 id="dagbrief-groet" className="dagbrief__groet">
          {groet ?? 'Je dagbriefing'}
        </h2>
      </div>

      {kanVerversen ? (
        <div className="dagbrief__acties">
          {tijd ? <span className="dagbrief__tijd">{tijd}</span> : null}
          <button
            type="button"
            className="dagbrief__ververs"
            onClick={onVervers}
            disabled={bezig}
            aria-label="Briefing verversen"
          >
            <RefreshCw
              size={15}
              strokeWidth={2.2}
              aria-hidden="true"
              className={bezig ? 'dagbrief__spin' : undefined}
            />
          </button>
        </div>
      ) : null}
    </header>
  )
}

/** De briefingtekst plus de drie secties; lege secties vallen weg. */
function DagbriefInhoud({ data }: { data: Dagbriefing }) {
  const secties = SECTIES.map((s) => ({ ...s, items: data[s.veld] })).filter(
    (s) => s.items.length > 0,
  )

  return (
    <div className="dagbrief__lijf">
      <p className="dagbrief__briefing">{data.briefing}</p>

      {secties.length > 0 ? (
        <div className="dagbrief__secties">
          {secties.map((s) => (
            <DagbriefSectie
              key={s.sleutel}
              sleutel={s.sleutel}
              label={s.label}
              Icoon={s.Icoon}
              items={s.items}
            />
          ))}
        </div>
      ) : (
        <p className="dagbrief__rustig">Rustige dag — niets urgents.</p>
      )}
    </div>
  )
}

interface SectieProps {
  sleutel: string
  label: string
  Icoon: LucideIcon
  items: string[]
}

/** Eén sectie: gekleurde kop (accent via `--accent`) + een korte lijst. */
function DagbriefSectie({ sleutel, label, Icoon, items }: SectieProps) {
  return (
    <section className={`dagbrief__sectie dagbrief__sectie--${sleutel}`}>
      <h3 className="dagbrief__sectiekop">
        <Icoon size={15} strokeWidth={2.2} aria-hidden="true" />
        {label}
      </h3>
      <ul className="dagbrief__items">
        {items.map((item, i) => (
          <li key={`${sleutel}-${i}`} className="dagbrief__item">
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Rustige placeholder in navy — geen spinner, geen layout-schok. */
function DagbriefSkelet() {
  return (
    <div className="dagbrief__lijf" aria-busy="true" aria-live="polite">
      <span className="sr-only">De briefing wordt opgehaald.</span>
      <div className="dagbrief__skelet dagbrief__skelet--breed" aria-hidden="true" />
      <div className="dagbrief__skelet dagbrief__skelet--mid" aria-hidden="true" />
      <div className="dagbrief__secties" aria-hidden="true">
        <span className="dagbrief__skelet dagbrief__skelet--blok" />
        <span className="dagbrief__skelet dagbrief__skelet--blok" />
        <span className="dagbrief__skelet dagbrief__skelet--blok" />
      </div>
    </div>
  )
}

// ─── Config & pure helpers ───────────────────────────────────────────────────

/** De drie secties, in vaste volgorde. `veld` koppelt aan de Dagbriefing-sleutel;
 *  de accent-kleur per sectie zit in de `--*`-modifier in de CSS. */
const SECTIES = [
  { sleutel: 'prio', label: 'Prioriteiten', Icoon: Target, veld: 'prioriteiten' },
  { sleutel: 'risico', label: "Risico's", Icoon: TriangleAlert, veld: 'risicos' },
  { sleutel: 'kans', label: 'Kansen', Icoon: Sparkles, veld: 'kansen' },
] as const satisfies ReadonlyArray<{
  sleutel: string
  label: string
  Icoon: LucideIcon
  veld: keyof Pick<Dagbriefing, 'prioriteiten' | 'risicos' | 'kansen'>
}>

/** 'Bijgewerkt om 08:15' (vandaag) of 'Bijgewerkt 20 jul 08:15'. Null bij een
 *  onleesbare datum — dan tonen we niets liever dan een NaN-tijd. */
function bijgewerktLabel(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const tijd = tijdLabel(d)
  if (datumSleutel(d) === datumSleutel(new Date())) return `Bijgewerkt om ${tijd}`
  const datum = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  return `Bijgewerkt ${datum} ${tijd}`
}

const CSS = `
.dagbrief {
  position: relative;
  display: grid;
  gap: 20px;
  padding: clamp(20px, 3vw, 30px);
  background:
    radial-gradient(120% 150% at 100% 0%, var(--brand-soft), transparent 55%),
    var(--bg-card);
  border: 1px solid color-mix(in srgb, var(--brand) 24%, var(--line-strong));
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card), 0 0 44px -26px var(--brand-glow);
  overflow: hidden;
}

.dagbrief__kop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px 24px;
  flex-wrap: wrap;
}
.dagbrief__intro {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.dagbrief__label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-4);
}
.dagbrief__label svg {
  color: var(--brand);
  flex-shrink: 0;
}
.dagbrief__groet {
  margin: 0;
  font-size: clamp(24px, 3.4vw, 34px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.08;
  color: var(--text-1);
}

.dagbrief__acties {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.dagbrief__tijd {
  font-size: 12px;
  color: var(--text-4);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.dagbrief__ververs {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-btn);
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  transition: color 180ms var(--ease), border-color 180ms var(--ease),
    background 180ms var(--ease);
}
.dagbrief__ververs:hover:not(:disabled) {
  color: var(--brand);
  border-color: var(--brand);
  background: var(--brand-soft);
}
.dagbrief__ververs:disabled {
  cursor: progress;
  opacity: 0.6;
}
.dagbrief__ververs:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.dagbrief__spin {
  animation: dagbrief-spin 900ms linear infinite;
}
@keyframes dagbrief-spin {
  to {
    transform: rotate(360deg);
  }
}

.dagbrief__lijf {
  display: grid;
  gap: 20px;
}
.dagbrief__briefing {
  margin: 0;
  max-width: 68ch;
  font-size: clamp(15px, 1.4vw, 16px);
  line-height: 1.65;
  color: var(--text-2);
}

.dagbrief__secties {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 22px;
}
.dagbrief__sectie {
  flex: 1 1 220px;
  min-width: 0;
  display: grid;
  gap: 11px;
  align-content: start;
  padding-top: 15px;
  border-top: 1px solid var(--line);
}
.dagbrief__sectie--prio {
  --accent: var(--brand);
}
.dagbrief__sectie--risico {
  --accent: var(--status-warning);
}
.dagbrief__sectie--kans {
  --accent: var(--status-info);
}
.dagbrief__sectiekop {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-3);
}
.dagbrief__sectiekop svg {
  flex-shrink: 0;
  color: var(--accent, var(--brand));
}
.dagbrief__items {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.dagbrief__item {
  position: relative;
  padding-left: 16px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-2);
  overflow-wrap: anywhere;
}
.dagbrief__item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.58em;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--accent, var(--brand));
}

.dagbrief__rustig {
  margin: 0;
  font-size: 14px;
  color: var(--text-3);
}

.dagbrief__skelet {
  display: block;
  border-radius: 8px;
  background: var(--bg-raised);
}
.dagbrief__skelet--breed {
  height: 16px;
  width: 82%;
}
.dagbrief__skelet--mid {
  height: 13px;
  width: 56%;
}
.dagbrief__skelet--blok {
  flex: 1 1 220px;
  height: 78px;
  border-radius: var(--radius-md);
}

@media (prefers-reduced-motion: reduce) {
  .dagbrief__ververs {
    transition: none;
  }
  .dagbrief__spin {
    animation: none;
  }
}
`
