'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import type { Loonstrook } from '@/lib/types'

export default function LoonstrokenPage() {
  const router = useRouter()
  const [laden,       setLaden]       = useState(true)
  const [loonstroken, setLoonstroken] = useState<Loonstrook[]>([])
  const [isHr,        setIsHr]        = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()

      setIsHr(profiel?.rol === 'hr' || profiel?.rol === 'admin')

      const { data } = await supabase
        .from('loonstroken')
        .select('id, user_id, periode, periode_datum, naam, bestandsnaam, opslag_pad, aangemaakt_op')
        .eq('user_id', user.id)
        .order('periode_datum', { ascending: false })

      if (data) setLoonstroken(data as Loonstrook[])
      setLaden(false)
    }
    laad()
  }, [router])

  async function download(strook: Loonstrook) {
    const { data } = await supabase.storage
      .from('loonstroken')
      .createSignedUrl(strook.opslag_pad, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const jaarGroepen = loonstroken.reduce<Record<string, Loonstrook[]>>((acc, s) => {
    const jaar = s.periode_datum.slice(0, 4)
    if (!acc[jaar]) acc[jaar] = []
    acc[jaar].push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="px-6 py-6 mf-safe-bottom">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Loonstroken
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Jouw salarisoverzicht</p>
          </div>
          {isHr && (
            <span
              className="mf-badge text-xs"
              style={{ background: 'var(--mf-blue-light, #E6F1FB)', color: 'var(--mf-blue, #185FA5)' }}
            >
              HR-beheer
            </span>
          )}
        </div>

        {laden ? (
          <div className="flex justify-center py-20">
            <div className="mf-spinner" />
          </div>
        ) : loonstroken.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--bg-subtle)' }}
            >
              <span className="text-3xl">💶</span>
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Nog geen loonstroken</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Loonstroken worden door HR geüpload.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(jaarGroepen)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([jaar, stroken]) => (
                <div key={jaar}>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
                    style={{ color: 'var(--text-4)' }}
                  >
                    {jaar}
                  </p>
                  <div className="flex flex-col gap-2">
                    {stroken.map(s => (
                      <div
                        key={s.id}
                        className="rounded-2xl px-4 py-4 flex items-center justify-between gap-3"
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          boxShadow: 'var(--shadow-xs)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--mf-green-light, #E1F5EE)' }}
                          >
                            <span className="text-xl">💶</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{s.periode}</p>
                            {s.netto_loon && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                                Netto:{' '}
                                <strong style={{ color: 'var(--text-2)' }}>
                                  €{s.netto_loon.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
                                </strong>
                                {s.bruto_loon && (
                                  <span className="ml-2">
                                    Bruto: €{s.bruto_loon.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => download(s)}
                          className="mf-btn flex-shrink-0"
                          style={{
                            background: 'var(--mf-green-light, #E1F5EE)',
                            color: 'var(--mf-green-dark, #0F6E56)',
                            padding: '7px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          ↓ PDF
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Info block */}
        <div
          className="mt-6 rounded-2xl p-4"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
            📌 Loonstroken zijn beveiligd en alleen zichtbaar voor jou.
            Neem contact op met HR als er een fout staat of een strook ontbreekt.
          </p>
        </div>

        {isHr && (
          <div
            className="mt-3 rounded-2xl p-4"
            style={{
              background: 'var(--mf-blue-light, #E6F1FB)',
              border: '1px solid rgba(24,95,165,0.2)',
            }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--mf-blue, #185FA5)' }}>
              HR: Loonstroken uploaden
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--mf-blue, #185FA5)', opacity: 0.8 }}>
              Upload PDF-bestanden via het Supabase Storage-dashboard in de bucket <code>loonstroken</code>.
              Het bestandspad moet het formaat <code>&#123;user_id&#125;/&#123;bestandsnaam&#125;.pdf</code> volgen.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
