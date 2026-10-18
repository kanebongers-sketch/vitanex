import Link from 'next/link'
import { Check, Clock, FileSpreadsheet, ImageIcon, LifeBuoy, MapPin, QrCode, Smartphone, Users, CalendarDays, ArrowRight } from 'lucide-react'
import { STAPPEN, startPad, type StapSleutel, type StapStand } from '@/lib/club/start/stappen'

// De stappen zonder eigen invoer: welkom, leden inlezen, ledenapp en check-in,
// en het overzicht aan het eind. Alleen uitleg en links naar de plek waar het
// echt gebeurt; niets hier belooft meer dan Club doet.

export const STAP_INTRO: Record<StapSleutel, string> = {
  welkom: 'In een kwartier zet je je sportschool neer. Elke stap kun je overslaan; je gaat later verder waar je was.',
  huisstijl: 'Je logo en kleur staan straks overal: in Club, in de ledenapp en in de mails aan leden. Rechts zie je meteen hoe het wordt.',
  vestigingen: 'Waar je sportschool zit en wanneer hij open is. Heb je meer vestigingen, dan voeg je ze hier toe.',
  onderdelen: 'Zet uit wat je niet gebruikt. Het verdwijnt dan uit het menu, voor jou en je team.',
  lessen: 'Kies de groepslessen die je geeft en zet een paar vaste lessen in je week. Neem een voorbeeld over met een klik.',
  team: 'Voeg je medewerkers toe met hun rol. Ieder krijgt een eigen inloglink en ziet alleen wat bij die rol hoort.',
  leden: 'Lees je leden in uit je huidige systeem. Je ziet eerst precies wat er verandert; er wordt nooit iemand verwijderd.',
  ledenapp: 'Je leden checken in met de QR-code in de app op hun telefoon. Zo werkt het, en hier pas je het aan.',
  klaar: 'Dit staat er. Wat nog open staat kun je altijd later doen, hier of in het instellingencentrum.',
}

const NODIG = [
  { icoon: ImageIcon, tekst: 'Je logo, het liefst als PNG of SVG met een doorzichtige achtergrond' },
  { icoon: MapPin, tekst: 'Adres en openingstijden van elke vestiging' },
  { icoon: CalendarDays, tekst: 'Welke groepslessen je geeft, en wanneer' },
  { icoon: Users, tekst: 'Namen en e-mailadressen van je team' },
  { icoon: FileSpreadsheet, tekst: 'Een export van je ledenbestand (CSV of Excel)' },
]

