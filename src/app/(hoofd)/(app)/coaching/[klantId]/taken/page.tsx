'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TaakFormulier, type NieuweTaakWaarden } from '@/components/coaching/TaakFormulier'
import { PIJLER_ICOON } from '@/components/coaching/TaakKaart'
import { CoachHeader, CoachSection, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import { PIJLER_LABELS, PIJLER_STIJL, targetOmschrijving, type TaakMetVoortgang } from '@/lib/coaching/taken'
import { ListChecks, Power, Trash2, ShieldAlert } from 'lucide-react'

export default function KlantTakenPagina() {
  const router = useRouter()
  const { klantId } = useParams<{ klantId: string }>()

  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [taken, setTaken] = useState<TaakMetVoortgang[]>([])
  const [formBezig, setFormBezig] = useState(false)
  const [formFout, setFormFout] = useState<string | null>(null)
  const [actieBezigId, setActieBezigId] = useState<string | null>(null)
  const [bevestigId, setBevestigId] = useState<string | null>(null)

  const laadTaken = useCallback(async () => {
    const res = await authFetch(`/api/coaching/taken?klant=${klantId}`)
    if (res.ok) {
      const data = await res.json() as { taken: TaakMetVoortgang[] }
      setTaken(data.taken ?? [])
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
      await laadTaken()
      setLaden(false)
    }
    laad()
  }, [router, laadTaken])

  async function maakTaak(waarden: NieuweTaakWaarden): Promise<boolean> {
    setFormBezig(true)
    setFormFout(null)
    const res = await authFetch('/api/coaching/taken', {
      method: 'POST',
      body: JSON.stringify({ klant_id: klantId, ...waarden }),
    })
    const data = await res.json() as { error?: string }
    setFormBezig(false)
    if (res.ok) { await laadTaken(); return true }
    setFormFout(data.error ?? 'Taak aanmaken mislukt.')
    return false
  }

  async function zetActief(taak: TaakMetVoortgang) {
    setActieBezigId(taak.id)
    const res = await authFetch(`/api/coaching/taken/${taak.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ actief: !taak.actief }),
    })
    if (res.ok) {
      setTaken(prev => prev.map(t => t.id === taak.id ? { ...t, actief: !t.actief } : t))
    }
    setActieBezigId(null)
  }

  async function verwijder(taakId: string) {
    setActieBezigId(taakId)
    const res = await authFetch(`/api/coaching/taken/${taakId}`, { method: 'DELETE' })
    if (res.ok) setTaken(prev => prev.filter(t => t.id !== taakId))
    setActieBezigId(null)
    setBevestigId(null)
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 900, margin: '0 auto' }}>

        <CoachHeader
          eyebrow="Coaching · Taken"
          titel="Coaching-taken"
          subtitel="Wijs terugkerende gewoontes toe die je klant helpt opbouwen."
          backHref={`/coaching/${klantId}`}
          backLabel="Terug naar klant"
        />

        {laden ? (
          <CoachSkeleton rijen={3} />
        ) : nietGevonden ? (
          <CoachEmpty
            icon={ShieldAlert}
            titel="Klant niet gevonden"
            tekst="Deze klant is niet (actief) aan jou gekoppeld."
            toon="wacht"
          />
        ) : (
          <>
            <Card className="mf-animate-up mf-delay-1" style={{ padding: '20px 22px', marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ListChecks size={16} aria-hidden style={{ color: 'var(--mf-green)' }} /> Nieuwe taak
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.5 }}>
                Je klant vinkt de taak af in het portaal; het telt mee voor hun wekelijkse streak.
              </p>
              <TaakFormulier onSubmit={maakTaak} bezig={formBezig} fout={formFout} />
            </Card>

            <CoachSection titel="Toegewezen taken">
              {taken.length === 0 ? (
                <CoachEmpty
                  icon={ListChecks}
                  titel="Nog geen taken"
                  tekst="Voeg hierboven de eerste gewoonte toe die je deze klant wilt laten opbouwen."
                />
              ) : (
                <ul className="mf-coach-stagger" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {taken.map(t => {
                  const stijl = PIJLER_STIJL[t.pijler]
                  const Icoon = PIJLER_ICOON[t.pijler]
                  return (
                    <li key={t.id}>
                      <Card style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: t.actief ? 1 : 0.62 }}>
                        <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: stijl.bg, color: stijl.color }}>
                          <Icoon size={18} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{t.titel}</p>
                            {!t.actief && <Badge variant="neutral" style={{ fontSize: 10, padding: '2px 8px' }}>Inactief</Badge>}
                          </div>
                          {t.beschrijving && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.5 }}>{t.beschrijving}</p>}
                          <p style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, marginTop: 4 }}>
                            {PIJLER_LABELS[t.pijler]} · {targetOmschrijving(t)} · {t.deze_week_gehaald}/{t.target_per_week} deze week
                          </p>
                        </div>

                        {bevestigId === t.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <Button variant="danger" size="sm" loading={actieBezigId === t.id} onClick={() => verwijder(t.id)}>Verwijder</Button>
                            <Button variant="ghost" size="sm" onClick={() => setBevestigId(null)}>Annuleer</Button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <Button
                              variant="ghost" size="sm"
                              loading={actieBezigId === t.id}
                              onClick={() => zetActief(t)}
                              leftIcon={<Power size={14} aria-hidden />}
                              aria-label={t.actief ? `${t.titel} deactiveren` : `${t.titel} activeren`}
                            >
                              {t.actief ? 'Pauzeer' : 'Activeer'}
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => setBevestigId(t.id)}
                              leftIcon={<Trash2 size={14} aria-hidden />}
                              aria-label={`${t.titel} verwijderen`}
                              style={{ color: 'var(--mf-red)' }}
                            >
                              Verwijder
                            </Button>
                          </div>
                        )}
                      </Card>
                    </li>
                  )
                })}
                </ul>
              )}
            </CoachSection>
          </>
        )}
      </main>
    </div>
  )
}
