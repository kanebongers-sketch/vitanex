import Link from 'next/link'
import type { LogRegel, SchemaKop } from '@/lib/club/training/rijen'
import { DOEL_LABEL, NIVEAU_LABEL, SCHEMA_STATUS_LABEL, type SchemaStatus } from '@/lib/club/training/typen'
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

/** Schema's van leden: status, trainer en wanneer er voor het laatst mee getraind is. */
export function SchemaLijst({ schemas, log, trainers, editorHref, toonLid }: SchemaLijstProps) {
  const perSchema = samenvatting(log)
  return (
    <div className="club-tabel-wrap">
      <table className="club-tabel">
        <thead>
          <tr>
            <th scope="col">Schema</th>
            {toonLid && <th scope="col">Lid</th>}
            <th scope="col">Status</th>
            <th scope="col">Trainer</th>
            <th scope="col">Getraind</th>
            <th scope="col">Bijgewerkt</th>
          </tr>
        </thead>
        <tbody>
          {schemas.map((s) => {
            const l = perSchema.get(s.id)
            return (
              <tr key={s.id}>
                <td>
                  <Link href={editorHref.replace('__id__', s.id)}>{s.naam}</Link>
                  <div className="club-zacht club-training-klein">
                    {[s.doel ? DOEL_LABEL[s.doel] : null, NIVEAU_LABEL[s.niveau], `${s.dagTitels.length || 1} ${s.dagTitels.length === 1 ? 'dag' : 'dagen'}`].filter(Boolean).join(' · ')}
                  </div>
                </td>
                {toonLid && <td>{s.lidNaam ?? <span className="club-zacht">onbekend</span>}</td>}
                <td><span className={`club-chip ${STATUS_CHIP[s.status]}`}>{SCHEMA_STATUS_LABEL[s.status]}</span></td>
                <td>{s.medewerkerId && trainers[s.medewerkerId] ? trainers[s.medewerkerId] : <span className="club-zacht">geen</span>}</td>
                <td className="club-getal">{l ? `${l.aantal}x, laatst ${toonDatum(l.laatste)}` : <span className="club-zacht">nog niet</span>}</td>
                <td className="club-zacht">{s.bijgewerktOp ? toonDatum(s.bijgewerktOp) : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface SjabloonLijstProps {
  sjablonen: SchemaKop[]
  vestiging: string
  lid: { id: string; naam: string } | null
  editorHref: string
}

/** Sjablonen: herbruikbare schema's zonder lid, met een knop om toe te passen. */
export function SjabloonLijst({ sjablonen, vestiging, lid, editorHref }: SjabloonLijstProps) {
  return (
    <ul className="club-lijst club-kaart club-training-sjablonen">
      {sjablonen.map((s) => (
        <li key={s.id} className="club-rij">
          <div className="club-rij-hoofd">
            <Link href={editorHref.replace('__id__', s.id)} className="club-rij-titel club-training-link">{s.naam}</Link>
            <span className="club-rij-sub">
              {[s.doel ? DOEL_LABEL[s.doel] : null, NIVEAU_LABEL[s.niveau], s.dagTitels.filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
            </span>
          </div>
          <SjabloonToepassen sjabloonId={s.id} sjabloonNaam={s.naam} vestiging={vestiging} lid={lid} editorHref={editorHref} />
        </li>
      ))}
    </ul>
  )
}
