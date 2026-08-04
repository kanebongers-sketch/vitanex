'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Dumbbell, Check, Plus, Minus, ChevronDown } from 'lucide-react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { leesBlokVandaag, type BlokVandaag, type OefeningVandaag, type BlokKeuze, type VorigeSet } from './blok-client'

// De trainingskaart op /home: "wat moet ik vandaag doen?" en, in één scherm, het
// loggen ervan. Mobiel-first — grote tikdoelen, minimaal typen. De progressie
// (vorige prestatie + voorstel) komt kant-en-klaar van de server; deze kaart
// rekent niets uit, ze logt alleen wat jij bevestigt.

const JSON_POST = { method: 'POST', headers: { 'content-type': 'application/json' } } as const

function vandaagContext(): { datum: string; weekdag: number } {
  const nu = new Date()
  return { datum: datumSleutel(nu), weekdag: nu.getDay() }
}

export function BlokKaart() {
  const [data, setData] = useState<BlokVandaag | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [laden, setLaden] = useState(true)
  // De zelfgekozen sessie voor vandaag (null = het auto-schema volgen).
  const [gekozen, setGekozen] = useState<string | null>(null)

  // Generatieteller: een trage oudere vlucht (of één die na unmount terugkomt)
  // mag een verse stand niet overschrijven. Zelfde patroon als de andere kaarten.
  const generatie = useRef(0)

  const laad = useCallback((code: string | null): Promise<void> => {
    const mijn = ++generatie.current
    const { datum, weekdag } = vandaagContext()
    const sessie = code ? `&sessie=${code}` : ''
    return haalJson(`/api/lifeos/blok/vandaag?datum=${datum}&weekdag=${weekdag}${sessie}`, leesBlokVandaag).then((uit) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      if (uit.ok) {
        setData(uit.waarde)
        setFout(null)
      } else {
        setFout(uit.fout)
      }
      setLaden(false)
    })
  }, [])

  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad(gekozen)
    return verval
  }, [laad, verval, gekozen])

  if (laden) {
    return (
      <Kaart titel="Training van vandaag" vervangt="je coach">
        <div aria-hidden style={{ height: 64, borderRadius: 10, background: 'var(--bg-raised)' }} />
      </Kaart>
    )
  }
  if (fout !== null) {
    return (
      <Kaart titel="Training van vandaag" vervangt="je coach">
        <Foutmelding bericht={fout} opnieuw={() => void laad(gekozen)} />
      </Kaart>
    )
  }
  if (data === null || data.inBlok === false) {
    return (
      <Kaart titel="Training van vandaag" vervangt="je coach">
        <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          Je 4-weken blok is afgerond. 💪 Klaar voor de evaluatie en een nieuw blok.
        </p>
      </Kaart>
    )
  }

  return (
    <Kaart titel="Training van vandaag" vervangt="je coach">
      <div style={{ display: 'grid', gap: 14 }}>
        <SessiePicker keuzes={data.keuzes ?? []} actief={data.gekozenCode} onKies={setGekozen} />
        <Kop data={data} />
        {data.soort === 'kracht' ? <Kracht data={data} onVeranderd={() => laad(gekozen)} /> : null}
        {data.soort === 'cardio' ? <CardioInfo data={data} /> : null}
        {data.soort === 'rust' ? <RustInfo data={data} /> : null}
      </div>
    </Kaart>
  )
}

// ─── Dagkeuze: kies zelf welke sessie je vandaag doet ────────────────────────
// Overschrijft het weekschema. De actieve chip is wat de server nu serveert
// (data.gekozenCode) — of dat nu het auto-schema is of jouw keuze.

