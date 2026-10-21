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

export const metadata: Metadata = { title: 'Boekingswidget' }

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

  return (
    <>
      <InstelKruimel id="widget" vestiging={vestiging} />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}{vestiging ? ` · ${naamVan(t.vestigingen, vestiging)}` : ''}</p>
          <h1>Boekingswidget</h1>
          <p>Zet het lesrooster van een vestiging op je eigen website. Bezoekers vragen een proefles of kennismaking aan; dat komt als lead binnen bij Leads. Leden boeken in de ledenapp.</p>
        </div>
      </header>

      {!actief && (
        <p className="club-wb-melding">
          De widget staat nog uit voor bezoekers. Je kunt alles al instellen en de voorvertoning bekijken.
          {t.isPlatformEigenaar && <> Aanzetten: <code>CLUB_WIDGET_ACTIEF=1</code> in Render.</>}
        </p>
      )}
      {!slug && (
        <p className="club-wb-melding is-let">
          Kies eerst een adres voor je sportschool; de widget gebruikt dat in de link. <Link href="/club/huisstijl#adres-kop">Adres kiezen</Link>
        </p>
      )}

      {t.vestigingen.length > 1 && (
        <nav className="club-wb-vestigingen" aria-label="Vestiging">
          {t.vestigingen.map((v) => (
            <Link key={v.sleutel} href={clubPad('/beheer/widget', v.sleutel)} aria-current={v.sleutel === vestiging ? 'page' : undefined}>
              {v.naam}
            </Link>
          ))}
        </nav>
      )}

      {!vestiging ? (
        <p className="club-wb-melding is-let">Voeg eerst een vestiging toe.</p>
      ) : !instellingen ? (
        <p className="club-wb-melding is-let">De instellingen konden niet worden geladen. Probeer het opnieuw.</p>
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
