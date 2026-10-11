'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PLAN_INFO, PLAN_VOLGORDE, type Plan } from '@/lib/plan/plan'
import { Check, CheckCircle2, CreditCard, Mail } from 'lucide-react'
import { useVertaling } from '@/lib/i18n/TaalProvider'

interface BedrijfAbonnement {
  naam: string
  plan: Plan
  heeftStripeKlant: boolean
  abonnementStatus: string | null
  aantalGebruikers: number
}

export default function HrAbonnementPage() {
  const router = useRouter()
  const { t, taal } = useVertaling()
  const [laden, setLaden] = useState(true)
  const [bedrijf, setBedrijf] = useState<BedrijfAbonnement | null>(null)
  const [bezig, setBezig] = useState<string | null>(null)
  const [melding, setMelding] = useState<{ soort: 'succes' | 'fout'; tekst: string } | null>(null)

  useEffect(() => {
    // Checkout-redirect (?status=...) hydration-veilig uitlezen ná mount.
    const status = new URLSearchParams(window.location.search).get('status')
    if (status === 'succes') {
      setMelding({ soort: 'succes', tekst: t('werk.abonnement.betalingGestart') })
    } else if (status === 'geannuleerd') {
      setMelding({ soort: 'fout', tekst: t('werk.abonnement.betalingGeannuleerd') })
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      // De stripe-velden zijn client-side bewust niet leesbaar; de server-route
      // doet de rol-check en levert alleen afgeleide, niet-gevoelige data.
      try {
        const res = await authFetch('/api/stripe/abonnement')
        if (res.status === 403) { router.push('/home'); return }
        if (res.ok) setBedrijf((await res.json()) as BedrijfAbonnement)
      } catch {
        // bedrijf blijft null → de pagina toont de plannen zonder teamgegevens
      }
      setLaden(false)
    })
  }, [router, t])

  async function startCheckout(plan: Plan) {
    setBezig(plan)
    setMelding(null)
    try {
      const res = await authFetch('/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (res.ok && data.url) {
        window.location.assign(data.url)
        return
      }
      setMelding({ soort: 'fout', tekst: (taal === 'nl' ? data.error : undefined) ?? t('werk.algemeen.ietsMis') })
    } catch {
      setMelding({ soort: 'fout', tekst: t('werk.abonnement.verbinding') })
    }
    setBezig(null)
  }

  async function openPortaal() {
    setBezig('portaal')
    setMelding(null)
    try {
      const res = await authFetch('/api/stripe/portal', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }
      if (res.ok && data.url) {
        window.location.assign(data.url)
        return
      }
      setMelding({ soort: 'fout', tekst: (taal === 'nl' ? data.error : undefined) ?? t('werk.algemeen.ietsMis') })
    } catch {
      setMelding({ soort: 'fout', tekst: t('werk.abonnement.verbinding') })
    }
    setBezig(null)
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" role="status" aria-label={t('werk.abonnement.laden')} />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            {t('werk.abonnement.titel')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {bedrijf
              ? (bedrijf.aantalGebruikers === 1
                ? t('werk.abonnement.subEen', { naam: bedrijf.naam })
                : t('werk.abonnement.subMeer', { naam: bedrijf.naam, aantal: bedrijf.aantalGebruikers }))
              : t('werk.abonnement.beheer')}
          </p>
        </div>

        {melding && (
          <div role={melding.soort === 'fout' ? 'alert' : 'status'} style={{
            marginBottom: 20, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${melding.soort === 'fout' ? 'var(--mf-red)' : 'var(--mf-green)'}`,
            background: 'var(--bg-card)', color: 'var(--text-1)', fontSize: 13,
          }}>
            {melding.tekst}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {PLAN_VOLGORDE.map((plan) => {
            const info = PLAN_INFO[plan]
            const isHuidig = bedrijf?.plan === plan
            return (
              <Card key={plan} style={isHuidig ? { borderColor: 'var(--mentaforce-primary)' } : undefined}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{info.naam}</h2>
                    {isHuidig && <Badge variant="success">{t('werk.abonnement.huidig')}</Badge>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                    {info.omschrijving}
                  </p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1 }}>
                    {info.kenmerken.map((kenmerk) => (
                      <li key={kenmerk} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        <Check size={14} aria-hidden style={{ flexShrink: 0, marginTop: 2, color: 'var(--mentaforce-primary)' }} />
                        {kenmerk}
                      </li>
                    ))}
                  </ul>
                  <div>
                    {info.zelfService ? (
                      <>
                        <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                          €{info.prijsPerGebruiker}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('werk.abonnement.perGebruiker')}</span>
                        {bedrijf && (
                          <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>
                            {t('werk.abonnement.teamPrijs', { bedrag: info.prijsPerGebruiker * bedrijf.aantalGebruikers })}
                          </p>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{t('werk.abonnement.opAanvraag')}</span>
                    )}
                  </div>
                  {isHuidig ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 13 }}>
                      <CheckCircle2 size={16} aria-hidden />
                      {t('werk.abonnement.actief')}
                    </div>
                  ) : info.zelfService ? (
                    <Button
                      variant="primary"
                      onClick={() => startCheckout(plan)}
                      disabled={bezig !== null}
                      aria-busy={bezig === plan}
                    >
                      {bezig === plan ? t('werk.abonnement.bezig') : t('werk.abonnement.overstappen', { plan: info.naam })}
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={() => router.push('/contact')}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Mail size={15} aria-hidden /> {t('werk.abonnement.contact')}
                      </span>
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {bedrijf?.heeftStripeKlant && (
          <Card style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>
                  {t('werk.abonnement.facturen')}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  {t('werk.abonnement.facturenUitleg')}
                  {bedrijf.abonnementStatus && bedrijf.abonnementStatus !== 'active' && (
                    <> {t('werk.abonnement.status')} <strong>{bedrijf.abonnementStatus}</strong>.</>
                  )}
                </p>
              </div>
              <Button variant="secondary" onClick={openPortaal} disabled={bezig !== null} aria-busy={bezig === 'portaal'}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={15} aria-hidden /> {bezig === 'portaal' ? t('werk.abonnement.bezig') : t('werk.abonnement.portaal')}
                </span>
              </Button>
            </div>
          </Card>
        )}

        <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 24 }}>
          {t('werk.abonnement.vragen')}{' '}
          <Link href="/contact" style={{ color: 'var(--mentaforce-primary)' }}>{t('werk.abonnement.contact')}</Link>. {t('werk.abonnement.meedenken')}
        </p>
      </main>
    </div>
  )
}
