import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { LogRegel, SchemaKop } from '@/lib/club/training/rijen'
import type { SchemaStatus } from '@/lib/club/training/typen'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { toonDatum } from '@/lib/club/training/weergave'
import { SjabloonToepassen } from './SchemaActies'

const STATUS_CHIP: Record<SchemaStatus, string> = {
  concept: 'club-chip--info',
  actief: 'club-chip--ok',
  afgerond: 'club-chip--uit',
}

interface SchemaLijstProps {
  schemas: SchemaKop[]
  log: LogRegel[]
  trainers: Record<string, string>
  editorHref: string
  toonLid: boolean
}

function samenvatting(log: LogRegel[]): Map<string, { laatste: string; aantal: number }> {
  const uit = new Map<string, { laatste: string; aantal: number }>()
  for (const r of log) {
    if (!r.schemaId) continue
    const huidig = uit.get(r.schemaId)
    uit.set(r.schemaId, { laatste: huidig && huidig.laatste > r.op ? huidig.laatste : r.op, aantal: (huidig?.aantal ?? 0) + 1 })
  }
  return uit
}

/**
 * Schema's van leden als rijen: de hele rij opent de editor (ook op de telefoon).
 * Per rij: naam, lid, opbouw, status, trainer en wanneer er voor het laatst mee getraind is.
 */
export async function SchemaLijst({ schemas, log, trainers, editorHref, toonLid }: SchemaLijstProps) {
  const perSchema = samenvatting(log)
  const taal = await getTaal()
  const t = (await clubTekst(CLUB_TRAINING)).lijst
  const lb = await clubTekst(TRAINING_LABELS)
  return (
    <ul className="club-lijst club-kaart club-training-schemas">
      {schemas.map((s) => {
        const l = perSchema.get(s.id)
        const trainer = s.medewerkerId ? trainers[s.medewerkerId] ?? null : null
        return (
          <li key={s.id}>
            <Link href={editorHref.replace('__id__', s.id)} className="club-training-schemarij">
              <span className="club-training-schemarij-hoofd">
                <span className="club-training-schemarij-titel">
                  {toonLid && <span className="club-training-schemarij-lid">{s.lidNaam ?? t.lidOnbekend}</span>}
                  <strong>{s.naam}</strong>
                </span>
                <span className="club-rij-sub">
                  {[s.doel ? lb.doel[s.doel] : null, lb.niveau[s.niveau], t.dagen(s.dagTitels.length || 1), trainer ? t.trainer(trainer) : null].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="club-training-schemarij-getraind">
                {l ? <span><b className="club-getal">{l.aantal}x</b> {t.getraind(toonDatum(l.laatste, taal))}</span> : <span className="club-zacht">{t.nogNiet}</span>}
                {s.bijgewerktOp && <small>{t.bijgewerkt(toonDatum(s.bijgewerktOp, taal))}</small>}
              </span>
              <span className={`club-chip ${STATUS_CHIP[s.status]}`}>{lb.schemaStatus[s.status]}</span>
              <ChevronRight aria-hidden size={18} className="club-training-schemarij-pijl" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

interface SjabloonLijstProps {
  sjablonen: SchemaKop[]
  vestiging: string
  lid: { id: string; naam: string } | null
  editorHref: string
}

/** Sjablonen: herbruikbare schema's zonder lid, met een knop om toe te passen. */
export async function SjabloonLijst({ sjablonen, vestiging, lid, editorHref }: SjabloonLijstProps) {
  const lb = await clubTekst(TRAINING_LABELS)
  return (
    <ul className="club-lijst club-kaart club-training-sjablonen">
      {sjablonen.map((s) => (
        <li key={s.id} className="club-rij">
          <div className="club-rij-hoofd">
            <Link href={editorHref.replace('__id__', s.id)} className="club-rij-titel club-training-link">{s.naam}</Link>
            <span className="club-rij-sub">
              {[s.doel ? lb.doel[s.doel] : null, lb.niveau[s.niveau], s.dagTitels.filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
            </span>
          </div>
          <SjabloonToepassen sjabloonId={s.id} sjabloonNaam={s.naam} vestiging={vestiging} lid={lid} editorHref={editorHref} />
        </li>
      ))}
    </ul>
  )
}
