'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileText, Info, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'

import type { Loonstrook } from '@/lib/types'

function euro(bedrag: number): string {
  return `€${bedrag.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}`
}

export default function LoonstrokenPage() {
  const router = useRouter()
  const { toast } = useToast()
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
        .select('id, user_id, periode, periode_datum, bruto_loon, netto_loon, bestandsnaam, opslag_pad, aangemaakt_op')
        .eq('user_id', user.id)
        .order('periode_datum', { ascending: false })

      if (data) setLoonstroken(data as Loonstrook[])
      setLaden(false)
    }
    laad()
  }, [router])

  async function download(strook: Loonstrook) {
    const { data, error } = await supabase.storage
      .from('loonstroken')
      .createSignedUrl(strook.opslag_pad, 60)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    } else {
      toast({ title: 'Downloaden mislukt', description: error?.message ?? 'Probeer het later opnieuw.', variant: 'error' })
    }
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
      <main className="px-6 py-6 mf-safe-bottom" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Loonstroken
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Jouw salarisoverzicht</p>
          </div>
          {isHr && <Badge variant="accent">HR-beheer</Badge>}
        </div>

        {laden ? (
          <div className="flex justify-center py-20">
            <div className="mf-spinner" />
          </div>
        ) : loonstroken.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileText}
              title="Nog geen loonstroken"
              description="Loonstroken worden door HR geüpload."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(jaarGroepen)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([jaar, stroken]) => (
                <section key={jaar}>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
                    style={{ color: 'var(--text-4)' }}
                  >
                    {jaar}
                  </p>
                  <Table caption={`Loonstroken ${jaar}`}>
                    <THead>
                      <Tr>
                        <Th scope="col">Periode</Th>
                        <Th scope="col" align="right">Netto</Th>
                        <Th scope="col" align="right">Bruto</Th>
                        <Th scope="col" align="right">PDF</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {stroken.map(s => (
                        <Tr key={s.id}>
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <span aria-hidden style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 34, height: 34, borderRadius: 'var(--radius-md)',
                                background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)', flexShrink: 0,
                              }}>
                                <FileText size={17} strokeWidth={1.75} />
                              </span>
                              <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.periode}</span>
                            </div>
                          </Td>
                          <Td align="right" style={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--text-1)' }}>
                            {s.netto_loon != null ? euro(s.netto_loon) : '—'}
                          </Td>
                          <Td align="right" style={{ whiteSpace: 'nowrap', color: 'var(--text-3)' }}>
                            {s.bruto_loon != null ? euro(s.bruto_loon) : '—'}
                          </Td>
                          <Td align="right">
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<Download size={15} aria-hidden />}
                              onClick={() => download(s)}
                              aria-label={`Download loonstrook ${s.periode} (PDF)`}
                            >
                              PDF
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </section>
              ))}
          </div>
        )}

        {/* Info block */}
        <Card style={{ marginTop: 24, padding: 16 }}>
          <p className="text-xs leading-relaxed flex items-start gap-2" style={{ color: 'var(--text-3)' }}>
            <Lock size={14} aria-hidden style={{ flexShrink: 0, marginTop: 1, color: 'var(--mentaforce-primary)' }} />
            <span>
              Loonstroken zijn beveiligd en alleen zichtbaar voor jou.
              Neem contact op met HR als er een fout staat of een strook ontbreekt.
            </span>
          </p>
        </Card>

        {isHr && (
          <Card style={{ marginTop: 12, padding: 16, borderColor: 'var(--mentaforce-primary)' }}>
            <p className="text-xs font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--mentaforce-primary)' }}>
              <Info size={14} aria-hidden style={{ flexShrink: 0 }} />
              HR: Loonstroken uploaden
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
              Upload PDF-bestanden via het Supabase Storage-dashboard in de bucket <code>loonstroken</code>.
              Het bestandspad moet het formaat <code>&#123;user_id&#125;/&#123;bestandsnaam&#125;.pdf</code> volgen.
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
