import type { Metadata } from 'next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { eisBetalenBeheer } from '@/lib/club/betalen/toegang'
import { clubStripeSleutel, lidgeldActief } from '@/lib/club/betalen/config'
import { haalLidgeldStand } from '@/lib/club/betalen/plannen/toegang'
import { LidgeldKaart } from '@/components/club/betalen/plannen/LidgeldKaart'
import '@/components/club/betalen/plannen/plannen.css'
import { haalBetaalAccount, haalProducten, haalVerkopen, haalVerkopenInMaand } from '@/lib/club/betalen/opslag'
import { maandCijfers } from '@/lib/club/betalen/cijfers'
import { euro } from '@/lib/club/betalen/model'
import { StripeKaart } from '@/components/club/betalen/StripeKaart'
import { ProductenBeheer } from '@/components/club/betalen/ProductenBeheer'
import { VerkopenLijst } from '@/components/club/betalen/VerkopenLijst'
import '@/components/club/betalen/betalen.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { instelKop, instelMetadata } from '@/components/club/beheer/instel-metadata'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { BEHEER_PAGINAS } from '@/lib/aiyourgym/taal/woorden/club/beheer-paginas'

export async function generateMetadata(): Promise<Metadata> {
  return instelMetadata('betalen')
}
export const dynamic = 'force-dynamic'

// Betalen in de ledenapp: losse lessen, strippenkaarten, PT-pakketten en
// producten. Alleen Kane en de eigenaar, en alleen met CLUB_BETALEN_ACTIEF aan.
// Het lidmaatschap zelf blijft bij Sportivity of het eigen systeem.

type Zoek = Promise<Record<string, string | string[] | undefined>>

async function ledenNamen(admin: SupabaseClient, userId: string, ids: string[], lid: string): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const { data, error } = await admin.from('club_leden').select('id, voornaam, achternaam').eq('user_id', userId).in('id', ids)
  if (error) console.error('[club/betalen] namen lezen mislukt', error.message)
  return new Map((data ?? []).map((r) => [String(r.id), `${r.voornaam ?? ''} ${r.achternaam ?? ''}`.trim() || lid]))
}

export default async function BetalenPagina({ searchParams }: { searchParams: Zoek }) {
  const t = await eisBetalenBeheer()
  const taal = await getTaal()
  const tekst = BEHEER_PAGINAS[taal].betalen
  const titel = (await instelKop('betalen')).titel
  const zoek = await searchParams
  const nu = new Date()
  const [account, producten, verkopen, vanMaand, lidgeld] = await Promise.all([
    haalBetaalAccount(t.admin, t.userId),
    haalProducten(t.admin, t.userId),
    haalVerkopen(t.admin, t.userId),
    haalVerkopenInMaand(t.admin, t.userId, nu),
    lidgeldActief() ? haalLidgeldStand(t.admin, t.userId) : Promise.resolve(null),
  ])
  const namen = await ledenNamen(t.admin, t.userId, [...new Set((verkopen ?? []).flatMap((v) => (v.lidId ? [v.lidId] : [])))], tekst.lid)
  // Maandcijfers uit een eigen query op betaald_op binnen de kalendermaand, niet uit de laatste 200 verkopen.
  const cijfers = vanMaand ? maandCijfers(vanMaand, nu) : null
  // Pas als lidgeld aan staat en niet in schaduwmodus is het niet meer waar dat lidmaatschappen en incasso in de ledenadministratie blijven.
  const lidgeldBuitenAdministratie = lidgeld !== null && lidgeld.lidgeldAan && !lidgeld.schaduw
  const maand = formatDatum(nu, taal, 'maandJaar')

  return (
    <div className="club-betalen">
      <InstelKruimel id="betalen" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{titel}</h1>
          <p>
            {tekst.intro} {lidgeldBuitenAdministratie ? tekst.lidgeldHier : tekst.lidgeldElders}
          </p>
        </div>
      </header>

      {cijfers ? (
        <dl className="club-betalen-cijfers" aria-label={tekst.cijfersVan(maand)}>
          <div><dt>{tekst.omzet(maand)}</dt><dd>{euro(cijfers.omzetCent)}</dd></div>
          <div><dt>{tekst.btw}</dt><dd>{euro(cijfers.btwCent)}</dd></div>
          <div><dt>{tekst.verkopen}</dt><dd>{cijfers.verkopen}</dd></div>
          <div><dt>{tekst.terug}</dt><dd>{euro(cijfers.terugCent)}</dd></div>
        </dl>
      ) : (
        <p className="club-melding club-melding--fout" role="status">{tekst.cijfersFout}</p>
      )}

      {account ? (
        <StripeKaart account={account} sleutelGezet={clubStripeSleutel() !== null} verversen={zoek.onboarding === 'klaar'} />
      ) : (
        <p className="club-melding club-melding--fout" role="status">{tekst.stripeFout}</p>
      )}

      {lidgeldActief() &&
        (lidgeld ? (
          <LidgeldKaart stand={lidgeld} />
        ) : (
          <p className="club-melding club-melding--fout" role="status">{tekst.lidgeldFout}</p>
        ))}

      {producten ? (
        <ProductenBeheer producten={producten} vestigingen={t.vestigingen.map((v) => ({ sleutel: v.sleutel, naam: v.naam }))} />
      ) : (
        <p className="club-melding club-melding--fout" role="status">{tekst.productenFout}</p>
      )}

      {verkopen ? (
        <VerkopenLijst verkopen={verkopen.map((v) => ({ ...v, lidNaam: v.lidId ? (namen.get(v.lidId) ?? tekst.lid) : tekst.verwijderdLid }))} />
      ) : (
        <p className="club-melding club-melding--fout" role="status">{tekst.verkopenFout}</p>
      )}
    </div>
  )
}
