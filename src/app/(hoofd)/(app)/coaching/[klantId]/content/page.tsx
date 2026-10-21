'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { CoachHeader, CoachSection, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import { ContentFormulier, type ContentWaarden } from '@/components/coaching/ContentFormulier'
import { ContentBeheerRij } from '@/components/coaching/ContentBeheerRij'
import type { CoachingContent } from '@/lib/coaching/content'
import { BookOpen, ShieldAlert, Pencil } from 'lucide-react'

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

  const gepubliceerd = lijst.filter(c => c.gepubliceerd).length

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 780, margin: '0 auto' }}>
        <CoachHeader
          eyebrow="Mindset & stress"
          titel="Mindset & stress"
          subtitel={`Schrijf lessen en opdrachten en lever ze aan ${klantNaam} of aan al je klanten. Zij lezen wat je publiceert.`}
          backHref={`/coaching/${klantId}`}
          backLabel="Terug naar klant"
          rechts={!laden && !nietGevonden ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px',
              borderRadius: 999, fontSize: 12.5, fontWeight: 700,
              color: 'var(--mf-purple)', background: 'var(--mf-purple-light)',
              border: '1px solid color-mix(in srgb, var(--mf-purple) 30%, transparent)',
            }}>
              <BookOpen size={14} aria-hidden /> {gepubliceerd} gepubliceerd
            </span>
          ) : undefined}
        />

        {laden ? (
          <CoachSkeleton rijen={3} />
        ) : nietGevonden ? (
          <CoachEmpty
            icon={ShieldAlert}
            toon="wacht"
            titel="Klant niet gevonden"
            tekst="Deze klant is niet (actief) aan jou gekoppeld."
          />
        ) : (
          <>
            <Card className="mf-animate-up mf-delay-1" style={{ padding: '22px 24px', marginBottom: 26 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <span aria-hidden style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: 'var(--mf-purple-light)', color: 'var(--mf-purple)',
                }}>
                  {bewerkItem ? <Pencil size={17} aria-hidden /> : <BookOpen size={18} aria-hidden />}
                </span>
                <div>
                  <h2 className="mf-h3">{bewerkItem ? 'Content bewerken' : 'Nieuwe content'}</h2>
                  <p className="mf-caption" style={{ marginTop: 2 }}>
                    {bewerkItem ? 'Pas een bestaande les of opdracht aan.' : 'Een les of opdracht voor mindset & stress.'}
                  </p>
                </div>
              </div>
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

            <div className="mf-animate-up mf-delay-2">
              <CoachSection titel="Aangemaakte content">
                {lijst.length === 0 ? (
                  <CoachEmpty
                    icon={BookOpen}
                    titel="Nog geen content"
                    tekst="Voeg hierboven je eerste mindset- of stress-les of -opdracht toe."
                  />
                ) : (
                  <ul className="mf-coach-stagger" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              </CoachSection>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
