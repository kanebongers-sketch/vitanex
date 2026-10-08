import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { haalActieveLinks } from '@/lib/lifeos/leads/links'
import { LeadKop } from '@/components/lifeos/leads/LeadKop'

// /lead — de ingang voor het PT-team: tik je naam aan en je komt op je eigen
// dashboard (/<naam>). Alleen voornamen; de gegevens zitten achter de pincode van
// elke PT'er.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Lead tracker',
  description: 'De lead tracker van het PT-team.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function LeadStart() {
  const team = await haalActieveLinks(createLifeosAdminClient()).catch(() => null)

  return (
    <main className="lifeos-root" style={{ minHeight: '100vh', background: 'var(--bg-app)', padding: '28px 16px 64px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'grid', gap: 22 }}>
        <LeadKop titel="Wie ben jij?">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--text-2)' }}>
            Kies je naam. De eerste keer kies je een pincode van 6 cijfers; zodra Kane die goedkeurt, vul je hier elke
            week in met wie je gesproken hebt en houd je je PT-klanten bij.
          </p>
        </LeadKop>

        {team === null ? (
          <p role="alert" style={{ margin: 0, fontSize: 14, color: 'var(--text-2)' }}>
            Het team kon niet geladen worden. Vernieuw de pagina.
          </p>
        ) : team.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)' }}>Er staan nog geen lead-links klaar.</p>
        ) : (
          <nav aria-label="PT-team">
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {team.map((p) => (
                <li key={p.code}>
                  <Link href={`/${p.code}`} className="lead-naam">
                    <span>{p.naam}</span>
                    <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: 'var(--text-3)' }}>
          Sla je eigen pagina op je beginscherm op (mentaforce.nl/jouwnaam), dan heb je hem altijd bij de hand.
        </p>
      </div>
    </main>
  )
}
