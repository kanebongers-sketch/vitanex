import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { eisBeheerdersBeheer, eisModule } from '@/lib/club/toegang'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { STANDAARD_WIDGET, type WidgetInstellingen } from '@/lib/club/widget/invoer'
import { embedCode, widgetOrigin, widgetPad } from '@/lib/club/widget/kader'
import { haalLestypen, haalWidgetInstellingen } from '@/lib/club/widget/opslag'
import { widgetActief } from '@/lib/club/widget/schakelaar'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { WidgetInstellingenFormulier } from '@/components/club/widget/WidgetInstellingenFormulier'
import '@/components/club/beheer/beheer.css'
import '@/components/club/widget/widget-beheer.css'
import { instelKop, instelMetadata } from '@/components/club/beheer/instel-metadata'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEHEER_PAGINAS } from '@/lib/aiyourgym/taal/woorden/club/beheer-paginas'

export async function generateMetadata(): Promise<Metadata> {
  return instelMetadata('widget')
}

// De boekingswidget instellen: per vestiging aan of uit, op welke websites hij
// mag staan, welke lessen erin komen, licht of donker, en de code om te
// plakken. Alleen Kane en de eigenaar (eisBeheerdersBeheer), alleen als
// Groepslessen aan staat.

export default async function WidgetInstellenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisBeheerdersBeheer()
  await eisModule('rooster')
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  const h = await headers()
  const origin = widgetOrigin(h.get('x-forwarded-host') ?? h.get('host'))
  const [instellingen, lestypen]: [WidgetInstellingen | null, { id: string; naam: string }[]] = vestiging
    ? await Promise.all([haalWidgetInstellingen(t.admin, t.userId, vestiging), haalLestypen(t.admin, t.userId)])
    : [STANDAARD_WIDGET, []]
  const slug = t.organisatie.slug
  const actief = widgetActief()
  const titel = (await instelKop('widget')).titel
  const tekst = (await clubTekst(BEHEER_PAGINAS)).widget

  return (
    <>
      <InstelKruimel id="widget" vestiging={vestiging} />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}{vestiging ? ` · ${naamVan(t.vestigingen, vestiging)}` : ''}</p>
          <h1>{titel}</h1>
          <p>{tekst.intro}</p>
        </div>
      </header>

      {!actief && (
        <p className="club-wb-melding">
          {tekst.uit}
          {t.isPlatformEigenaar && <> {tekst.aanzetten} <code>CLUB_WIDGET_ACTIEF=1</code> {tekst.inRender}</>}
        </p>
      )}
      {!slug && (
        <p className="club-wb-melding is-let">
          {tekst.geenAdres} <Link href="/club/huisstijl#adres-kop">{tekst.adresKiezen}</Link>
        </p>
      )}

      {t.vestigingen.length > 1 && (
        <nav className="club-wb-vestigingen" aria-label={tekst.vestiging}>
          {t.vestigingen.map((v) => (
            <Link key={v.sleutel} href={clubPad('/beheer/widget', v.sleutel)} aria-current={v.sleutel === vestiging ? 'page' : undefined}>
              {v.naam}
            </Link>
          ))}
        </nav>
      )}

      {!vestiging ? (
        <p className="club-wb-melding is-let">{tekst.geenVestiging}</p>
      ) : !instellingen ? (
        <p className="club-wb-melding is-let">{tekst.laadFout}</p>
      ) : (
        <WidgetInstellingenFormulier
          key={vestiging}
          vestiging={vestiging}
          begin={instellingen}
          lestypen={lestypen}
          code={slug && origin ? embedCode(origin, slug, vestiging) : null}
          voorbeeldPad={slug ? `${widgetPad(slug, vestiging)}?voorbeeld=1` : null}
        />
      )}
    </>
  )
}
