'use client'

// Container voor /1: haalt de kaart op, verstuurt de check-in en de keuzes per
// actie. De kaart zelf en het formulier zijn presentational.

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { authFetch } from '@/lib/auth/auth-fetch'
import { syncGezondheidsdata } from '@/lib/health/health-sync'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import type { Actie, CheckIn, Kaart } from '@/lib/vandaag/types'
import type { Rekening } from '@/lib/vandaag/rekening'
import { bijgewerktRegel, type Bijgewerkt } from '@/lib/vandaag/bijgewerkt'
import { CheckInFormulier } from './CheckInFormulier'
import { VandaagKaart, type Keuze } from './VandaagKaart'
import { VandaagKader } from './VandaagKader'
import { RekeningPaneel } from './RekeningPaneel'

type Status = { soort: 'laden' } | { soort: 'fout'; tekst: string } | { soort: 'klaar'; kaart: Kaart }

async function leesFout(res: Response, standaard: string): Promise<string> {
  const body: unknown = await res.json().catch(() => null)
  if (body && typeof body === 'object' && 'fout' in body && typeof body.fout === 'string') return body.fout
  return standaard
}

type Geladen =
  | { soort: 'uitgelogd' }
  | { soort: 'fout'; tekst: string }
  | { soort: 'klaar'; kaart: Kaart; gekozen: Record<string, Keuze>; rekening: Rekening | null; bijgewerkt: Bijgewerkt | null }

/** Haalt de kaart op zonder state aan te raken; de caller beslist wat ermee gebeurt. */
async function haalKaart(): Promise<Geladen> {
  try {
    const res = await authFetch('/api/v1/vandaag')
    if (res.status === 401) return { soort: 'uitgelogd' }
    if (!res.ok) return { soort: 'fout', tekst: await leesFout(res, 'Je kaart kon niet worden geladen.') }
    const data = (await res.json()) as { kaart: Kaart; gekozen?: Record<string, Keuze>; rekening?: Rekening; bijgewerkt?: Bijgewerkt | null }
    return { soort: 'klaar', kaart: data.kaart, gekozen: data.gekozen ?? {}, rekening: data.rekening ?? null, bijgewerkt: data.bijgewerkt ?? null }
  } catch {
    return { soort: 'fout', tekst: 'Geen verbinding. Controleer je internet en probeer het opnieuw.' }
  }
}

function BijgewerktTekst({ bijgewerkt }: { bijgewerkt: Bijgewerkt | null }) {
  const regel = bijgewerktRegel(bijgewerkt)
  if (!regel) return null
  return (
    <p style={{ margin: '-24px 0 0', fontSize: 13, lineHeight: 1.5, color: regel.oud ? 'var(--text-2)' : 'var(--text-3)' }}>
      {regel.tekst}
    </p>
  )
}

export function VandaagScherm() {
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState<Status>({ soort: 'laden' })
  const [gekozen, setGekozen] = useState<Record<string, Keuze>>({})
  const [inchecken, setInchecken] = useState(false)
  const [rekening, setRekening] = useState<Rekening | null>(null)
  const [bijgewerkt, setBijgewerkt] = useState<Bijgewerkt | null>(null)
  const kopRef = useRef<HTMLHeadingElement>(null)

  const verwerk = useCallback((uit: Geladen) => {
    if (uit.soort === 'uitgelogd') { router.replace('/login?next=/1'); return }
    if (uit.soort === 'fout') { setStatus(uit); return }
    setGekozen(uit.gekozen)
    setRekening(uit.rekening)
    setBijgewerkt(uit.bijgewerkt)
    setStatus({ soort: 'klaar', kaart: uit.kaart })
  }, [router])

  const laad = useCallback(() => haalKaart().then(verwerk), [verwerk])

  useEffect(() => {
    let actief = true
    void haalKaart().then((uit) => { if (actief) verwerk(uit) })
    // In de app: eerst de kaart tonen, dan op de achtergrond verse slaap en
    // stappen ophalen. Kwam er iets nieuws binnen, dan de kaart opnieuw maken.
    if (Capacitor.isNativePlatform()) {
      void syncGezondheidsdata()
        .then((uitkomst) => (uitkomst && uitkomst.opgeslagen > 0 ? haalKaart() : null))
        .then((uit) => { if (uit && actief) verwerk(uit) })
    }
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
      const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: rustig ? 'auto' : 'smooth' })
      // Het formulier verdwijnt; zet de focus op de nieuwe kaart zodat die wordt voorgelezen.
      requestAnimationFrame(() => kopRef.current?.focus({ preventScroll: true }))
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
        <div role="status" aria-busy="true" style={{ display: 'grid', gap: 16 }}>
          <h1 className="sr-only">Vandaag</h1>
          <span className="sr-only">Je kaart wordt gemaakt…</span>
          <Skeleton width="40%" height={14} />
          <Skeleton width="85%" height={44} />
          <Skeleton width="70%" height={16} />
          <Skeleton width="100%" height={120} />
        </div>
      )}
      {status.soort === 'fout' && (
        <div role="alert" style={{ display: 'grid', gap: 16 }}>
          <h1 className="sr-only">Vandaag</h1>
          <p style={{ margin: 0, fontSize: 18, color: 'var(--text-1)' }}>{status.tekst}</p>
          <div><Button variant="secondary" onClick={() => { setStatus({ soort: 'laden' }); void laad() }}>Opnieuw proberen</Button></div>
        </div>
      )}
      {status.soort === 'klaar' && (
        <div style={{ display: 'grid', gap: 48 }}>
          <VandaagKaart kopRef={kopRef} kaart={status.kaart} gekozen={gekozen} onKies={(a, k) => void kies(a, k)} />
          <BijgewerktTekst bijgewerkt={bijgewerkt} />
          {status.kaart.acties.some((a) => a.knop === 'checkin') && (
            <CheckInFormulier bezig={inchecken} onVerstuur={(w) => void checkIn(w)} />
          )}
          {rekening && <RekeningPaneel rekening={rekening} />}
        </div>
      )}
    </VandaagKader>
  )
}
