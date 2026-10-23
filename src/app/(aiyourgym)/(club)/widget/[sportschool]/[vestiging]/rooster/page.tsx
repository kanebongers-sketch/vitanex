import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { clubToegang } from '@/lib/club/toegang'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { huisstijlVariabelen, type Thema } from '@/lib/club/kern/huisstijl'
import { sportschoolUrl } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'
import { widgetActief } from '@/lib/club/widget/schakelaar'
import { haalWidgetContext, haalWidgetLessen, type WidgetContext } from '@/lib/club/widget/opslag'
import { widgetWeergave } from '@/lib/club/widget/rooster'
import { WidgetRooster } from '@/components/club/widget/WidgetRooster'
import '@/components/club/widget/widget.css'

// /widget/<sportschool>/<vestiging>/rooster: de boekingswidget die een
// sportschool met public/widget/aiyourgym-widget.js op haar eigen website zet.
// Onbekend, uit of schakelaar CLUB_WIDGET_ACTIEF uit: een gewone 404, behalve
// de voorvertoning (?voorbeeld=1) voor Kane of de eigenaar binnen Club. De CSP
// met frame-ancestors per sportschool zet de proxy (src/lib/club/widget/proxy-widget.ts).

interface PaginaProps {
  params: Promise<{ sportschool: string; vestiging: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  title: 'Lesrooster',
  robots: { index: false, follow: false },
}

function admin(): SupabaseClient | null {
  try {
    return clubDatabase()
  } catch {
    return null
  }
}

/** Mag wie er in Club is deze sportschool voorvertonen? */
async function voorbeeldRechten(c: WidgetContext): Promise<{ isPlatformEigenaar: boolean; isBeheerder: boolean }> {
  const t = await clubToegang()
  if (!t) return { isPlatformEigenaar: false, isBeheerder: false }
  const isPlatformEigenaar = t.isPlatformEigenaar && t.organisaties.some((o) => o.id === c.organisatie.id)
  return { isPlatformEigenaar, isBeheerder: t.userId === c.organisatie.id && magBeheerdersBeheren(t) }
}

function themaVan(c: WidgetContext, voorbeeld: boolean, modus: unknown): Thema {
  const keuze = voorbeeld && (modus === 'licht' || modus === 'donker' || modus === 'huisstijl') ? modus : c.instellingen.kleurmodus
  return keuze === 'huisstijl' ? c.organisatie.thema : keuze
}

export default async function WidgetRoosterPagina({ params, searchParams }: PaginaProps) {
  const [{ sportschool, vestiging }, zoek] = await Promise.all([params, searchParams])
  const db = admin()
  if (!db) notFound()
  const c = await haalWidgetContext(db, sportschool, vestiging)
  if (!c) notFound()
  const voorbeeld = zoek.voorbeeld === '1'
  const rechten = voorbeeld ? await voorbeeldRechten(c) : { isPlatformEigenaar: false, isBeheerder: false }
  const weergave = widgetWeergave({ actief: widgetActief(), aan: c.instellingen.aan, voorbeeld, ...rechten })
  if (!weergave) notFound()

  const nu = new Date()
  const lessen = await haalWidgetLessen(db, c.organisatie.id, c.vestiging, c.instellingen.lestypeIds, nu)
  const thema = themaVan(c, voorbeeld, zoek.modus)
  const stijl = huisstijlVariabelen(c.organisatie.kleurAccent, thema) as CSSProperties
  const slug = c.organisatie.slug
  // De ledenapp op het adres van de sportschool (aiyourgym.com/<slug>/mijn, of het subdomein).
  const ledenappUrl = slug ? sportschoolUrl(slug, subdomeinenActief(), '/mijn') : '/mijn'

  return (
    <main className="ayg-w-pagina" style={stijl} data-thema={thema}>
      <WidgetRooster
        organisatie={c.organisatie.naam}
        vestiging={c.vestigingNaam}
        lessen={lessen ?? []}
        fout={lessen === null}
        nu={nu.toISOString()}
        apiPad={`/api/widget/${encodeURIComponent(sportschool)}/${encodeURIComponent(c.vestiging)}/aanvraag`}
        ledenappUrl={ledenappUrl}
        privacyUrl={c.instellingen.privacyUrl}
        voorbeeld={weergave === 'voorbeeld'}
      />
    </main>
  )
}
