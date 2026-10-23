import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ListChecks } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { StartStappen } from '@/components/aiyourgym/home/StartStappen'
import { Figuur } from '@/components/aiyourgym/mockups/kaders'
import { ImportScherm } from '@/components/aiyourgym/mockups/ImportScherm'
import { Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { WatKomtMee } from '@/components/aiyourgym/home/WatKomtMee'
import { WelNiet } from '@/components/aiyourgym/home/WelNiet'
import { Knop, PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN, DEMO_AANVRAGEN, OVERSTAPCHECKLIST } from '@/components/aiyourgym/site/paden'

export const metadata: Metadata = {
  title: 'Overstappen',
  description:
    "Zo stap je over op AI Your Gym: aanmelden, de startwizard in acht stappen, je ledenbestand inlezen als CSV of Excel en je team uitnodigen per mail. Met hulp bij de start.",
}

const STAPPEN = [
  {
    titel: 'Maak je omgeving aan',
    tekst: `Je kiest een pakket en je eigen adres, zoals aiyourgym.com/jouwgym. Je omgeving staat direct klaar en je probeert alles ${PROEFDAGEN} dagen gratis.`,
  },
  {
    titel: 'Kies je soort sportschool',
    tekst: 'Hier begint de startwizard. Gym, boutique, PT-studio, keten of iets anders: onderdelen, lestypen, openingstijden en rechten staan daarna alvast klaar. Je kiest ook een streefdatum om live te gaan.',
  },
  {
    titel: 'Huisstijl, vestiging en lessen',
    tekst: 'Logo, kleur en adres. Per vestiging de openingstijden en de regels voor reserveren. Je lestypen en je vaste week met zaal en instructeur zet je direct in de wizard.',
  },
  {
    titel: 'Haal je team erbij',
    tekst: 'Trainers, groepslesinstructeurs en clubmanagers. Je nodigt ze in de wizard uit: ze krijgen een mail met een link om hun wachtwoord te kiezen. De eigenaar bepaalt wat elke rol ziet.',
  },
  {
    titel: 'Lees je ledenbestand in',
    tekst:
      'Exporteer je leden als CSV uit je huidige systeem, of kies je Excel-lijst (.xlsx). AI Your Gym herkent de gangbare kolommen en je koppelt de rest met de hand. Je ziet eerst precies wat er verandert: nieuwe leden komen erbij, bestaande worden bijgewerkt, er wordt nooit iemand verwijderd.',
  },
  {
    titel: 'Live, en je leden op de app',
    tekst:
      'Pas als alles echt staat, staat je sportschool live en gaat de rest van Club open. Dan print je de poster met QR-code, nodig je je leden uit voor de app en check je de eerste leden in. De oefenbibliotheek met coaching staat al klaar voor je schema’s.',
  },
] as const

const VRAGEN = [
  {
    vraag: 'Moet ik stoppen met mijn ledenadministratie?',
    antwoord:
      'Nee. AI Your Gym werkt naast je ledenadministratie. Incasso, abonnementen en betalingen blijven daar. Je leest je leden in met een CSV- of Excel-bestand, en later opnieuw als er veel is veranderd.',
  },
  {
    vraag: 'Wat als mijn bestand andere kolomnamen heeft?',
    antwoord: 'Gangbare namen zoals Voornaam, First name of Roepnaam worden herkend. Elke andere kolom koppel je zelf aan het juiste veld, voordat er iets wordt opgeslagen.',
  },
  {
    vraag: 'Kan ik eerst rustig proberen?',
    antwoord: `Ja. Je hebt ${PROEFDAGEN} dagen om alles uit te proberen met je eigen team.`,
  },
  {
    vraag: 'Krijg ik hulp bij de start?',
    antwoord: 'Een startwizard leidt je in acht stappen door de inrichting, met hulp bij elke stap. In de pakketten Club en Keten zit daarnaast persoonlijke hulp, zonder extra kosten: we lopen je ledenbestand, je rooster en je eerste schema’s samen met je door, zodat je club goed staat voordat je leden de app krijgen.',
  },
] as const

export default function OverstappenPagina() {
  return (
    <>
      <PaginaKop
        label="Overstappen"
        titel="Overstappen zonder dat je club stilvalt."
        tekst="Je ledenadministratie blijft gewoon draaien. Stap voor stap zet je je club erin, en je ziet steeds eerst wat er gebeurt."
      >
        <div className="ayg-knoppen">
          <Knop href={AANMELDEN} soort="accent" pijl>
            Begin met {PROEFDAGEN} dagen gratis
          </Knop>
          <Knop href={DEMO_AANVRAGEN} soort="rand">
            Plan een gratis demo
          </Knop>
        </div>
        <Geruststelling aantal={GERUST_BIJ_KNOP} onder />
      </PaginaKop>
      <section className="ayg-sectie" aria-labelledby="stappen-titel">
        <div className="ayg-wrap ayg-gesplitst">
          <div className="ayg-stapel">
            <SectieKop id="stappen-titel" label="In zes stappen" titel="Van export naar een draaiende club." />
            <Figuur className="ayg-onthul" label="Een ledenbestand inlezen: kolommen uit het bestand gekoppeld aan velden, met het aantal nieuwe, bijgewerkte, ongewijzigde en dubbele leden">
              <ImportScherm />
            </Figuur>
          </div>
          <ol className="ayg-genummerd">
            {STAPPEN.map((s) => (
              <li key={s.titel}>
                <div>
                  <h3 className="ayg-h3">{s.titel}</h3>
                  <p>{s.tekst}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="ayg-wrap">
          <Link href={OVERSTAPCHECKLIST} className="ayg-cl-tip">
            <ListChecks size={20} aria-hidden />
            <span>
              <strong>Gratis overstapchecklist</strong>
              <span>Alles wat je regelt, van voorbereiden tot de eerste maand. Zonder account, ook te printen.</span>
            </span>
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </section>
      <WelNiet />
      <WatKomtMee />
      <StartStappen metLink={false} />
      <section className="ayg-sectie" id="vragen" aria-labelledby="overstap-vragen-titel">
        <div className="ayg-wrap ayg-gesplitst">
          <SectieKop id="overstap-vragen-titel" label="Vragen" titel="Over overstappen." />
          <Vragen vragen={VRAGEN} />
        </div>
      </section>
      <AanmeldBand titel="Klaar om over te stappen?" />
    </>
  )
}
