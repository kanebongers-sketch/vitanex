'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/Navbar'

interface Bestand { id: string; bestandsnaam: string; aangemaakt_op: string; gedeeld_met_hr: boolean; categorie: string }
interface Rapport { id: string; type: string; titel: string; inhoud: string; aangemaakt_op: string }

const TYPE_KLEUR: Record<string, string> = { disc: '#3B82F6', checkin: '#10B981', onboarding: '#8B5CF6', algemeen: '#64748b' }
const TYPE_LABEL: Record<string, string> = { disc: 'DISC', checkin: 'Check-in', onboarding: 'Onboarding', algemeen: 'Algemeen' }

export default function BestandenPage() {
  const router = useRouter()
  const [geladen, setGeladen] = useState(false)
  const [userId, setUserId] = useState('')
  const [actieveTab, setActieveTab] = useState<'bestanden' | 'rapporten'>('bestanden')
  const [bestanden, setBestanden] = useState<Bestand[]>([])
  const [rapporten, setRapporten] = useState<Rapport[]>([])
  const [uploaden, setUploaden] = useState(false)
  const [openRapport, setOpenRapport] = useState<string | null>(null)
  const [fout, setFout] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      await Promise.all([laadBestanden(user.id), laadRapporten(user.id)])
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
    } catch (_) { setFout("Bestanden laden mislukt") }
  }

  async function laadRapporten(uid: string) {
    try {
      const { data } = await supabase.from('ai_rapporten').select('id, type, titel, inhoud, aangemaakt_op').eq('user_id', uid).order('aangemaakt_op', { ascending: false })
      setRapporten(data ?? [])
    } catch (_) { setFout("Rapporten laden mislukt") }
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
    } catch (_) { setFout("Upload mislukt") }
    finally { setUploaden(false) }
  }

  function datumLabel(d: string) {
    return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (!geladen) return (
    <div style={{ minHeight: '100vh', background: '#060d1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#64748b' }}>Laden...</span>
    </div>
  )
  return (
    <div style={{ minHeight: '100vh', background: '#060d1f', color: '#f1f5f9' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>Mijn bestanden &amp; rapporten</h1>
        <p style={{ color: '#64748b', marginBottom: 28 }}>Beheer je documenten en bekijk je persoonlijke rapporten.</p>
        {fout && (
          <div style={{ background: '#3f0e0e', border: '1px solid #7f1d1d', borderRadius: 8, padding: 12, color: '#fca5a5', marginBottom: 16 }}>{fout}</div>
        )}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#0f1e36', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['bestanden', 'rapporten'] as const).map(tab => (
            <button key={tab} onClick={() => setActieveTab(tab)} style={{ background: actieveTab === tab ? '#1e40af' : 'transparent', color: actieveTab === tab ? '#fff' : '#94a3b8', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {tab === 'bestanden' ? 'Mijn bestanden' : 'Mijn rapporten'}
            </button>
          ))}
        </div>
        {actieveTab === 'bestanden' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'inline-block', background: '#1e40af', color: '#fff', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: uploaden ? 'not-allowed' : 'pointer' }}>
                {uploaden ? 'Uploaden...' : '+ Bestand uploaden'}
                <input type="file" onChange={uploadBestand} style={{ display: "none" }} disabled={uploaden} />
              </label>
            </div>
            {bestanden.length === 0 ? (
              <div style={{ background: '#0f1e36', borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748b' }}>Nog geen bestanden geupload.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bestanden.map(b => (
                  <div key={b.id} style={{ background: '#0f1e36', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.bestandsnaam}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{datumLabel(b.aangemaakt_op)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>Deel met HR</span>
                      <button onClick={() => toggleDelen(b.id, b.gedeeld_met_hr)} style={{ width: 44, height: 24, borderRadius: 12, background: b.gedeeld_met_hr ? '#10B981' : '#334155', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                        <span style={{ display: 'block', width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: b.gedeeld_met_hr ? 23 : 3, transition: 'left 0.2s' }} />
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
              <div style={{ background: '#0f1e36', borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>&#128196;</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Nog geen rapporten</div>
                <div style={{ fontSize: 14 }}>Je rapporten verschijnen hier na een check-in of DISC-test.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rapporten.map(r => (
                  <div key={r.id} style={{ background: '#0f1e36', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
                    <button onClick={() => setOpenRapport(openRapport === r.id ? null : r.id)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <span style={{ background: (TYPE_KLEUR[r.type] ?? '#64748b') + '20', color: TYPE_KLEUR[r.type] ?? '#64748b', border: '1px solid ' + (TYPE_KLEUR[r.type] ?? '#64748b') + '40', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{TYPE_LABEL[r.type] ?? r.type}</span>
                        <span style={{ fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titel}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 13, color: '#64748b' }}>{datumLabel(r.aangemaakt_op)}</span>
                        <span style={{ color: '#64748b' }}>{openRapport === r.id ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {openRapport === r.id && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid #1e293b' }}>
                        <div style={{ paddingTop: 16, color: '#cbd5e1', fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.inhoud}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}