function SessiePicker({ keuzes, actief, onKies }: { keuzes: BlokKeuze[]; actief: string | undefined; onKies: (code: string) => void }) {
  if (keuzes.length === 0) return null
  return (
    <div role="group" aria-label="Kies je training van vandaag" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, margin: '0 -2px', scrollbarWidth: 'thin' }}>
      {keuzes.map((k) => {
        const aan = k.code === actief
        return (
          <button
            key={k.code}
            type="button"
            onClick={() => onKies(k.code)}
            aria-pressed={aan}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 999,
              border: `1px solid ${aan ? 'var(--brand)' : 'var(--line)'}`,
              background: aan ? 'var(--brand-soft)' : 'transparent',
              color: aan ? 'var(--brand)' : 'var(--text-3)',
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 150ms var(--ease), border-color 150ms var(--ease), background 150ms var(--ease)',
            }}
          >
            {k.titel}
          </button>
        )
      })}
    </div>
  )
}

function Kop({ data }: { data: BlokVandaag }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Dumbbell size={16} strokeWidth={2.2} style={{ color: 'var(--brand)' }} aria-hidden />
        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>{data.titel}</span>
        {data.week ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-soft)', borderRadius: 999, padding: '2px 8px' }}>
            Week {data.week} · {data.profiel?.naam}
          </span>
        ) : null}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>{data.focus}</p>
      {data.profiel?.advies ? (
        <p style={{ fontSize: 12, color: 'var(--text-4)', margin: '6px 0 0', lineHeight: 1.5 }}>{data.profiel.advies}</p>
      ) : null}
    </div>
  )
}

// ─── Krachtsessie: start → per oefening loggen → afronden ────────────────────

function Kracht({ data, onVeranderd }: { data: BlokVandaag; onVeranderd: () => Promise<void> }) {
  const [trainingId, setTrainingId] = useState<string | null>(data.sessie?.trainingId ?? null)
  const [bezig, setBezig] = useState(false)
  const voltooid = data.sessie?.voltooidOp != null

  const start = useCallback(async () => {
    if (trainingId || bezig) return
    setBezig(true)
    const { datum } = vandaagContext()
    const uit = await haalJson<{ trainingId: string }>(
      '/api/lifeos/blok/start',
      (r) => (typeof r === 'object' && r !== null && typeof (r as { trainingId?: unknown }).trainingId === 'string' ? { trainingId: (r as { trainingId: string }).trainingId } : null),
      { ...JSON_POST, body: JSON.stringify({ sessieCode: data.gekozenCode ?? leidCode(data.titel), blokWeek: data.week, datum }) },
    )
    if (uit.ok) setTrainingId(uit.waarde.trainingId)
    setBezig(false)
  }, [trainingId, bezig, data.titel, data.week, data.gekozenCode])

  const oefeningen = data.oefeningen ?? []

  if (!trainingId) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <Warmup regels={data.warmup ?? []} />
        <Knop variant="primair" onClick={() => void start()} disabled={bezig}>
          <Dumbbell size={15} strokeWidth={2.2} aria-hidden /> {bezig ? 'Bezig…' : 'Start training'}
        </Knop>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Warmup regels={data.warmup ?? []} />
      <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
        {oefeningen.map((o) => (
          <li key={o.naam}>
            <OefeningLogger oefening={o} trainingId={trainingId} />
          </li>
        ))}
      </ul>
      {!voltooid ? <Afronden trainingId={trainingId} onKlaar={onVeranderd} /> : (
        <p style={{ fontSize: 13, color: 'var(--brand)', margin: 0, fontWeight: 600 }}>✅ Sessie afgerond — sterk gedaan.</p>
      )}
    </div>
  )
}

/** De titel → sessie_code. Vaste mapping; het programma kent er zes. */
function leidCode(titel: string | undefined): string {
  const m: Record<string, string> = {
    'Upper A': 'upper_a', 'Lower A': 'lower_a', 'Upper B': 'upper_b', 'Lower B': 'lower_b',
  }
  return (titel && m[titel]) ?? 'upper_a'
}

