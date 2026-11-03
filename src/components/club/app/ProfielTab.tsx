import type { ReactNode } from 'react'
import { CreditCard, LockKeyhole } from 'lucide-react'
import type { Teksten } from '@/lib/club/bedrijf/model'
import { LedenappJuridisch } from '@/components/club/bedrijf/LedenappJuridisch'
import { initialen, volledigeNaam } from '@/lib/club/kern/lid'
import type { LidVoorApp } from '@/lib/club/ledenlogin/lid-voor-app'
import { dagKortIn } from '@/lib/club/app/regels'
import { TaalKeuze } from '@/components/aiyourgym/taal/TaalKeuze'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'
import { PROFIELFOTO } from '@/lib/aiyourgym/taal/woorden/club/profielfoto'
import { FotoKiezer } from '@/components/club/profielfoto/FotoKiezer'
import { Avatar } from '@/components/club/ontwerp/Avatar'

// Profiel in de ledenapp: eigen gegevens. Geld en contract regelt de
// sportschool buiten de app; hier alleen de naam van het abonnement. Geen
// systeemnamen voor het lid: die zeggen hem niets. Volgorde (EENVOUD-10-MINUTEN.md,
// hoofdstuk 5): gegevens, kopen, community en koppelingen, hulp, account.
// Meldingen op je telefoon staan alleen onder de bel, niet hier.

interface ProfielTabProps {
  lid: LidVoorApp
  vestigingNaam: string
  /** Huisregels, voorwaarden en privacy van de sportschool (leeg = niets tonen). */
  teksten: Teksten | null
  sportschool: string
  /** Kopen (strippenkaart, PT): het blok dat naar ?tab=kopen leidt. */
  kopen?: ReactNode
  /** Community en koppelingen met apps. */
  extra?: ReactNode
  /** Hulp of een vraag aan de sportschool. */
  hulp?: ReactNode
  /** Account: wachtwoord kiezen en uitloggen (onder de taal). */
  account?: ReactNode
  /** De voetnoot over inloggen bij de pilot (alleen in de voorvertoning; in /mijn is het lid al ingelogd). */
  pilotNoot?: boolean
  /** Profielfoto: club = voorvertoning in Club (alleen kijken), lid = de ledenapp. */
  foto?: { waar: 'club' | 'lid'; voor: string | null; bewerkbaar: boolean; door: string | null }
}

export async function ProfielTab({ lid, vestigingNaam, teksten, sportschool, kopen, extra, hulp, account, pilotNoot = true, foto = { waar: 'club', voor: null, bewerkbaar: false, door: null } }: ProfielTabProps) {
  const taal = await getTaal()
  const t = LEDENAPP[taal].profiel
  const f = PROFIELFOTO[taal]
  const regels: [string, string | null][] = [
    [t.lidnummer, lid.lidnummer],
    [t.email, lid.email],
    [t.telefoon, lid.telefoon],
    [t.vestiging, vestigingNaam],
    [t.lidSinds, lid.lidSinds ? `${dagKortIn(lid.lidSinds, taal)} ${lid.lidSinds.slice(0, 4)}` : null],
  ]
  return (
    <div className="club-lidapp-tab">
      <div className="club-lidapp-profielkop">
        <Avatar naam={volledigeNaam(lid)} initialen={initialen(lid)} foto={{ soort: 'lid', id: lid.id, versie: lid.foto }} waar={foto.waar} voor={foto.voor} maat={64} vasteMaat={false} className="club-lidapp-avatar" />
        <div>
          <h2 className="club-lidapp-kop">{volledigeNaam(lid)}</h2>
          <span className="club-lidapp-status" data-status={lid.status}>
            {t.status[lid.status]}
          </span>
        </div>
      </div>
      {foto.bewerkbaar && (
        <section className="club-mijn-blok club-lidapp-foto" aria-labelledby="lidapp-foto">
          <h3 id="lidapp-foto">{f.titel}</h3>
          <FotoKiezer
            naam={volledigeNaam(lid)}
            initialen={initialen(lid)}
            foto={{ soort: 'lid', id: lid.id, versie: lid.foto ?? null }}
            adres="/api/club/lid/profielfoto"
            waar={foto.waar}
            voor={foto.voor}
            uitleg={foto.door ? `${f.doorSportschool(foto.door)} ${f.uitlegLid}` : f.uitlegLid}
            zonderAvatar
          />
        </section>
      )}
      <dl className="club-lidapp-gegevens">
        {regels.map(([label, waarde]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{waarde ?? t.nietIngevuld}</dd>
          </div>
        ))}
      </dl>
      <section className="club-lidapp-sportivity" aria-labelledby="lidapp-abonnement">
        <h3 id="lidapp-abonnement">
          <CreditCard aria-hidden size={16} /> {t.abonnement}
        </h3>
        <p className="club-lidapp-abo">{lid.abonnement ?? t.abonnementOnbekend}</p>
        <p>{t.vragen(sportschool)}</p>
      </section>
      {kopen}
      {extra}
      {hulp}
      {teksten && <LedenappJuridisch teksten={teksten} sportschool={sportschool} />}
      <section className="club-lidapp-taal" aria-label={t.taal}>
        <span>{t.taal}</span>
        <TaalKeuze className="club-lidapp-taalkeuze" />
      </section>
      {account}
      {pilotNoot && (
        <p className="club-lidapp-voetnoot">
          <LockKeyhole aria-hidden size={14} /> {t.pilot}
        </p>
      )}
    </div>
  )
}
