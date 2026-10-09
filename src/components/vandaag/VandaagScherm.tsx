'use client'

// Container voor /1: haalt de kaart op, verstuurt de check-in en de keuzes per
// actie. De kaart zelf en het formulier zijn presentational.

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { authFetch } from '@/lib/auth/auth-fetch'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import type { Actie, CheckIn, Kaart } from '@/lib/vandaag/types'
import { CheckInFormulier } from './CheckInFormulier'
import { VandaagKaart, type Keuze } from './VandaagKaart'
import { VandaagKader } from './VandaagKader'

type Status = { soort: 'laden' } | { soort: 'fout'; tekst: string } | { soort: 'klaar'; kaart: Kaart }

async function leesFout(res: Response, standaard: string): Promise<string> {
  const body: unknown = await res.json().catch(() => null)
  if (body && typeof body === 'object' && 'fout' in body && typeof body.fout === 'string') return body.fout
  return standaard
}

type Geladen =
  | { soort: 'uitgelogd' }
  | { soort: 'fout'; tekst: string }
  | { soort: 'klaar'; kaart: Kaart; gekozen: Record<string, Keuze> }

/** Haalt de kaart op zonder state aan te raken; de caller beslist wat ermee gebeurt. */
async function haalKaart(): Promise<Geladen> {
  try {
    const res = await authFetch('/api/v1/vandaag')
    if (res.status === 401) return { soort: 'uitgelogd' }
    if (!res.ok) return { soort: 'fout', tekst: await leesFout(res, 'Je kaart kon niet worden geladen.') }
    const data = (await res.json()) as { kaart: Kaart; gekozen?: Record<string, Keuze> }
    return { soort: 'klaar', kaart: data.kaart, gekozen: data.gekozen ?? {} }
  } catch {
    return { soort: 'fout', tekst: 'Geen verbinding. Controleer je internet en probeer het opnieuw.' }
  }
}

export function VandaagScherm() {
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState<Status>({ soort: 'laden' })
  const [gekozen, setGekozen] = useState<Record<string, Keuze>>({})
  const [inchecken, setInchecken] = useState(false)

  const verwerk = useCallback((uit: Geladen) => {
    if (uit.soort === 'uitgelogd') { router.replace('/login?next=/1'); return }
    if (uit.soort === 'fout') { setStatus(uit); return }
    setGekozen(uit.gekozen)
    setStatus({ soort: 'klaar', kaart: uit.kaart })
  }, [router])

  const laad = useCallback(() => haalKaart().then(verwerk), [verwerk])

  useEffect(() => {
    let actief = true
    void haalKaart().then((uit) => { if (actief) verwerk(uit) })
    return () => { actief = false }
  }, [verwerk])

  async function checkIn(waarden: CheckIn) {
    setInchecken(true)
    try {
      const res = await authFetch('/api/v1/vandaag/checkin', { method: 'POST', body: JSON.stringify(waarden) })
      if (!res.ok) { toast({ title: await leesFout(res, 'Inchecken lukte niet.'), variant: 'error' }); return }
      const data = (await res.json()) as { kaart: Kaart | null }
      if (data.kaart) setStatus({ soort: 'klaar', kaart: data.kaart })
      else await laad()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      toast({ title: 'Geen verbinding. Je check-in is niet opgeslagen.', variant: 'error' })
    } finally {
      setInchecken(false)
    }
  }

  async function kies(actie: Actie, keuze: Keuze) {
    if (status.soort !== 'klaar') return
    const vorige = gekozen
    setGekozen({ ...gekozen, [actie.id]: keuze })
    try {
      const res = await authFetch('/api/v1/vandaag/actie', {
        method: 'POST',
        body: JSON.stringify({ actie: actie.id, keuze, toon: status.kaart.toon }),
      })
      if (!res.ok) throw new Error(await leesFout(res, 'Opslaan lukte niet.'))
    } catch (fout) {
      setGekozen(vorige)
      toast({ title: fout instanceof Error ? fout.message : 'Opslaan lukte niet.', variant: 'error' })
    }
  }

  return (
    <VandaagKader
      rechts={
        <Link href="/1/plan" className="mf-pressable mf-vandaag-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-2)', textDecoration: 'none', minHeight: 40 }}>
          <CalendarDays size={16} aria-hidden /> Weekplan
        </Link>
      }
    >
      {status.soort === 'laden' && (
        <div aria-busy="true" aria-label="Je kaart wordt gemaakt" style={{ display: 'grid', gap: 16 }}>
          <Skeleton width="40%" height={14} />
          <Skeleton width="85%" height={44} />
          <Skeleton width="70%" height={16} />
          <Skeleton width="100%" height={120} />
        </div>
      )}
      {status.soort === 'fout' && (
        <div role="alert" style={{ display: 'grid', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 18, color: 'var(--text-1)' }}>{status.tekst}</p>
          <div><Button variant="secondary" onClick={() => { setStatus({ soort: 'laden' }); void laad() }}>Opnieuw proberen</Button></div>
        </div>
      )}
      {status.soort === 'klaar' && (
        <div style={{ display: 'grid', gap: 48 }}>
          <VandaagKaart kaart={status.kaart} gekozen={gekozen} onKies={(a, k) => void kies(a, k)} />
          {status.kaart.acties.some((a) => a.knop === 'checkin') && (
            <CheckInFormulier bezig={inchecken} onVerstuur={(w) => void checkIn(w)} />
          )}
        </div>
      )}
    </VandaagKader>
  )
}
