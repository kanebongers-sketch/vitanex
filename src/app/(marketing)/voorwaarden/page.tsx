'use client'

import { Mail } from 'lucide-react'
import Nav from '@/components/marketing/landing/Nav'
import Footer from '@/components/marketing/landing/Footer'
import { COLORS, FONT, EASE, glassPanel } from '@/components/marketing/theme'

const SECTIONS = [
  {
    id: 'aanvaarding',
    titel: '1. Aanvaarding van de voorwaarden',
    inhoud: `Door gebruik te maken van het MentaForce-platform (de "Dienst"), aanvaardt u deze Algemene Gebruiksvoorwaarden ("Voorwaarden"). Als u niet akkoord gaat met deze Voorwaarden, mag u de Dienst niet gebruiken.

Deze Voorwaarden zijn van toepassing op alle gebruikers van de Dienst, inclusief HR-managers, medewerkers en beheerders. MentaForce behoudt zich het recht voor deze Voorwaarden op elk moment te wijzigen. Wijzigingen worden minimaal 14 dagen vooraf gecommuniceerd via e-mail of een melding in de applicatie.`,
  },
  {
    id: 'dienst',
    titel: '2. Beschrijving van de Dienst',
    inhoud: `MentaForce is een SaaS-platform voor werknemerswelzijn dat HR-teams in staat stelt om anoniem gegevens te verzamelen over het welbevinden van medewerkers, trends te analyseren en proactief in te grijpen bij risicosignalen.

De Dienst omvat onder meer:
• Anonieme wekelijkse check-ins voor medewerkers
• Een HR-dashboard met teamoverzichten en AI-inzichten
• Persoonlijke vitaliteitstools (journal, focus timer, burn-out scan)
• Een AI-welzijnscoach voor medewerkers
• Teamchat en feedbackmodule
• Rapportagefunctionaliteiten voor HR

MentaForce kan de Dienst op elk moment uitbreiden, aanpassen of bepaalde functies tijdelijk of permanent stopzetten.`,
  },
  {
    id: 'accounts',
    titel: '3. Accounts en registratie',
    inhoud: `Om de Dienst te gebruiken, moet een organisatie een bedrijfsaccount aanmaken. De HR-beheerder is verantwoordelijk voor het uitnodigen van medewerkers en het beheer van het account.

U bent verantwoordelijk voor:
• Het geheimhouden van uw inloggegevens
• Alle activiteiten die plaatsvinden onder uw account
• Het onmiddellijk melden van ongeautoriseerd gebruik

MentaForce behoudt zich het recht voor accounts te deactiveren bij schending van deze Voorwaarden.`,
  },
  {
    id: 'privacy',
    titel: '4. Privacy en anonimiteit',
    inhoud: `MentaForce hecht bijzonder veel belang aan de privacy van medewerkers. Het platform is gebouwd rond het principe van privacy-by-design:

• Check-in antwoorden worden nooit op individueel niveau gedeeld met HR
• HR ziet uitsluitend geaggregeerde teamgegevens (gemiddelden, trends)
• Individuele scores worden pas zichtbaar als een team kleiner is dan 5 personen, waarbij een beschermingsmelding wordt getoond
• Persoonlijke journaalentries en coachgesprekken zijn strikt privé
• Anonieme feedback bevat geen traceerbare metadata

Alle gegevensverwerking vindt plaats conform de AVG (Algemene Verordening Gegevensbescherming). Vragen over privacy kunt u stellen via info@mentaforce.nl.`,
  },
  {
    id: 'gegevens',
    titel: '5. Gegevensverwerking en AVG',
    inhoud: `MentaForce treedt op als gegevensverwerker in de zin van de AVG. De klantorganisatie treedt op als verwerkingsverantwoordelijke.

MentaForce verwerkt persoonsgegevens uitsluitend:
• Voor het verlenen van de overeengekomen Dienst
• Op basis van een geldige verwerkersovereenkomst (DPA)
• Nooit voor commerciële doeleinden van derden

Gegevens worden opgeslagen op beveiligde servers binnen de Europese Economische Ruimte. MentaForce maakt gebruik van Supabase (data hosting) en Anthropic Claude (AI-analyse), met passende verwerkersovereenkomsten.

Medewerkers hebben te allen tijde het recht op inzage, correctie en verwijdering van hun persoonsgegevens via info@mentaforce.nl.`,
  },
  {
    id: 'gebruik',
    titel: '6. Toegestaan gebruik',
    inhoud: `U mag de Dienst uitsluitend gebruiken voor legitieme, zakelijke doeleinden. Het is verboden om:

• De Dienst te gebruiken voor illegale activiteiten
• Andere gebruikers te intimideren, bedreigen of schaden
• Virussen, malware of schadelijke code te verspreiden
• Pogingen te ondernemen om de beveiliging van het platform te omzeilen
• Gegevens van andere gebruikers te scrapen of ongeoorloofd te raadplegen
• De Dienst te gebruiken op een manier die de werking schaadt voor andere gebruikers
• Nep-accounts aan te maken of valse identiteiten te gebruiken`,
  },
  {
    id: 'intellectueel',
    titel: '7. Intellectuele eigendom',
    inhoud: `Alle rechten, titels en belangen met betrekking tot de Dienst — inclusief software, UI/UX-ontwerp, logo's, teksten en algoritmen — zijn en blijven exclusief eigendom van MentaForce BV.

U ontvangt een beperkte, niet-exclusieve, niet-overdraagbare licentie om de Dienst te gebruiken conform deze Voorwaarden. U mag de software niet kopiëren, aanpassen, decompileren, reverse-engineeren of distribueren zonder voorafgaande schriftelijke toestemming.

Feedback, suggesties of ideeën die u deelt over de Dienst kunnen door MentaForce vrij worden gebruikt zonder verplichtingen.`,
  },
  {
    id: 'abonnement',
    titel: '8. Abonnement en betalingen',
    inhoud: `De Dienst wordt aangeboden via een maandelijks of jaarlijks abonnement per medewerker. Facturering vindt plaats vooraf op basis van het aantal actieve gebruikers.

• Prijzen en mogelijkheden: op aanvraag via info@mentaforce.nl
• Betalingstermijn: 30 dagen na factuurdatum
• Automatische verlenging tenzij 30 dagen voor het einde van de looptijd opgezegd
• Prijswijzigingen worden minimaal 60 dagen vooraf gecommuniceerd

Bij wanbetaling kan de toegang tot de Dienst worden opgeschort na een betalingsherinnering. MentaForce is niet aansprakelijk voor verlies van gegevens als gevolg van opschorting wegens wanbetaling.`,
  },
  {
    id: 'aansprakelijkheid',
    titel: '9. Beperking van aansprakelijkheid',
    inhoud: `De Dienst wordt aangeboden "as is" en "as available". MentaForce geeft geen garanties, expliciet of impliciet, met betrekking tot de beschikbaarheid, nauwkeurigheid of geschiktheid voor een bepaald doel.

MentaForce is niet aansprakelijk voor:
• Indirecte, incidentele of gevolgschade
• Verlies van gegevens, inkomsten of winst
• Schade als gevolg van ongeautoriseerde toegang door derden
• Beslissingen genomen op basis van AI-inzichten uit het platform

De totale aansprakelijkheid van MentaForce is in alle gevallen beperkt tot het bedrag dat u in de afgelopen 12 maanden heeft betaald voor de Dienst.`,
  },
  {
    id: 'beëindiging',
    titel: '10. Beëindiging',
    inhoud: `U kunt de Dienst op elk moment opzeggen via uw accountbeheer of door een e-mail te sturen naar info@mentaforce.nl.

Bij beëindiging:
• Wordt de toegang tot de Dienst uiterlijk na 30 dagen stopgezet
• Worden alle persoonsgegevens binnen 90 dagen verwijderd, tenzij wettelijke bewaarplichten gelden
• Ontvangt u op verzoek een export van uw bedrijfsgegevens

MentaForce kan het account onmiddellijk beëindigen bij ernstige schending van deze Voorwaarden.`,
  },
  {
    id: 'toepasselijk',
    titel: '11. Toepasselijk recht',
    inhoud: `Deze Voorwaarden worden beheerst door het Nederlands recht. Geschillen worden voorgelegd aan de bevoegde rechtbanken van Amsterdam, Nederland.

Indien een bepaling van deze Voorwaarden ongeldig of niet-afdwingbaar wordt verklaard, blijven de overige bepalingen onverminderd van kracht.

MentaForce BV
Amsterdam, Nederland`,
  },
]

