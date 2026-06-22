'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

type VerlofType = 'vakantie' | 'ziekte' | 'bijzonder' | 'onbetaald' | 'overig'
type VerlofStatus = 'aangevraagd' | 'goedgekeurd' | 'afgewezen'

type VerlofAanvraag = {
  id: string
  type: VerlofType
  datum_van: string
  datum_tot: string
  reden: string
  status: VerlofStatus
  created_at: string
  reviewer_notitie?: string | null
}

const TYPE_LABELS: Record<VerlofType, string> = {
  vakantie: 'Vakantie',
  ziekte: 'Ziekteverlof',
  bijzonder: 'Bijzonder verlof',
  onbetaald: 'Onbetaald verlof',
  overig: 'Overig',
}

const TYPE_EMOJI: Record<VerlofType, string> = {
  vakantie: '🌴',
  ziekte: '🤒',
  bijzonder: '⭐',
  onbetaald: '💼',
  overig: '📋',
}

const STATUS_STIJL: Record<VerlofStatus, { bg: string; color: string; label: string }> = {
  aangevraagd: { bg: 'var(--mf-amber-light)', color: 'var(--mf-amber-dark)', label: 'In behandeling' },
  goedgekeurd: { bg: 'var(--mf-green-light)', color: 'var(--mf-green-dark)', label: 'Goedgekeurd' },
  afgewezen:   { bg: 'var(--mf-red-light)', color: 'var(--mf-red)', label: 'Afgewezen' },
}

function aantalDagen(van: string, tot: string): number {
  const v = new Date(van)
  const t = new Date(tot)
  return Math.max(1, Math.round((t.getTime() - v.getTime()) / 86400000) + 1)
}