export function StapWelkom() {
  return (
    <div className="club-start-twee">
      <section className="club-start-blok" aria-labelledby="start-nodig-kop">
        <h2 id="start-nodig-kop">Wat je nodig hebt</h2>
        <ul className="club-start-nodig" role="list">
          {NODIG.map(({ icoon: Icoon, tekst }) => (
            <li key={tekst}>
              <Icoon aria-hidden size={18} />
              <span>{tekst}</span>
            </li>
          ))}
        </ul>
        <p className="club-hint">Heb je iets nog niet bij de hand? Sla die stap over en kom later terug.</p>
      </section>
      <section className="club-start-blok" aria-labelledby="start-route-kop">
        <h2 id="start-route-kop">Zo gaat het</h2>
        <ol className="club-start-route">
          {STAPPEN.slice(1).map((s) => (
            <li key={s.sleutel}>
              <span className="club-start-route-titel">{s.titel}</span>
              <span className="club-zacht">{s.kort}</span>
              <span className="club-start-route-tijd">
                <Clock aria-hidden size={12} /> {s.minuten} min
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export function StapLedenInlezen({ importPad }: { importPad: string | null }) {
  return (
    <div className="club-start-twee">
      <section className="club-start-blok" aria-labelledby="start-csv-kop">
        <h2 id="start-csv-kop">Zo maak je het bestand</h2>
        <ol className="club-start-genummerd">
          <li>Exporteer je leden uit je huidige systeem (bijvoorbeeld Sportivity) als CSV.</li>
          <li>Werk je met Excel? Kies Bestand, Opslaan als, en dan CSV. Puntkomma of komma maakt niet uit.</li>
          <li>Voornaam en achternaam zijn verplicht. E-mail, telefoon, geboortedatum, abonnement, status, lid sinds en lidnummer nemen we mee als ze erin staan.</li>
          <li>Club herkent de kolommen zelf. Klopt er een niet, dan kies je hem met de hand.</li>
        </ol>
      </section>
      <section className="club-start-blok club-start-actie" aria-labelledby="start-inlezen-kop">
        <h2 id="start-inlezen-kop">Inlezen</h2>
        <p>Je ziet eerst een controle: wie nieuw is, wie wordt bijgewerkt en welke rijen niet kloppen. Pas daarna lees je in. Nieuwe leden worden toegevoegd, bestaande bijgewerkt.</p>
        {importPad ? (
          <Link href={importPad} className="club-knop club-knop--primair">
            <FileSpreadsheet aria-hidden size={16} /> Ledenbestand inlezen
          </Link>
        ) : (
          <p className="club-melding">Leden staat uit of er is nog geen vestiging. Zet Leden aan bij Onderdelen of voeg eerst een vestiging toe.</p>
        )}
        <p className="club-hint">Na het inlezen kom je terug in de wizard via Start op Vandaag.</p>
      </section>
    </div>
  )
}

interface StapLedenappProps {
  appAan: boolean
  checkinAan: boolean
}

export function StapLedenapp({ appAan, checkinAan }: StapLedenappProps) {
  return (
    <div className="club-start-twee">
      <section className="club-start-blok" aria-labelledby="start-qr-kop">
        <h2 id="start-qr-kop">Inchecken met de telefoon</h2>
        <ol className="club-start-stappen-qr">
          <li>
            <Smartphone aria-hidden size={20} />
            <span>Een lid zet de ledenapp op het beginscherm van de telefoon en logt in.</span>
          </li>
          <li>
            <QrCode aria-hidden size={20} />
            <span>In de app staat een persoonlijke QR-code. Die laat het lid bij binnenkomst zien.</span>
          </li>
          <li>
            <Check aria-hidden size={20} />
            <span>Aan de balie scan je de code, of zoek je het lid op naam. Het bezoek telt meteen mee in de cijfers.</span>
          </li>
        </ol>
        <p className="club-hint">QR met de telefoon is de standaard. Geen pasjes nodig en niets te kopen.</p>
      </section>
      <section className="club-start-blok club-start-actie" aria-labelledby="start-app-kop">
        <h2 id="start-app-kop">Bekijken en aanpassen</h2>
        {appAan ? (
          <ul className="club-start-links" role="list">
            <li><Link href="/clubkane/app">Zo ziet een lid de app <ArrowRight aria-hidden size={14} /></Link></li>
            <li><Link href="/clubkane/beheer/ledenapp">Welkomsttekst, tabbladen en check-in code <ArrowRight aria-hidden size={14} /></Link></li>
            {checkinAan && <li><Link href="/clubkane/checkin">De check-in aan de balie <ArrowRight aria-hidden size={14} /></Link></li>}
          </ul>
        ) : (
          <p className="club-melding">De ledenapp staat uit. Zet hem aan bij Onderdelen als je hem wilt gebruiken.</p>
        )}
      </section>
    </div>
  )
}

interface StapKlaarProps {
  stand: readonly StapStand[]
  vestiging: string | null
}

export function StapKlaar({ stand, vestiging }: StapKlaarProps) {
  const lijst = stand.filter((s) => s.sleutel !== 'klaar' && s.sleutel !== 'welkom')
  return (
    <div className="club-start-twee">
      <section className="club-start-blok" aria-labelledby="start-overzicht-kop">
        <h2 id="start-overzicht-kop">Overzicht</h2>
        <ul className="club-start-overzicht" role="list">
          {lijst.map((s) => (
            <li key={s.sleutel} data-af={s.af || undefined}>
              <span className="club-start-bol" aria-hidden>{s.af ? <Check size={12} strokeWidth={3} /> : s.nummer}</span>
              <span className="club-start-overzicht-tekst">
                <strong>{s.titel}</strong>
                <span className="club-zacht">{s.kort}</span>
              </span>
              {s.af ? (
                <span className="club-chip club-chip--ok">{s.vanzelf ? 'Al ingesteld' : 'Af'}</span>
              ) : (
                <Link href={startPad(s.nummer, vestiging)} className="club-knop club-knop--klein">
                  Nu doen
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="club-start-blok club-start-hulp" aria-labelledby="start-hulp-kop">
        <LifeBuoy aria-hidden size={28} />
        <h2 id="start-hulp-kop">Hulp nodig?</h2>
        <p>Kom je er niet uit, of wil je dat we meekijken? Bij de duurdere pakketten zit persoonlijke hulp bij het inrichten gratis inbegrepen.</p>
        <Link href="/clubkane/hulp" className="club-knop">
          Naar hulp en support
        </Link>
        <p className="club-hint">Alles uit deze wizard vind je later ook terug in het instellingencentrum onder Beheer.</p>
      </section>
    </div>
  )
}