function Warmup({ regels }: { regels: readonly string[] }) {
  const [open, setOpen] = useState(false)
  if (regels.length === 0) return null
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} style={toggleStijl} aria-expanded={open}>
        <ChevronDown size={14} strokeWidth={2.2} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 180ms var(--ease)' }} aria-hidden />
        Warming-up
      </button>
      {open ? (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, display: 'grid', gap: 3 }}>
          {regels.map((r, i) => (
            <li key={i} style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

// ─── Eén oefening: doel, vorige prestatie, en de set-rijen ───────────────────

interface SetInput { gewicht: string; reps: string; gelogd: boolean }

function OefeningLogger({ oefening, trainingId }: { oefening: OefeningVandaag; trainingId: string }) {
  const voorstel = oefening.voorstelKg
  const beginGewicht = voorstel !== null ? String(voorstel) : (oefening.vorige[0]?.gewichtKg != null ? String(oefening.vorige[0].gewichtKg) : '')

  const [sets, setSets] = useState<SetInput[]>(() =>
    Array.from({ length: oefening.sets }, (_, i) => {
      const gelogd = oefening.gelogd.find((g) => g.setNummer === i + 1)
      return {
        gewicht: gelogd?.gewichtKg != null ? String(gelogd.gewichtKg) : beginGewicht,
        reps: gelogd?.herhalingen != null ? String(gelogd.herhalingen) : '',
        gelogd: gelogd != null,
      }
    }),
  )

  const zet = (i: number, veld: 'gewicht' | 'reps', waarde: string) =>
    setSets((s) => s.map((r, j) => (j === i ? { ...r, [veld]: waarde } : r)))

  const stapGewicht = (i: number, delta: number) =>
    setSets((s) => s.map((r, j) => (j === i ? { ...r, gewicht: String(Math.max(0, Math.round(((Number(r.gewicht) || 0) + delta) * 100) / 100)) } : r)))

  const log = useCallback(async (i: number) => {
    const r = sets[i]
    const reps = Number(r.reps)
    if (!Number.isFinite(reps) || reps <= 0) return
    const gewicht = r.gewicht === '' ? null : Number(r.gewicht)
    const uit = await haalJson('/api/lifeos/blok/set', leesNiets, {
      ...JSON_POST,
      body: JSON.stringify({ trainingId, oefening: oefening.naam, setNummer: i + 1, herhalingen: reps, gewichtKg: gewicht, rir: null }),
    })
    if (uit.ok) setSets((s) => s.map((row, j) => (j === i ? { ...row, gelogd: true } : row)))
  }, [sets, trainingId, oefening.naam])

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderLeft: '2px solid var(--brand)', borderRadius: 'var(--radius-card)', padding: '12px 12px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{oefening.naam}</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
          {oefening.sets}×{oefening.repMin}-{oefening.repMax}{oefening.perKant ? '/kant' : ''} · RIR {oefening.rirMin}-{oefening.rirMax}
        </span>
      </div>

      <VorigeRegel oefening={oefening} />

      <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
        {sets.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 6, alignItems: 'center' }}>
            <span style={{ display: 'grid', width: 58, lineHeight: 1.15 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Set {i + 1}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>{vorigeSetLabel(oefening.vorige[i])}</span>
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Stepper onClick={() => stapGewicht(i, -oefening.stap)} icon={<Minus size={13} />} />
              <input inputMode="decimal" value={r.gewicht} onChange={(e) => zet(i, 'gewicht', e.target.value)} placeholder="kg" style={veldStijl(64)} aria-label={`Gewicht set ${i + 1}`} />
              <Stepper onClick={() => stapGewicht(i, oefening.stap)} icon={<Plus size={13} />} />
            </div>
            <input inputMode="numeric" value={r.reps} onChange={(e) => zet(i, 'reps', e.target.value)} placeholder="reps" style={veldStijl(56)} aria-label={`Reps set ${i + 1}`} />
            <button type="button" onClick={() => void log(i)} aria-label={`Set ${i + 1} loggen`} style={logKnopStijl(r.gelogd)}>
              <Check size={16} strokeWidth={2.6} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/** "60×8" voor de vorige keer van deze set, of "—" als je 'm toen niet deed. */
function vorigeSetLabel(set: VorigeSet | undefined): string {
  if (!set || set.gewichtKg == null) return '—'
  const reps = set.herhalingen != null ? `×${set.herhalingen}` : ''
  return `${set.gewichtKg}${reps}`
}

function VorigeRegel({ oefening }: { oefening: OefeningVandaag }) {
  const vorige = oefening.vorige.filter((s) => s.gewichtKg != null)
  const kleur = oefening.advies === 'let_op' ? 'var(--status-aandacht)' : 'var(--text-4)'
  return (
    <div style={{ marginTop: 4, display: 'grid', gap: 2 }}>
      {vorige.length > 0 ? (
        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
          Vorige: {vorige[0]?.gewichtKg} kg × {vorige.map((s) => s.herhalingen ?? '?').join('/')}
        </span>
      ) : (
        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Eerste keer — kies je gewicht.</span>
      )}
      {oefening.adviesUitleg ? (
        <span style={{ fontSize: 11.5, color: kleur, fontWeight: 600 }}>{oefening.adviesUitleg}</span>
      ) : null}
    </div>
  )
}

function Afronden({ trainingId, onKlaar }: { trainingId: string; onKlaar: () => Promise<void> }) {
  const [bezig, setBezig] = useState(false)
  const rond = useCallback(async () => {
    setBezig(true)
    const uit = await haalJson('/api/lifeos/blok/afronden', leesNiets, { ...JSON_POST, body: JSON.stringify({ trainingId, rpe: null, duurMinuten: null }) })
    if (uit.ok) await onKlaar()
    setBezig(false)
  }, [trainingId, onKlaar])
  return (
    <Knop onClick={() => void rond()} disabled={bezig}>
      <Check size={15} strokeWidth={2.2} aria-hidden /> {bezig ? 'Bezig…' : 'Sessie afronden'}
    </Knop>
  )
}

// ─── Cardio + rust: alleen tonen (loggen komt in ronde 2) ────────────────────

function CardioInfo({ data }: { data: BlokVandaag }) {
  const c = data.cardio
  if (!c) return null
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
        Doelduur {c.duurBereik[0]}–{c.duurBereik[1]} min · RPE {c.rpeDoel[0]}-{c.rpeDoel[1]}
        {c.hartslagZone ? ` · HR ${c.hartslagZone[0]}-${c.hartslagZone[1]}%` : ''}
        {c.rondes ? ` · ${c.rondes} rondes` : ''}
      </p>
      {c.stations ? (
        <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 3 }}>
          {c.stations.map((s, i) => (
            <li key={i} style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-2)' }}>{s.naam}</strong> — {s.doelWaarde} {s.eenheid}
              {s.belasting ? ` (${s.belasting})` : ''}
            </li>
          ))}
        </ol>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 3 }}>
          {c.toelichting.map((t, i) => (
            <li key={i} style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RustInfo({ data }: { data: BlokVandaag }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
      {(data.rust?.toelichting ?? []).map((t, i) => (
        <li key={i} style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>{t}</li>
      ))}
    </ul>
  )
}

// ─── Kleine bouwstenen ───────────────────────────────────────────────────────

function Stepper({ onClick, icon }: { onClick: () => void; icon: ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ width: 30, height: 34, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg-raised)', color: 'var(--text-2)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
      {icon}
    </button>
  )
}

const toggleStijl = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-3)', background: 'transparent', border: 'none', padding: '2px 0', cursor: 'pointer' } as const

function veldStijl(w: number): CSSProperties {
  return { width: w, height: 34, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg-app)', color: 'var(--text-1)', fontSize: 15, textAlign: 'center', fontFamily: 'var(--font-mono)' }
}

function logKnopStijl(gelogd: boolean): CSSProperties {
  return { width: 40, height: 34, borderRadius: 8, border: '1px solid var(--line)', background: gelogd ? 'var(--brand)' : 'var(--bg-raised)', color: gelogd ? 'var(--bg-app)' : 'var(--text-3)', display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'background 150ms var(--ease)' }
}
