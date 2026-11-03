import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { LidKaart } from '@/lib/club/leden/kaart'
import { datumKort, laatsteBezoekTekst, tijdNl } from '@/lib/club/leden/tijd'
import type { KaartRechten } from '@/lib/club/leden/hub/rechten'
import { lidKaartPad } from '@/lib/club/leden/hub/tabs'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { tekst } from '@/lib/aiyourgym/taal/woordenboek'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'
import { BehoudKaart } from '@/components/club/leden/BehoudKaart'
import { Bezoekpatroon } from '@/components/club/leden/Bezoekpatroon'
import { BezoekCijfers } from './BezoekCijfers'
import { LaatsteBezoeken } from './LaatsteBezoeken'
import { KomtEraan } from './KomtEraan'
import { NotitiesEnBerichten } from './Gegevens'

// Tabblad Overzicht (EENVOUD-10-MINUTEN.md, hoofdstuk 4), van boven naar
// beneden: drie feiten (laatste bezoek, volgende les, laatste notitie), Komt
// eraan (#planning), Bezoek, en Notities en berichten (#notities). Op de pc
// staan de notities rechts naast wat eraan komt.

interface OverzichtTabProps {
  t: ClubToegang
  kaart: LidKaart
  vestiging: Vestiging
  rechten: KaartRechten
  nu: Date
}

function geenBehoudTekst(kaart: LidKaart, taal: Taal): string {
  const t = LEDEN[taal].behoud
  if (kaart.lid.status === 'gepauzeerd') return t.geenGepauzeerd
  if (kaart.lid.status === 'opgezegd') return t.geenOpgezegd
  if (kaart.lid.status === 'gestopt') return t.geenGestopt
  return t.geenLaadfout
}

async function DrieFeiten({ kaart, vestiging, nu }: Pick<OverzichtTabProps, 'kaart' | 'vestiging' | 'nu'>) {
  const taal = await getTaal()
  const w = tekst(LEDENKAART, taal).overzicht
  const { lid } = kaart
  const volgende = kaart.aankomend.find((r) => !r.lesGeannuleerd && r.status !== 'geannuleerd') ?? null
  const notitie = kaart.notities[0] ?? null
  return (
    <dl className="club-lidhub-drie" aria-label={w.kort}>
      <div>
        <dt>{w.laatsteBezoek}</dt>
        <dd>{kaart.laatsteBezoek ? laatsteBezoekTekst(kaart.laatsteBezoek, nu, taal) : <span className="club-zacht">{w.nooitGeweest}</span>}</dd>
      </div>
      <div>
        <dt>{w.volgendeLes}</dt>
        <dd>
          {volgende ? (
            <Link href={lidKaartPad(lid.id, vestiging, 'overzicht', 'planning')}>
              {volgende.lesNaam}
              <span className="club-lidhub-drie-sub">{datumKort(volgende.start, nu, taal)} {tijdNl(volgende.start)}</span>
            </Link>
          ) : <span className="club-zacht">{w.geenLes}</span>}
        </dd>
      </div>
      <div>
        <dt>{w.laatsteNotitie}</dt>
        <dd>
          {notitie
            ? <Link href={lidKaartPad(lid.id, vestiging, 'overzicht', 'notities')} className="club-lidhub-tweeregels">{notitie.tekst}</Link>
            : <span className="club-zacht">{w.geenNotitie}</span>}
        </dd>
      </div>
    </dl>
  )
}

async function Bezoek({ t, kaart, nu }: Pick<OverzichtTabProps, 't' | 'kaart' | 'nu'>) {
  const taal = await getTaal()
  const w = tekst(LEDENKAART, taal).overzicht
  const pt = LEDEN[taal].patroon
  return (
    <section className="club-lidhub-sectie" id="bezoek" aria-labelledby="bezoek-sectie-kop">
      <h2 id="bezoek-sectie-kop" className="club-lidhub-sectiekop">{w.bezoek}</h2>
      <BezoekCijfers kaart={kaart} nu={nu} />
      <section className="club-kaart" aria-labelledby="patroon-kop">
        <div className="club-sectiekop">
          <h2 id="patroon-kop">{pt.kop}</h2>
          <span>{pt.laatste12}</span>
        </div>
        <Bezoekpatroon bezoeken={kaart.bezoeken.map((b) => b.op)} nu={nu} />
      </section>
      <BehoudKaart behoud={kaart.behoud} geenTekst={geenBehoudTekst(kaart, taal)} />
      <LaatsteBezoeken kaart={kaart} nu={nu} vestigingen={t.vestigingen} />
    </section>
  )
}

export async function OverzichtTab(props: OverzichtTabProps) {
  return (
    <div className="club-lidhub-tab">
      <DrieFeiten kaart={props.kaart} vestiging={props.vestiging} nu={props.nu} />
      <div className="club-lidhub-twee">
        <div className="club-leden-kolom">
          <KomtEraan t={props.t} kaart={props.kaart} rechten={props.rechten} nu={props.nu} />
          <Bezoek t={props.t} kaart={props.kaart} nu={props.nu} />
        </div>
        <div className="club-leden-kolom">
          <NotitiesEnBerichten {...props} />
        </div>
      </div>
    </div>
  )
}
