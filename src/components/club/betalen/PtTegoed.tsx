'use client'

import { useEffect, useState, useTransition } from 'react'
import { Ticket, Undo2 } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { isPtAfspraakType } from '@/lib/club/betalen/regels'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

// Bij een afspraak voor personal training: een sessie afboeken van het
// PT-pakket van het lid (of dat ongedaan maken). Staat betalen uit, of is het
// geen PT-afspraak, dan toont dit niets.

interface Stand {
  saldo: number
  afgeboekt: boolean
}

/** De stand van de server, of null (betalen uit, geen PT-afspraak of een fout: dan tonen we niets). */
async function haalStand(url: string): Promise<Stand | null> {
  const res = await fetch(url, { cache: 'no-store' }).catch(() => null)
  const data: unknown = res?.ok ? await res.json().catch(() => null) : null
  const d = data as { beschikbaar?: unknown; saldo?: unknown; afgeboekt?: unknown } | null
  return d?.beschikbaar === true && typeof d.saldo === 'number' ? { saldo: d.saldo, afgeboekt: d.afgeboekt === true } : null
}

export function PtTegoed({ afspraakId, typeNaam }: { afspraakId: string; typeNaam: string }) {
  const isPt = isPtAfspraakType(typeNaam)
  const url = `/api/club/afspraken/${afspraakId}/tegoed`
  const [stand, setStand] = useState<Stand | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, start] = useTransition()
  const t = useTekst(BETALEN).pt

  useEffect(() => {
    if (!isPt) return
    let weg = false
    void haalStand(url).then((s) => {
      if (!weg) setStand(s)
    })
    return () => {
      weg = true
    }
  }, [isPt, url])

  if (!isPt || !stand) return null

  function wijzig(methode: 'POST' | 'DELETE') {
    start(async () => {
      setFout(null)
      const uit = await stuur(url, methode)
      if (!uit.ok) setFout(uit.fout)
      setStand(await haalStand(url))
    })
  }

  return (
    <div className="club-acties" role="group" aria-label={t.label}>
      {stand.afgeboekt ? (
        <>
          <span className="club-chip">{t.afgeboekt(stand.saldo)}</span>
          <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => wijzig('DELETE')}><Undo2 size={15} aria-hidden /> {t.terugzetten}</button>
        </>
      ) : (
        <button type="button" className="club-knop club-knop--klein" disabled={bezig || stand.saldo === 0} onClick={() => wijzig('POST')}>
          <Ticket size={15} aria-hidden /> {stand.saldo > 0 ? t.afboeken(stand.saldo) : t.geen}
        </button>
      )}
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </div>
  )
}
