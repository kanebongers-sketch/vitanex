import type { Metadata } from 'next'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { Figuur } from '@/components/aiyourgym/mockups/kaders'
import { ImportScherm } from '@/components/aiyourgym/mockups/ImportScherm'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Knop, PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN } from '@/components/aiyourgym/site/paden'

export const metadata: Metadata = {
  title: 'Overstappen',
  description:
    "Zo stap je over op AI Your Gym: ledenbestand inlezen met een CSV-bestand, huisstijl en vestigingen instellen, schema's opbouwen en je team erbij halen. Met hulp bij de start.",
}

const STAPPEN = [
  {
    titel: 'Maak je omgeving aan',
    tekst: `Je krijgt een eigen omgeving voor je sportschool en probeert alles ${PROEFDAGEN} dagen gratis.`,
  },
  {
    titel: 'Huisstijl en vestigingen',
    tekst: 'Logo, naam en kleuren. Per vestiging de zalen, openingstijden, sluitingsdagen en de regels voor reserveren.',
  },
  {
    titel: 'Lees je ledenbestand in',
    tekst:
      'Exporteer je leden als CSV uit je huidige systeem of uit Excel. AI Your Gym herkent de gangbare kolommen en je koppelt de rest met de hand. Je ziet eerst precies wat er verandert: nieuwe leden komen erbij, bestaande worden bijgewerkt, er wordt nooit iemand verwijderd.',
  },
  {
    titel: 'Zet je lessen in het rooster',
    tekst: 'Groepslessen per zaal met het aantal plekken. Daarna kunnen leden reserveren, met wachtlijst bij volle lessen.',
  },
  {
    titel: 'Bouw je schema’s op',
    tekst:
      'De oefenbibliotheek staat klaar, met coaching en beelden bij de oefeningen. Bij een nieuwe intake maakt AI Your Gym een startvoorstel dat de trainer aanpast. Bestaande schema’s zet je over in de editor.',
  },
  {
    titel: 'Haal je team erbij',
    tekst: 'Trainers, groepslesinstructeurs en clubmanagers. De eigenaar bepaalt wat de clubmanager ziet.',
  },
] as const

const VRAGEN = [
  {
    vraag: 'Moet ik stoppen met mijn ledenadministratie?',
    antwoord:
      'Nee. AI Your Gym werkt naast je ledenadministratie. Incasso, abonnementen en betalingen blijven daar. Je leest je leden in met een CSV-bestand, en later opnieuw als er veel is veranderd.',
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
    antwoord: 'Ja. We lopen de inrichting met je door: het ledenbestand, je rooster en je eerste schema’s. Zo staat je club goed voordat je leden de app krijgen.',
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
        <Knop href={AANMELDEN} soort="accent" pijl>
          Begin met {PROEFDAGEN} dagen gratis
        </Knop>
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
      </section>
      <section className="ayg-sectie ayg-podium" aria-labelledby="hulp-titel">
        <div className="ayg-wrap">
          <SectieKop
            naast
            id="hulp-titel"
            label="Hulp bij de start"
            titel="Je staat er niet alleen voor."
            tekst="We lopen de inrichting samen met je door, zodat je ledenbestand, rooster en eerste schema's goed staan voordat je leden de app krijgen."
          />
        </div>
      </section>
      <section className="ayg-sectie" aria-labelledby="overstap-vragen-titel">
        <div className="ayg-wrap ayg-gesplitst">
          <SectieKop id="overstap-vragen-titel" label="Vragen" titel="Over overstappen." />
          <Vragen vragen={VRAGEN} />
        </div>
      </section>
      <AanmeldBand titel="Klaar om over te stappen?" />
    </>
  )
}
