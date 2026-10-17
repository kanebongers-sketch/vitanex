import type { Metadata } from 'next'
import { CalendarClock, CalendarDays, Dumbbell, House, TrendingUp, UserRound } from 'lucide-react'
import { Huisstijl } from '@/components/aiyourgym/home/Huisstijl'
import { AppHome, AppLessen, AppSchema } from '@/components/aiyourgym/mockups/AppSchermen'
import { RepdbBron, Toestel } from '@/components/aiyourgym/mockups/kaders'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'

export const metadata: Metadata = {
  title: 'Ledenapp',
  description:
    'De ledenapp van AI Your Gym in de huisstijl van je sportschool: lessen reserveren met wachtlijst, afspraken boeken, het trainingsschema met coaching, voortgang en inchecken met een QR-code.',
}

const TABS = [
  { Icoon: House, titel: 'Home', tekst: 'De volgende les, bezoek deze maand, weken op rij, challenges en de QR-code om in te checken.' },
  { Icoon: CalendarDays, titel: 'Lessen', tekst: 'Het rooster met vrije plekken. Reserveren, annuleren en op de wachtlijst bij een volle les.' },
  { Icoon: CalendarClock, titel: 'Afspraken', tekst: 'Een intake, personal training of meting boeken bij een trainer.' },
  { Icoon: Dumbbell, titel: 'Schema', tekst: 'Het schema van de trainer per dag, met coaching en bewegende beelden bij elke oefening. Afvinken wat gedaan is.' },
  { Icoon: TrendingUp, titel: 'Voortgang', tekst: 'Trainingen per week en de eigen lichaamsmaten op een tijdlijn.' },
  { Icoon: UserRound, titel: 'Profiel', tekst: 'Eigen gegevens. Abonnement en betalingen blijven in je ledenadministratie.' },
] as const

const VRAGEN = [
  {
    vraag: 'Kan ik tabbladen uitzetten?',
    antwoord: 'Ja. Gebruik je bijvoorbeeld geen afspraken of groepslessen, dan zet je dat tabblad uit en zien je leden het niet.',
  },
  {
    vraag: 'Welke regels zien leden bij reserveren?',
    antwoord:
      'De regels van hun vestiging, in gewone taal: hoe ver vooruit ze kunnen reserveren, tot wanneer ze kunnen annuleren en wat er gebeurt bij te vaak niet komen. Die regels stel je zelf in.',
  },
  {
    vraag: 'Wat ziet een lid van zijn metingen?',
    antwoord:
      'Alleen de eigen lichaamsmaten en trainingen. Gezondheidsgegevens zoals bloeddruk en de notities van de trainer blijven bij het team en gaan nooit naar de app.',
  },
] as const

export default function LedenappPagina() {
  return (
    <>
      <PaginaKop
        label="Ledenapp"
        titel="De app die je leden elke week openen."
        tekst="Reserveren, inchecken, het schema van hun trainer en hun voortgang. In jouw naam, jouw logo en jouw kleuren."
      />
      <section className="ayg-sectie--krap" aria-label="De ledenapp op drie schermen">
        <div className="ayg-wrap">
          <div className="ayg-toestellen">
            <figure className="aygm-figuur">
              <div role="img" aria-label="Home: volgende les, bezoeken deze maand, weken op rij, QR-code en een challenge" className="aygm">
                <Toestel tab="Home">
                  <AppHome />
                </Toestel>
              </div>
              <figcaption className="ayg-toestel-label">Home</figcaption>
            </figure>
            <figure className="aygm-figuur">
              <div role="img" aria-label="Lessen: een dag van het rooster met vrije plekken, reserveren en wachtlijst" className="aygm">
                <Toestel tab="Lessen">
                  <AppLessen />
                </Toestel>
              </div>
              <figcaption className="ayg-toestel-label">Lessen</figcaption>
            </figure>
            <figure className="aygm-figuur">
              <div role="img" aria-label="Schema: dag A met vier oefeningen, twee afgevinkt" className="aygm">
                <Toestel tab="Schema">
                  <AppSchema />
                </Toestel>
              </div>
              <figcaption className="ayg-toestel-label">Schema</figcaption>
            </figure>
          </div>
          <p className="aygm-bijschrift">
            <span>Schermvoorbeelden met voorbeeldgegevens</span>
            <RepdbBron />
          </p>
        </div>
      </section>
      <section className="ayg-sectie" aria-labelledby="tabs-titel">
        <div className="ayg-wrap ayg-gesplitst">
          <SectieKop
            id="tabs-titel"
            label="Zes tabbladen"
            titel="Alles wat een lid zelf wil regelen."
            tekst="Minder vragen aan de balie, meer leden die weten wat ze vandaag gaan doen."
          />
          <ul className="ayg-tabs-lijst">
            {TABS.map(({ Icoon, titel, tekst }) => (
              <li key={titel}>
                <Icoon aria-hidden />
                <div>
                  <h3 className="ayg-h3">{titel}</h3>
                  <p>{tekst}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Huisstijl metLink={false} />
      <section className="ayg-sectie" aria-labelledby="app-vragen-titel">
        <div className="ayg-wrap ayg-gesplitst">
          <SectieKop id="app-vragen-titel" label="Vragen" titel="Goed om te weten." />
          <Vragen vragen={VRAGEN} />
        </div>
      </section>
      <AanmeldBand titel="Geef je leden een app met jouw naam erop." />
    </>
  )
}
