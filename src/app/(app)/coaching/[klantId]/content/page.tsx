'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ContentFormulier, type ContentWaarden } from '@/components/coaching/ContentFormulier'
import { ContentBeheerRij } from '@/components/coaching/ContentBeheerRij'
import type { CoachingContent } from '@/lib/coaching/content'
import { ArrowLeft, BookOpen } from 'lucide-react'

/** Bouwt de POST/PATCH-payload; klant_id gaat alleen mee bij aanmaken. */
function bouwPayload(waarden: ContentWaarden, klantId: string, nieuw: boolean) {
  const basis = {
    titel: waarden.titel,
    inhoud: waarden.inhoud,
    pijler: waarden.pijler,
    type: waarden.type,
    media_url: waarden.media_url,
    gepubliceerd: waarden.gepubliceerd,
  }
  return nieuw ? { ...basis, klant_id: waarden.voorAlleKlanten ? null : klantId } : basis
}

export default function KlantContentPagina() {
  const router = useRouter()
  const { klantId } = useParams<{ klantId: string }>()

  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [klantNaam, setKlantNaam] = useState('Deze klant')
  const [lijst, setLijst] = useState<CoachingContent[]>([])
  const [formBezig, setFormBezig] = useState(false)
  const [formFout, setFormFout] = useState<string | null>(null)
  const [bewerkItem, setBewerkItem] = useState<CoachingContent | null>(null)
  const [actieBezigId, setActieBezigId] = useState<string | null>(null)
  const [bevestigId, setBevestigId] = useState<string | null>(null)

  const laadLijst = useCallback(async () => {
    const res = await authFetch(`/api/coaching/content?klant=${klantId}`)
    if (res.ok) {
      const data = await res.json() as { content: CoachingContent[] }
      setLijst(data.content ?? [])
    } else {
      setNietGevonden(true)
    }
  }, [klantId])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      if (!profiel || !['coach', 'admin'].includes(profiel.rol ?? '')) { router.push('/home'); return }
      const detail = await authFetch(`/api/coaching/klant/${klantId}`)
      if (detail.ok) {
        const data = await detail.json() as { klant: { naam: string } }
        if (data.klant?.naam) setKlantNaam(data.klant.naam)
      }
      await laadLijst()
      setLaden(false)
    }
    laad()
  }, [router, laadLijst, klantId])

  async function verstuurForm(waarden: ContentWaarden): Promise<boolean> {
    setFormBezig(true)
    setFormFout(null)
    const nieuw = bewerkItem === null
    const url = nieuw ? '/api/coaching/content' : `/api/coaching/content/${bewerkItem!.id}`
    const res = await authFetch(url, {
      method: nieuw ? 'POST' : 'PATCH',
      body: JSON.stringify(bouwPayload(waarden, klantId, nieuw)),
    })
    const data = await res.json() as { error?: string }
    setFormBezig(false)
    if (res.ok) { setBewerkItem(null); await laadLijst(); return true }
    setFormFout(data.error ?? 'Opslaan mislukt.')
    return false
  }

  async function togglePublicatie(item: CoachingContent) {
    setActieBezigId(item.id)
    const res = await authFetch(`/api/coaching/content/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ gepubliceerd: !item.gepubliceerd }),
    })
    if (res.ok) {
      const data = await res.json() as { content: CoachingContent }
      setLijst(prev => prev.map(c => c.id === item.id ? data.content : c))
    }
    setActieBezigId(null)
  }

  async function verwijder(id: string) {
    setActieBezigId(id)
    const res = await authFetch(`/api/coaching/content/${id}`, { method: 'DELETE' })
    if (res.ok) setLijst(prev => prev.filter(c => c.id !== id))
    setActieBezigId(null)
    setBevestigId(null)
  }

  const initieel: ContentWaarden | undefined = bewerkItem ? {
    titel: bewerkItem.titel, inhoud: bewerkItem.inhoud, pijler: bewerkItem.pijler, type: bewerkItem.type,
    media_url: bewerkItem.media_url ?? '', voorAlleKlanten: bewerkItem.klant_id === null, gepubliceerd: bewerkItem.gepubliceerd,
  } : undefined

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 760, margin: '0 auto' }}>

        <Link href={`/coaching/${klantId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={15} aria-hidden /> Terug naar klant
        </Link>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Mindset & stress
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Schrijf lessen en opdrachten en lever ze aan {klantNaam} of aan al je klanten. Zij lezen wat je publiceert.
          </p>
        </header>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : nietGevonden ? (
          <Card style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Klant niet gevonden</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Deze klant is niet (actief) aan jou gekoppeld.</p>
          </Card>
        ) : (
          <>
            <Card style={{ padding: '20px 22px', marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} aria-hidden style={{ color: 'var(--mf-purple)' }} />
                {bewerkItem ? 'Content bewerken' : 'Nieuwe content'}
              </h2>
              <ContentFormulier
                key={bewerkItem?.id ?? 'nieuw'}
                onSubmit={verstuurForm}
                bezig={formBezig}
                fout={formFout}
                klantNaam={klantNaam}
                initieel={initieel}
                onAnnuleer={() => { setBewerkItem(null); setFormFout(null) }}
              />
            </Card>

            {lijst.length === 0 ? (
              <Card style={{ padding: 8 }}>
                <EmptyState
                  icon={BookOpen}
                  title="Nog geen content"
                  description="Voeg hierboven je eerste mindset- of stress-les of -opdracht toe."
                />
              </Card>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lijst.map(c => (
                  <li key={c.id}>
                    <ContentBeheerRij
                      content={c}
                      bezig={actieBezigId === c.id}
                      bevestigVerwijder={bevestigId === c.id}
                      onBewerk={() => { setBewerkItem(c); setFormFout(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      onTogglePublicatie={() => togglePublicatie(c)}
                      onVraagVerwijder={() => setBevestigId(c.id)}
                      onVerwijder={() => verwijder(c.id)}
                      onAnnuleerVerwijder={() => setBevestigId(null)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  )
}
