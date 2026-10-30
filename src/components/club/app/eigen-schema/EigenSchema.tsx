'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layers, ListPlus, Sparkles, UserRound } from 'lucide-react'
import type { Maker } from '@/lib/club/training/lid-schemas/regels'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { EIGEN_SCHEMA } from '@/lib/aiyourgym/taal/woorden/ledenapp/eigen-schema'
import { useLedenappApi } from '../LedenappApi'
import { SchemaKiezer } from './SchemaKiezer'
import { SchemaMaker, type MakerStart } from './SchemaMaker'
import './eigen-schema.css'

// Zelf een schema maken in de ledenapp (besluit Kane 30-10-2026). Zonder
// schema: de keuze tussen snelle start en zelf samenstellen. Met schema: een
// rustige balk met de herkomst ("Van je trainer" of "Eigen schema") en
// "Mijn schema's". Alleen in de echte ledenapp (/mijn); in de voorvertoning
// in Club bestaat de leden-API niet en staat dit er niet.

type Open = { soort: 'kiezer' } | { soort: 'start' } | { soort: 'maker'; start: MakerStart } | null

interface Props {
  /** Van wie het actieve schema is; null als er nog geen schema is. */
  maker: Maker | null
}

export function EigenSchema({ maker }: Props) {
  const api = useLedenappApi()
  const router = useRouter()
  const t = useTekst(EIGEN_SCHEMA)
  const [open, setOpen] = useState<Open>(null)
  const sluit = useCallback(() => setOpen(null), [])
  const ververs = useCallback(() => router.refresh(), [router])
  const bouw = api.lidTraining
  const url = useCallback((pad: string) => (bouw ? bouw(pad) : ''), [bouw])
  if (!bouw) return null

  const klaar = () => {
    setOpen(null)
    router.refresh()
  }

  return (
    <>
      {maker === null ? (
        <StartKeuze onKies={(start) => setOpen({ soort: 'maker', start })} />
      ) : (
        <div className="club-es-balk">
          <span className={`club-es-herkomst${maker === 'trainer' ? ' club-es-herkomst--trainer' : ''}`}>
            {maker === 'trainer' ? <UserRound aria-hidden size={15} /> : <Sparkles aria-hidden size={15} />}
            {maker === 'trainer' ? t.herkomst.trainer : t.herkomst.eigen}
          </span>
          <button type="button" className="club-lidapp-tekstknop club-es-mijn" onClick={() => setOpen({ soort: 'kiezer' })}>
            <Layers aria-hidden size={16} /> {t.mijn.knop}
          </button>
        </div>
      )}
      {open?.soort === 'kiezer' && (
        <SchemaKiezer url={url} onSluit={sluit} onVeranderd={ververs} onAanpassen={(id) => setOpen({ soort: 'maker', start: { soort: 'bewerk', id } })} onNieuw={() => setOpen({ soort: 'start' })} />
      )}
      {open?.soort === 'start' && (
        <div className="club-lidapp-blad-scherm" onMouseDown={(e) => e.target === e.currentTarget && sluit()}>
          <div className="club-lidapp-blad" role="dialog" aria-modal="true" aria-label={t.start.kop}>
            <StartKeuze onKies={(start) => setOpen({ soort: 'maker', start })} />
          </div>
        </div>
      )}
      {open?.soort === 'maker' && <SchemaMaker start={open.start} url={url} onKlaar={klaar} onSluit={sluit} />}
    </>
  )
}

/** De twee manieren om te beginnen, groot en duidelijk: binnen twee minuten een schema. */
function StartKeuze({ onKies }: { onKies: (start: MakerStart) => void }) {
  const t = useTekst(EIGEN_SCHEMA).start
  return (
    <section className="club-es-start" aria-labelledby="es-start-kop">
      <div>
        <h3 id="es-start-kop">{t.kop}</h3>
        <p>{t.uitleg}</p>
      </div>
      <button type="button" className="club-es-startknop club-es-startknop--primair" onClick={() => onKies({ soort: 'snel' })}>
        <Sparkles aria-hidden size={22} />
        <span>
          <strong>{t.snel}</strong>
          <small>{t.snelUitleg}</small>
        </span>
      </button>
      <button type="button" className="club-es-startknop" onClick={() => onKies({ soort: 'leeg' })}>
        <ListPlus aria-hidden size={22} />
        <span>
          <strong>{t.leeg}</strong>
          <small>{t.leegUitleg}</small>
        </span>
      </button>
    </section>
  )
}
