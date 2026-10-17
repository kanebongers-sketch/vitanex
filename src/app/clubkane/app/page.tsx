import type { Metadata } from 'next'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { magTrainen, volledigeNaam, zoekLeden } from '@/lib/club/kern/lid'
import { haalLidApp } from '@/lib/club/app/data'
import { AppUitleg } from '@/components/club/app/AppUitleg'
import { HomeTab } from '@/components/club/app/HomeTab'
import { LessenTab } from '@/components/club/app/LessenTab'
import { LidKiezer } from '@/components/club/app/LidKiezer'
import { ProfielTab } from '@/components/club/app/ProfielTab'
import { SchemaTab } from '@/components/club/app/SchemaTab'
import { kiesTab, Toestel, type AppTab } from '@/components/club/app/Toestel'
import '@/components/club/app/app.css'

// Ledenapp: voorvertoning van de app zoals een lid hem op zijn telefoon ziet.
// Kies een (demo)lid; tabblad en lid staan in de URL.

export const metadata: Metadata = { title: 'Ledenapp' }

export default async function ClubLedenapp({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('app')
  const zoek = await searchParams
  const vestiging = kiesVestiging(zoek.v)
  const tab = kiesTab(zoek.tab)
  const [leden, schemas] = await Promise.all([
    zoekLeden(t.admin, t.userId, vestiging, '', 200),
    t.admin.from('club_schemas').select('lid_id').eq('user_id', t.userId).eq('status', 'actief').not('lid_id', 'is', null).limit(1000),
  ])
  const metSchema = new Set((schemas.data ?? []).map((r: { lid_id: unknown }) => r.lid_id).filter((id): id is string => typeof id === 'string'))
  const kandidaten = (leden ?? []).filter((l) => magTrainen(l.status))
  const opties = [...kandidaten].sort((a, b) => Number(metSchema.has(b.id)) - Number(metSchema.has(a.id)))
  const gevraagd = Array.isArray(zoek.lid) ? zoek.lid[0] : zoek.lid
  const lid = opties.find((l) => l.id === gevraagd) ?? opties[0]

  const kop = (
    <header className="club-paginakop">
      <div>
        <p className="club-boventitel">{VESTIGING_LABEL[vestiging]} · voorvertoning</p>
        <h1>Ledenapp</h1>
        <p>Zo ziet een lid de app op zijn telefoon. Kies een lid om mee te kijken.</p>
      </div>
      {lid && (
        <LidKiezer
          opties={opties.map((l) => ({ id: l.id, naam: volledigeNaam(l), heeftSchema: metSchema.has(l.id) }))}
          gekozen={lid.id}
          basisPad={clubPad('/app', vestiging, { tab })}
        />
      )}
    </header>
  )
  if (!lid) {
    return (
      <>
        {kop}
        <p className="club-leeg">{leden === null ? 'De leden konden niet worden geladen.' : 'Deze vestiging heeft nog geen leden die kunnen trainen.'}</p>
      </>
    )
  }

  const nu = new Date()
  const data = await haalLidApp(t.admin, t.userId, lid, nu)
  const tabPad = (nieuw: AppTab | string) => clubPad('/app', vestiging, { lid: lid.id, tab: nieuw })
  return (
    <>
      {kop}
      {data.meldingen.map((m) => (
        <p key={m} className="club-melding club-melding--fout" role="status">
          {m}
        </p>
      ))}
      <div className="club-lidapp-podium">
        <Toestel tab={tab} nu={nu} tabPad={tabPad}>
          {tab === 'home' && <HomeTab lid={lid} data={data} nu={nu} tabPad={tabPad} />}
          {tab === 'lessen' && <LessenTab lidId={lid.id} lessen={data.lessen} regels={data.regels} nu={nu.toISOString()} />}
          {tab === 'schema' && <SchemaTab lidId={lid.id} schema={data.schema} logs={data.logs} nu={nu.toISOString()} />}
          {tab === 'profiel' && <ProfielTab lid={lid} />}
        </Toestel>
        <AppUitleg regels={data.regels} />
      </div>
    </>
  )
}