export default function VerlofPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [aanvragen, setAanvragen] = useState<VerlofAanvraag[]>([])
  const [formulier, setFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')
  const [userId, setUserId] = useState('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [saldo, setSaldo] = useState({ vakantie: 20, opgenomen: 0 })

  const [type, setType] = useState<VerlofType>('vakantie')
  const [datumVan, setDatumVan] = useState('')
  const [datumTot, setDatumTot] = useState('')
  const [reden, setReden] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

      const { data } = await supabase
        .from('verlof_aanvragen')
        .select('id, type, datum_van, datum_tot, reden, status, reviewer_notitie, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        setAanvragen(data as VerlofAanvraag[])
        const opgenomenDagen = data
          .filter(a => a.status === 'goedgekeurd' && a.type === 'vakantie')
          .reduce((sum, a) => sum + aantalDagen(a.datum_van, a.datum_tot), 0)
        setSaldo(s => ({ ...s, opgenomen: opgenomenDagen }))
      }

      setLaden(false)
    }
    laad()
  }, [router])

  async function indienen() {
    if (!datumVan || !datumTot) { setFout('Vul begin- en einddatum in.'); return }
    if (new Date(datumTot) < new Date(datumVan)) { setFout('Einddatum moet na begindatum liggen.'); return }
    setOpslaan(true); setFout('')

    const { data, error } = await supabase.from('verlof_aanvragen').insert({
      user_id: userId,
      bedrijf_id: bedrijfId,
      type,
      datum_van: datumVan,
      datum_tot: datumTot,
      reden: reden.trim(),
      status: 'aangevraagd',
    }).select().single()

    if (error) {
      setFout('Opslaan mislukt: ' + error.message)
    } else {
      setAanvragen(prev => [data as VerlofAanvraag, ...prev])
      setFormulier(false)
      setType('vakantie'); setDatumVan(''); setDatumTot(''); setReden('')
    }
    setOpslaan(false)
  }

  const resterend = saldo.vakantie - saldo.opgenomen
  const vandaag = new Date().toISOString().slice(0, 10)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="px-6 py-6 mf-safe-bottom">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Verlof</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Aanvragen en overzicht</p>
          </div>
          <button
            onClick={() => setFormulier(true)}
            className="mf-btn mf-btn-primary"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            + Aanvragen
          </button>
        </div>

        {/* Saldo kaarten */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{saldo.vakantie}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Totaal</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--mf-red)' }}>{saldo.opgenomen}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Opgenomen</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--mf-green)' }}>{resterend}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Resterend</p>
          </div>
        </div>

        {/* Formulier overlay */}
        {formulier && (
          <div className="mf-backdrop" onClick={e => { if (e.target === e.currentTarget) setFormulier(false) }}>
            <div className="mf-modal p-6 pb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>Verlof aanvragen</h2>
                <button
                  onClick={() => setFormulier(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)' }}
                >✕</button>
              </div>

              {/* Type */}
              <div className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: 'var(--text-4)' }}>Type verlof</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_LABELS) as VerlofType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition"
                      style={{
                        background: type === t ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                        borderColor: type === t ? 'var(--mf-green)' : 'var(--border)',
                        color: type === t ? 'var(--mf-green-dark)' : 'var(--text-3)',
                        fontWeight: type === t ? 600 : 400,
                      }}
                    >
                      <span>{TYPE_EMOJI[t]}</span>
                      <span>{TYPE_LABELS[t]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Datums */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-4)' }}>Van</label>
                  <input
                    type="date"
                    value={datumVan}
                    min={vandaag}
                    onChange={e => { setDatumVan(e.target.value); if (!datumTot) setDatumTot(e.target.value) }}
                    className="mf-input"
                    style={{ borderRadius: 12, padding: '10px 12px', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-4)' }}>Tot en met</label>
                  <input
                    type="date"
                    value={datumTot}
                    min={datumVan || vandaag}
                    onChange={e => setDatumTot(e.target.value)}
                    className="mf-input"
                    style={{ borderRadius: 12, padding: '10px 12px', fontSize: 14 }}
                  />
                </div>
              </div>

              {datumVan && datumTot && (
                <p className="text-xs mb-3" style={{ color: 'var(--text-4)' }}>
                  {aantalDagen(datumVan, datumTot)} dag{aantalDagen(datumVan, datumTot) !== 1 ? 'en' : ''}
                </p>
              )}

              {/* Reden */}
              <div className="mb-5">
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-4)' }}>
                  Reden <span className="font-normal" style={{ color: 'var(--text-4)', opacity: 0.6 }}>(optioneel)</span>
                </label>
                <textarea
                  rows={2}
                  value={reden}
                  onChange={e => setReden(e.target.value)}
                  placeholder="Beschrijf de reden..."
                  className="mf-input resize-none"
                  style={{ borderRadius: 12 }}
                />
              </div>

              {fout && (
                <div className="rounded-xl px-4 py-3 mb-3" style={{ background: 'var(--mf-red-light)' }}>
                  <p className="text-sm" style={{ color: 'var(--mf-red)' }}>{fout}</p>
                </div>
              )}

              <button
                onClick={indienen}
                disabled={opslaan || !datumVan || !datumTot}
                className="mf-btn mf-btn-primary w-full"
                style={{ fontSize: 14, padding: '12px' }}
              >
                {opslaan ? 'Versturen...' : 'Aanvraag indienen'}
              </button>
            </div>
          </div>
        )}

        {/* Aanvragen lijst */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-4)' }}>Mijn aanvragen</p>

        {laden ? (
          <div className="flex justify-center py-10">
            <div className="mf-spinner" />
          </div>
        ) : aanvragen.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                <GlowOrb color={[0.114, 0.620, 0.459]} intensity={0.4} size={80} />
              </div>
              <p className="text-3xl" style={{ position: 'relative', zIndex: 1 }}>🌴</p>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Nog geen verlofaanvragen.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Klik op &apos;+ Aanvragen&apos; om te starten.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {aanvragen.map(a => {
              const stijl = STATUS_STIJL[a.status]
              const dagen = aantalDagen(a.datum_van, a.datum_tot)
              return (
                <div key={a.id} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-subtle)' }}>
                        <span className="text-xl">{TYPE_EMOJI[a.type as VerlofType]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{TYPE_LABELS[a.type as VerlofType]}</p>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {new Date(a.datum_van).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                          {a.datum_van !== a.datum_tot ? (
                            <> – {new Date(a.datum_tot).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}</>
                          ) : null}
                          <span className="ml-1.5">· {dagen} dag{dagen !== 1 ? 'en' : ''}</span>
                        </p>
                      </div>
                    </div>
                    <span className="mf-badge flex-shrink-0"
                      style={{ background: stijl.bg, color: stijl.color }}>
                      {stijl.label}
                    </span>
                  </div>
                  {a.reden && (
                    <p className="text-xs mt-2 ml-[52px] italic" style={{ color: 'var(--text-3)' }}>&quot;{a.reden}&quot;</p>
                  )}
                  {a.reviewer_notitie && (
                    <div className="mt-2 ml-[52px] text-xs rounded-xl px-3 py-2"
                      style={{ background: a.status === 'goedgekeurd' ? 'var(--mf-green-light)' : 'var(--mf-red-light)', color: a.status === 'goedgekeurd' ? 'var(--mf-green-dark)' : 'var(--mf-red)' }}>
                      <strong>Notitie HR:</strong> {a.reviewer_notitie}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
