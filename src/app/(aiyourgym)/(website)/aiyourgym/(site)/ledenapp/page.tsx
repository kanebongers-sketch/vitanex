import type { Metadata } from 'next'
import type { ComponentType } from 'react'
import { Bell, CalendarClock, CalendarDays, Dumbbell, QrCode, Salad, TrendingUp, Trophy } from 'lucide-react'
import { Huisstijl } from '@/components/aiyourgym/home/Huisstijl'
import { AppHome, AppInloggen, AppSchema, AppVoeding } from '@/components/aiyourgym/mockups/AppSchermen'
import { Toestel, type AppTab } from '@/components/aiyourgym/mockups/kaders'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Knop, PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN, DEMO } from '@/components/aiyourgym/site/paden'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'

export const metadata: Metadata = {
  title: 'Ledenapp',
  description:
    'De ledenapp van AI Your Gym: een web-app op het beginscherm in de huisstijl van je sportschool. Inloggen met e-mailadres en wachtwoord, inchecken met de QR-code, lessen en afspraken boeken, schema met coaching, voeding, voortgang, challenges en meldingen.',
}

const SCHERMEN: readonly { tab: AppTab; titel: string; label: string; Scherm: ComponentType }[] = [
  { tab: 'Profiel', titel: 'Inloggen', label: 'Inloggen: het lid logt in met e-mailadres en een eigen wachtwoord', Scherm: AppInloggen },
  { tab: 'Home', titel: 'Home', label: 'Home: volgende les, bezoeken deze maand, weken op rij, QR-code en een challenge', Scherm: AppHome },
  { tab: 'Schema', titel: 'Schema', label: 'Schema: dag A met vier oefeningen, twee afgevinkt', Scherm: AppSchema },
  { tab: 'Voeding', titel: 'Voeding', label: 'Voeding: calorieen per dag, eiwit, koolhydraten en vet, en de maaltijden', Scherm: AppVoeding },
]

const INSTAP = [
  {
    titel: 'Een uitnodiging',
    tekst: 'Op de ledenkaart maak je een link met QR-code voor het lid. Daarmee activeert het lid binnen zeven dagen zijn account.',
  },
  {
    titel: 'Een eigen wachtwoord',
    tekst: 'Het lid kiest zelf een sterk wachtwoord en logt daarna in met e-mailadres en wachtwoord. Te makkelijke wachtwoorden worden geweigerd.',
  },
  {
    titel: 'Op het beginscherm',
    tekst: 'Met een tik staat de app op de telefoon, met de naam van je sportschool. Het lid blijft 90 dagen ingelogd.',
  },
] as const

const FUNCTIES = [
  { Icoon: QrCode, titel: 'Inchecken', tekst: 'De QR-code staat op het startscherm. Telefoon tonen bij binnenkomst en het lid is binnen.' },
  { Icoon: CalendarDays, titel: 'Lessen', tekst: 'Het rooster met vrije plekken. Reserveren, annuleren en op de wachtlijst bij een volle les.' },
  { Icoon: CalendarClock, titel: 'Afspraken', tekst: 'Een intake, personal training of meting boeken bij een trainer.' },
  { Icoon: Dumbbell, titel: 'Schema met coaching', tekst: 'Het schema van de trainer per dag, met kernpunten en bewegende beelden bij elke oefening. Afvinken wat gedaan is.' },
  { Icoon: Salad, titel: 'Voeding', tekst: 'Het voedingsplan van de trainer: calorieen, eiwit, koolhydraten, vet, maaltijden en adviezen.' },
  { Icoon: TrendingUp, titel: 'Voortgang', tekst: 'Trainingen per week en de eigen lichaamsmaten op een tijdlijn.' },
  { Icoon: Trophy, titel: 'Challenges en badges', tekst: 'Doelen zoals een aantal trainingen per maand of weken op rij, met de voortgang erbij.' },
  { Icoon: Bell, titel: 'Meldingen', tekst: 'Bevestiging en herinnering van een les of afspraak, en bericht als iemand van de wachtlijst door mag.' },
] as const

const VRAGEN = [
  {
    vraag: 'Moeten leden iets downloaden?',
    antwoord: 'Nee. Het is een web-app: leden openen de link en zetten de app met een tik op hun beginscherm. Er is geen account in een app store nodig.',
  },
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
  {
    vraag: 'Wat als een lid zijn telefoon kwijt is?',
    antwoord: 'Je maakt op de ledenkaart een nieuwe link. De oude link werkt dan niet meer en alle toestellen worden uitgelogd.',
  },
] as const

export default function LedenappPagina() {
  return (
    <>
      <PaginaKop
        label="Ledenapp"
        titel="Jouw sportschool op het beginscherm."
        tekst="Een app in jouw naam, logo en kleuren. Leden checken in, boeken lessen en afspraken, volgen het schema van hun trainer en zien hun voortgang."
      >
        <div className="ayg-knoppen">
          <Knop href={AANMELDEN} soort="accent" pijl>
            Probeer {PROEFDAGEN} dagen gratis
          </Knop>
          <Knop href={DEMO} soort="rand">
            Bekijk de app in de demo
          </Knop>
        </div>
      </PaginaKop>
      <section className="ayg-sectie--krap" aria-label="De ledenapp op vier schermen">
        <div className="ayg-wrap">
          <div className="ayg-toestellen ayg-toestellen--vier">
            {SCHERMEN.map(({ tab, titel, label, Scherm }) => (
              <figure key={titel} className="aygm-figuur">
                <div role="img" aria-label={label} className="aygm">
                  <Toestel tab={tab}>
                    <Scherm />
                  </Toestel>
                </div>
                <figcaption className="ayg-toestel-label">{titel}</figcaption>
              </figure>
            ))}
          </div>
          <p className="aygm-bijschrift">
            <span>Schermvoorbeelden met voorbeeldgegevens</span>
          </p>
        </div>
      </section>
      <section className="ayg-sectie" aria-labelledby="instap-titel">
        <div className="ayg-wrap">
          <SectieKop
            naast
            id="instap-titel"
            label="Zo komt een lid erin"
            titel="Geen wachtwoord, geen app store."
            tekst="Een web-app waarin leden inloggen met hun e-mailadres en een eigen wachtwoord. Veilig, en snel geregeld aan de balie."
          />
          <ol className="ayg-instap">
            {INSTAP.map((s, i) => (
              <li key={s.titel} className="ayg-onthul">
                <span className="ayg-instap-nr" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="ayg-h3">{s.titel}</h3>
                <p>{s.tekst}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="ayg-sectie" aria-labelledby="tabs-titel">
        <div className="ayg-wrap ayg-gesplitst ayg-gesplitst--boven">
          <SectieKop
            id="tabs-titel"
            label="In de app"
            titel="Alles wat een lid zelf wil regelen."
            tekst="Minder vragen aan de balie, meer leden die weten wat ze vandaag gaan doen."
          />
          <ul className="ayg-tabs-lijst ayg-tabs-lijst--twee">
            {FUNCTIES.map(({ Icoon, titel, tekst }) => (
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
        <div className="ayg-wrap ayg-gesplitst ayg-gesplitst--boven">
          <SectieKop id="app-vragen-titel" label="Vragen" titel="Goed om te weten." />
          <Vragen vragen={VRAGEN} />
        </div>
      </section>
      <AanmeldBand titel="Geef je leden een app met jouw naam erop." />
    </>
  )
}
