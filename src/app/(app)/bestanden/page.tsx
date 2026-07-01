'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { FileText } from 'lucide-react'


interface Bestand { id: string; bestandsnaam: string; aangemaakt_op: string; gedeeld_met_hr: boolean; categorie: string }
interface Rapport { id: string; type: string; titel: string; inhoud: string; aangemaakt_op: string }
interface DiscInzending { primair_profiel: string; d_score: number; i_score: number; s_score: number; c_score: number; aangemaakt_op: string }

const TYPE_KLEUR: Record<string, string> = { disc: 'var(--mf-blue)', checkin: 'var(--mf-green)', onboarding: 'var(--mf-purple)', algemeen: 'var(--text-2)' }
const TYPE_GROEPEN: { key: string; label: string }[] = [
  { key: 'disc', label: 'DISC' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'algemeen', label: 'Algemeen' },
]

const DISC_KLEUR: Record<string, string> = { D: 'var(--mf-red)', I: 'var(--mf-amber)', S: 'var(--mf-green)', C: 'var(--mf-blue)' }

export default function BestandenPage() {
  const router = useRouter()
  const [geladen, setGeladen] = useState(false)
  const [userId, setUserId] = useState('')
  const [actieveTab, setActieveTab] = useState<'bestanden' | 'rapporten'>('bestanden')
  const [bestanden, setBestanden] = useState<Bestand[]>([])
  const [rapporten, setRapporten] = useState<Rapport[]>([])
  const [discProfiel, setDiscProfiel] = useState<DiscInzending | null>(null)
  const [uploaden, setUploaden] = useState(false)
  const [openRapport, setOpenRapport] = useState<string | null>(null)
  const [fout, setFout] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      await Promise.all([laadBestanden(user.id), laadRapporten(user.id), laadDiscProfiel(user.id)])
      setGeladen(true)
    }
    init()
  }, [router])

  async function laadBestanden(uid: string) {
    try {
      const res = await authFetch('/api/documenten/lijst?userId=' + uid)
      if (res.ok) {
        const json = await res.json() as { documenten?: Bestand[] }
        setBestanden(json.documenten ?? [])
      }
    } catch { setFout("Bestanden laden mislukt") }
  }

  async function laadRapporten(uid: string) {
    try {
      const { data } = await supabase.from('ai_rapporten').select('id, type, titel, inhoud, aangemaakt_op').eq('user_id', uid).order('aangemaakt_op', { ascending: false })
      setRapporten(data ?? [])
    } catch { setFout("Rapporten laden mislukt") }
  }

  async function laadDiscProfiel(uid: string) {
    try {
      const { data } = await supabase
        .from('disc_inzendingen')
        .select('primair_profiel, d_score, i_score, s_score, c_score, aangemaakt_op')
        .eq('user_id', uid)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) setDiscProfiel(data)
    } catch { /* stil falen */ }
  }

  async function toggleDelen(bestandId: string, huidig: boolean) {
    const { error } = await supabase.from('documenten').update({ gedeeld_met_hr: !huidig }).eq('id', bestandId).eq('user_id', userId)
    if (!error) setBestanden(prev => prev.map(b => b.id === bestandId ? { ...b, gedeeld_met_hr: !huidig } : b))
  }

  async function uploadBestand(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploaden(true)
    try {
      const form = new FormData()
      form.append('bestand', file); form.append('userId', userId)
      const res = await authFetch('/api/documenten/upload', { method: 'POST', body: form })
      if (res.ok) await laadBestanden(userId)
      else setFout("Upload mislukt")
    } catch { setFout("Upload mislukt") }
    finally { setUploaden(false) }
  }

  function datumLabel(d: string) {
    return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const rapportenPerType = TYPE_GROEPEN.map(g => ({
    ...g,
    items: rapporten.filter(r => r.type === g.key),
  })).filter(g => g.items.length > 0)
  const overige = rapporten.filter(r => !TYPE_GROEPEN.some(g => g.key === r.type))

  if (!geladen) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--text-2)' }}>Laden...</span>
    </div>
  )

  const discScores: { key: string; label: string; score: number }[] = discProfiel ? [
    { key: 'D', label: 'D', score: discProfiel.d_score },
    { key: 'I', label: 'I', score: discProfiel.i_score },
    { key: 'S', label: 'S', score: discProfiel.s_score },
    { key: 'C', label: 'C', score: discProfiel.c_score },
  ] : []
  const maxScore = discScores.length > 0 ? Math.max(...discScores.map(s => s.score), 1) : 1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-1)' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Mijn bestanden &amp; rapporten</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: 28 }}>Beheer je documenten en bekijk je persoonlijke rapporten.</p>
        {fout && (
          <div style={{ background: 'color-mix(in srgb, var(--mf-red) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--mf-red) 32%, transparent)', borderRadius: 8, padding: 12, color: 'var(--mf-red)', marginBottom: 16 }}>{fout}</div>
        )}

        {/* DISC profiel kaart */}
        {discProfiel && (
          <div style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle) 100%)', border: '1px solid var(--border-strong)', borderRadius: 16, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Jouw DISC profiel</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: DISC_KLEUR[discProfiel.primair_profiel] ?? 'var(--text-1)', position: 'relative', display: 'inline-block' }}>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
                </span>
                <span style={{ position: 'relative', zIndex: 1 }}>{discProfiel.primair_profiel}</span>
              </span>
                <span style={{ fontSize: 15, color: 'var(--text-3)' }}>primair profiel</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{datumLabel(discProfiel.aangemaakt_op)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160, flex: 1, maxWidth: 220 }}>
              {discScores.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: DISC_KLEUR[s.key], width: 16 }}>{s.key}</span>
                  <div style={{ flex: 1, background: 'var(--border-strong)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((s.score / maxScore) * 100)}%`, height: '100%', background: DISC_KLEUR[s.key], borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', width: 28, textAlign: 'right' }}>{s.score}</span>
                </div>
              ))}
            </div>
            <div style={{ flexShrink: 0 }}>
              <button onClick={() => router.push('/disc')} style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Test opnieuw doen
              </button>
            </div>
          </div>
        )}
        {!discProfiel && (
          <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 16, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Jouw DISC profiel</div>
              <div style={{ color: 'var(--text-3)' }}>Je hebt de DISC-test nog niet gedaan.</div>
            </div>
            <button onClick={() => router.push('/disc')} style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Test doen
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['bestanden', 'rapporten'] as const).map(tab => (
            <button key={tab} onClick={() => setActieveTab(tab)} style={{ background: actieveTab === tab ? 'var(--mentaforce-primary)' : 'transparent', color: actieveTab === tab ? 'var(--bg-app)' : 'var(--text-3)', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {tab === 'bestanden' ? 'Mijn bestanden' : 'Mijn rapporten'}
            </button>
          ))}
        </div>

        {actieveTab === 'bestanden' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'inline-block', background: 'var(--mentaforce-primary)', color: 'var(--bg-app)', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: uploaden ? 'not-allowed' : 'pointer' }}>
                {uploaden ? 'Uploaden...' : '+ Bestand uploaden'}
                <input type="file" onChange={uploadBestand} style={{ display: "none" }} disabled={uploaden} />
              </label>
            </div>
            {bestanden.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>Nog geen bestanden geupload.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bestanden.map(b => (
                  <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.bestandsnaam}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{datumLabel(b.aangemaakt_op)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Deel met HR</span>
                      <button onClick={() => toggleDelen(b.id, b.gedeeld_met_hr)} role="switch" aria-checked={b.gedeeld_met_hr} aria-label={`Deel "${b.bestandsnaam}" met HR`} style={{ width: 44, height: 24, borderRadius: 12, background: b.gedeeld_met_hr ? 'var(--mentaforce-primary)' : 'var(--border-strong)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                        <span style={{ display: 'block', width: 18, height: 18, borderRadius: '50%', background: b.gedeeld_met_hr ? 'var(--bg-app)' : 'var(--text-1)', position: 'absolute', top: 3, left: b.gedeeld_met_hr ? 23 : 3, transition: 'left 0.2s' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {actieveTab === 'rapporten' && (
          <div>
            {rapporten.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }} aria-hidden="true"><FileText size={32} strokeWidth={1.5} color="var(--text-3)" /></div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Nog geen rapporten</div>
                <div style={{ fontSize: 14 }}>Je rapporten verschijnen hier na een check-in of DISC-test.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {rapportenPerType.map(groep => (
                  <div key={groep.key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ background: `color-mix(in srgb, ${TYPE_KLEUR[groep.key] ?? 'var(--text-2)'} 12%, transparent)`, color: TYPE_KLEUR[groep.key] ?? 'var(--text-2)', border: `1px solid color-mix(in srgb, ${TYPE_KLEUR[groep.key] ?? 'var(--text-2)'} 25%, transparent)`, borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>{groep.label}</span>
                      <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{groep.items.length} {groep.items.length === 1 ? 'rapport' : 'rapporten'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {groep.items.map(r => (
                        <RapportRij key={r.id} r={r} open={openRapport === r.id} onToggle={() => setOpenRapport(openRapport === r.id ? null : r.id)} datumLabel={datumLabel} />
                      ))}
                    </div>
                  </div>
                ))}
                {overige.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ background: 'color-mix(in srgb, var(--text-2) 12%, transparent)', color: 'var(--text-2)', border: '1px solid color-mix(in srgb, var(--text-2) 25%, transparent)', borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>Overig</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {overige.map(r => (
                        <RapportRij key={r.id} r={r} open={openRapport === r.id} onToggle={() => setOpenRapport(openRapport === r.id ? null : r.id)} datumLabel={datumLabel} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RapportRij({ r, open, onToggle, datumLabel }: { r: Rapport; open: boolean; onToggle: () => void; datumLabel: (d: string) => string }) {
  const TYPE_KLEUR: Record<string, string> = { disc: 'var(--mf-blue)', checkin: 'var(--mf-green)', onboarding: 'var(--mf-purple)', algemeen: 'var(--text-2)' }
  const TYPE_LABEL: Record<string, string> = { disc: 'DISC', checkin: 'Check-in', onboarding: 'Onboarding', algemeen: 'Algemeen' }
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ background: `color-mix(in srgb, ${TYPE_KLEUR[r.type] ?? 'var(--text-2)'} 12%, transparent)`, color: TYPE_KLEUR[r.type] ?? 'var(--text-2)', border: `1px solid color-mix(in srgb, ${TYPE_KLEUR[r.type] ?? 'var(--text-2)'} 25%, transparent)`, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{TYPE_LABEL[r.type] ?? r.type}</span>
          <span style={{ fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{datumLabel(r.aangemaakt_op)}</span>
          <span style={{ color: 'var(--text-2)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 16, color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.inhoud}</div>
          <button onClick={() => window.print()} style={{ marginTop: 14, background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-3)', borderRadius: 7, padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            Download als PDF
          </button>
        </div>
      )}
    </div>
  )
}