export default function Voorwaarden() {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.navy, color: COLORS.ink, fontFamily: FONT.grotesk }}>
      <Nav />

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '72px 0 80px', borderBottom: `1px solid ${COLORS.line}` }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 60% 80% at 50% 0%, ${COLORS.cyanSoft} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 28px', textAlign: 'center', position: 'relative' }}>
          <p style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 16px', margin: '0 0 24px', fontSize: 12, fontWeight: 600, border: `1px solid ${COLORS.lineStrong}`, background: COLORS.cyanSoft, color: COLORS.ink }}>
            Juridisch
          </p>
          <h1 style={{ fontWeight: 700, fontSize: 'clamp(34px, 6vw, 56px)', lineHeight: 1.04, letterSpacing: '-0.035em', color: COLORS.ink, margin: '0 0 18px' }}>
            Algemene Voorwaarden
          </h1>
          <p style={{ fontSize: 17, color: COLORS.inkDim, margin: 0 }}>
            Laatst bijgewerkt: 1 mei 2025 · Van kracht vanaf 1 juni 2025
          </p>
        </div>
      </section>

      {/* Inhoud */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 28px', display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>

        {/* Inhoudsopgave */}
        <aside style={{ flex: '0 1 220px', minWidth: 200 }}>
          <div style={{ position: 'sticky', top: 96 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.inkFaint, marginBottom: 16 }}>
              Inhoud
            </p>
            <nav aria-label="Inhoudsopgave" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  style={{ fontSize: 14, padding: '6px 0', lineHeight: 1.3, color: COLORS.inkDim, textDecoration: 'none', transition: `color .2s ${EASE}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.ink }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.inkDim }}
                >
                  {s.titel}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Secties */}
        <main style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 48, minWidth: 0 }}>
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} style={{ scrollMarginTop: 112 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink, margin: '0 0 16px' }}>{s.titel}</h2>
              <div style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-line', color: COLORS.inkDim }}>
                {s.inhoud}
              </div>
              <div aria-hidden style={{ marginTop: 32, borderTop: `1px solid ${COLORS.line}` }} />
            </section>
          ))}

          {/* Contact */}
          <div style={{ ...glassPanel, padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, margin: '0 0 8px' }}>Vragen over deze voorwaarden?</p>
            <p style={{ fontSize: 14, color: COLORS.inkDim, margin: '0 0 20px' }}>
              Neem contact op met ons via onderstaand e-mailadres.
            </p>
            <a
              href="mailto:info@mentaforce.nl"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 26px', borderRadius: 12, textDecoration: 'none',
                fontSize: 14, fontWeight: 600, color: COLORS.navyDeep, background: COLORS.cyan,
                boxShadow: `0 6px 24px ${COLORS.cyanSoft}`, transition: `transform .2s ${EASE}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Mail aria-hidden size={16} /> info@mentaforce.nl
            </a>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
