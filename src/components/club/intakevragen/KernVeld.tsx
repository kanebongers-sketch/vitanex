'use client'

import { PARQ_VRAGEN, type ParqSleutel } from '@/lib/club/training/intake'
import { DOEL_LABEL, DOELEN, NIVEAU_LABEL, NIVEAUS, VOORKEUR_LABEL, VOORKEUREN, ZONE_LABEL, ZONES } from '@/lib/club/training/typen'
import { PARQ_PREFIX } from '@/lib/club/intakevragen/kern'
import type { IntakeVraag } from '@/lib/club/intakevragen/soorten'
import { KeuzeChips, wissel } from '@/components/club/training/KeuzeChips'
import type { IntakeStaat } from '@/components/club/training/intake-staat'
import { JaNee } from './JaNee'

interface KernVeldProps {
  vraag: IntakeVraag
  s: IntakeStaat
  zet: (deel: Partial<IntakeStaat>) => void
}

type TekstVeld = 'motivatie' | 'blessureToelichting' | 'klachten' | 'medicatie'

const TEKST: Record<string, { veld: TekstVeld; max: number }> = {
  motivatie: { veld: 'motivatie', max: 500 },
  blessure_toelichting: { veld: 'blessureToelichting', max: 500 },
  klachten: { veld: 'klachten', max: 500 },
  medicatie: { veld: 'medicatie', max: 300 },
}

function tekstDeel(veld: TekstVeld, waarde: string): Partial<IntakeStaat> {
  const deel: Partial<IntakeStaat> = {}
  deel[veld] = waarde
  return deel
}

const PARQ_SLEUTELS: readonly string[] = PARQ_VRAGEN.map((p) => p.sleutel)

function Schuif({ label, waarde, min, max, stap, onZet }: { label: string; waarde: number; min: number; max: number; stap: number; onZet: (n: number) => void }) {
  return (
    <label className="club-veld">
      <span>{label}: <strong className="club-training-waarde">{waarde}</strong></span>
      <input type="range" min={min} max={max} step={stap} value={waarde} onChange={(e) => onZet(Number(e.target.value))} className="club-training-schuif" />
    </label>
  )
}

/** Een vaste vraag van Club: het veld dat bij de sleutel hoort, met de tekst van de sportschool. */
export function KernVeld({ vraag, s, zet }: KernVeldProps) {
  const sleutel = vraag.sleutel ?? ''
  const tekst = TEKST[sleutel]
  if (tekst) {
    return (
      <label className="club-veld">
        <span>{vraag.vraag}</span>
        <input className="club-invoer" value={s[tekst.veld]} maxLength={tekst.max} onChange={(e) => zet(tekstDeel(tekst.veld, e.target.value))} />
      </label>
    )
  }
  if (sleutel.startsWith(PARQ_PREFIX) && PARQ_SLEUTELS.includes(sleutel.slice(PARQ_PREFIX.length))) {
    const p = sleutel.slice(PARQ_PREFIX.length) as ParqSleutel
    const ja = s.parqJa.includes(p)
    const beantwoord = s.parqBeantwoord.includes(p)
    const kies = (waarde: boolean) =>
      zet({
        parqJa: waarde ? [...s.parqJa.filter((x) => x !== p), p] : s.parqJa.filter((x) => x !== p),
        parqBeantwoord: beantwoord ? s.parqBeantwoord : [...s.parqBeantwoord, p],
      })
    return <JaNee label={vraag.vraag} waarde={beantwoord ? ja : null} onKies={kies} jaLetOp />
  }
  switch (sleutel) {
    case 'doelen':
      return <KeuzeChips legend={vraag.vraag} opties={DOELEN} labels={DOEL_LABEL} gekozen={s.doelen} onWissel={(d) => zet({ doelen: wissel(s.doelen, d) })} />
    case 'niveau':
      return <KeuzeChips legend={vraag.vraag} opties={NIVEAUS} labels={NIVEAU_LABEL} gekozen={s.niveau ? [s.niveau] : []} onWissel={(n) => zet({ niveau: n })} enkel />
    case 'voorkeuren':
      return <KeuzeChips legend={vraag.vraag} opties={VOORKEUREN} labels={VOORKEUR_LABEL} gekozen={s.voorkeuren} onWissel={(v) => zet({ voorkeuren: wissel(s.voorkeuren, v) })} />
    case 'blessures':
      return <KeuzeChips legend={vraag.vraag} opties={ZONES} labels={ZONE_LABEL} gekozen={s.blessures} onWissel={(z) => zet({ blessures: wissel(s.blessures, z) })} />
    case 'dagen_per_week':
      return <Schuif label={vraag.vraag} waarde={s.dagenPerWeek} min={1} max={7} stap={1} onZet={(n) => zet({ dagenPerWeek: n })} />
    case 'minuten_per_sessie':
      return <Schuif label={vraag.vraag} waarde={s.minutenPerSessie} min={15} max={180} stap={15} onZet={(n) => zet({ minutenPerSessie: n })} />
    default:
      return null
  }
}
