import type { Metadata } from 'next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { eisBetalenBeheer } from '@/lib/club/betalen/toegang'
import { clubStripeSleutel } from '@/lib/club/betalen/config'
import { haalBetaalAccount, haalProducten, haalVerkopen } from '@/lib/club/betalen/opslag'
import { maandCijfers } from '@/lib/club/betalen/cijfers'
import { euro } from '@/lib/club/betalen/model'
import { StripeKaart } from '@/components/club/betalen/StripeKaart'
import { ProductenBeheer } from '@/components/club/betalen/ProductenBeheer'
import { VerkopenLijst } from '@/components/club/betalen/VerkopenLijst'
import '@/components/club/betalen/betalen.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'

export const metadata: Metadata = { title: 'Betalen in de ledenapp' }
export const dynamic = 'force-dynamic'

// Betalen in de ledenapp: losse lessen, strippenkaarten, PT-pakketten en
// producten. Alleen Kane en de eigenaar, en alleen met CLUB_BETALEN_ACTIEF aan.
// Het lidmaatschap zelf blijft bij Sportivity of het eigen systeem.

const MAAND = new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' })

type Zoek = Promise<Record<string, string | string[] | undefined>>

async function ledenNamen(admin: SupabaseClient, userId: string, ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const { data, error } = await admin.from('club_leden').select('id, voornaam, achternaam').eq('user_id', userId).in('id', ids)
  if (error) console.error('[club/betalen] namen lezen mislukt', error.message)
  return new Map((data ?? []).map((r) => [String(r.id), `${r.voornaam ?? ''} ${r.achternaam ?? ''}`.trim() || 'Lid']))
}

export default async function BetalenPagina({ searchParams }: { searchParams: Zoek }) {
  const t = await eisBetalenBeheer()
  const zoek = await searchParams
  const [account, producten, verkopen] = await Promise.all([haalBetaalAccount(t.admin, t.userId), haalProducten(t.admin, t.userId), haalVerkopen(t.admin, t.userId)])
  const namen = await ledenNamen(t.admin, t.userId, [...new Set((verkopen ?? []).flatMap((v) => (v.lidId ? [v.lidId] : [])))])
  const nu = new Date()
  const cijfers = maandCijfers(verkopen ?? [], nu)

  return (
    <div className="club-betalen">
      <InstelKruimel id="betalen" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Betalen in de ledenapp</h1>
          <p>
            Leden kopen in de app een losse les, een strippenkaart, een PT-pakket of een product. Ze betalen met iDEAL of kaart bij Stripe en het geld
            komt rechtstreeks bij jouw sportschool. Lidmaatschappen en incasso blijven in Sportivity.
          </p>
        </div>
      </header>

      <dl className="club-betalen-cijfers" aria-label={`Cijfers ${MAAND.format(nu)}`}>
        <div><dt>Omzet {MAAND.format(nu)}</dt><dd>{euro(cijfers.omzetCent)}</dd></div>
        <div><dt>Waarvan btw</dt><dd>{euro(cijfers.btwCent)}</dd></div>
        <div><dt>Verkopen</dt><dd>{cijfers.verkopen}</dd></div>
        <div><dt>Terugbetaald</dt><dd>{euro(cijfers.terugCent)}</dd></div>
      </dl>

      {account ? (
        <StripeKaart account={account} sleutelGezet={clubStripeSleutel() !== null} verversen={zoek.onboarding === 'klaar'} />
      ) : (
        <p className="club-melding club-melding--fout" role="status">De koppeling met Stripe kon niet worden gelezen. Probeer het later opnieuw.</p>
      )}

      {producten ? (
        <ProductenBeheer producten={producten} vestigingen={t.vestigingen.map((v) => ({ sleutel: v.sleutel, naam: v.naam }))} />
      ) : (
        <p className="club-melding club-melding--fout" role="status">De producten konden niet worden gelezen. Probeer het later opnieuw.</p>
      )}

      {verkopen ? (
        <VerkopenLijst verkopen={verkopen.map((v) => ({ ...v, lidNaam: v.lidId ? (namen.get(v.lidId) ?? 'Lid') : 'Verwijderd lid' }))} />
      ) : (
        <p className="club-melding club-melding--fout" role="status">De verkopen konden niet worden gelezen. Probeer het later opnieuw.</p>
      )}
    </div>
  )
}
