'use client'

import Link from 'next/link'

function MarketingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b"
      style={{ background: 'rgba(10,15,30,0.96)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1D9E75' }}>
            <span className="text-white text-sm font-bold">V</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Vitanex</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="text-sm transition" style={{ color: 'rgba(255,255,255,0.45)' }}>Contact</Link>
          <Link href="/login" className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition hover:opacity-90"
            style={{ background: '#1D9E75' }}>
            Inloggen
          </Link>
        </div>
      </div>
    </nav>
  )
}

const SECTIONS = [
  {
    id: 'aanvaarding',
    titel: '1. Aanvaarding van de voorwaarden',
    inhoud: `Door gebruik te maken van het Vitanex-platform (de "Dienst"), aanvaardt u deze Algemene Gebruiksvoorwaarden ("Voorwaarden"). Als u niet akkoord gaat met deze Voorwaarden, mag u de Dienst niet gebruiken.

Deze Voorwaarden zijn van toepassing op alle gebruikers van de Dienst, inclusief HR-managers, medewerkers en beheerders. Vitanex behoudt zich het recht voor deze Voorwaarden op elk moment te wijzigen. Wijzigingen worden minimaal 14 dagen vooraf gecommuniceerd via e-mail of een melding in de applicatie.`,
  },
  {
    id: 'dienst',
    titel: '2. Beschrijving van de Dienst',
    inhoud: `Vitanex is een SaaS-platform voor werknemerswelzijn dat HR-teams in staat stelt om anoniem gegevens te verzamelen over het welbevinden van medewerkers, trends te analyseren en proactief in te grijpen bij risicosignalen.

De Dienst omvat onder meer:
• Anonieme wekelijkse check-ins voor medewerkers
• Een HR-dashboard met teamoverzichten en AI-inzichten
• Persoonlijke vitaliteitstools (journal, focus timer, burn-out scan)
• Een AI-welzijnscoach voor medewerkers
• Teamchat en feedbackmodule
• Rapportagefunctionaliteiten voor HR

Vitanex kan de Dienst op elk moment uitbreiden, aanpassen of bepaalde functies tijdelijk of permanent stopzetten.`,
  },
  {
    id: 'accounts',
    titel: '3. Accounts en registratie',
    inhoud: `Om de Dienst te gebruiken, moet een organisatie een bedrijfsaccount aanmaken. De HR-beheerder is verantwoordelijk voor het uitnodigen van medewerkers en het beheer van het account.

U bent verantwoordelijk voor:
• Het geheimhouden van uw inloggegevens
• Alle activiteiten die plaatsvinden onder uw account
• Het onmiddellijk melden van ongeautoriseerd gebruik

Vitanex behoudt zich het recht voor accounts te deactiveren bij schending van deze Voorwaarden.`,
  },
  {
    id: 'privacy',
    titel: '4. Privacy en anonimiteit',
    inhoud: `Vitanex hecht bijzonder veel belang aan de privacy van medewerkers. Het platform is gebouwd rond het principe van privacy-by-design:

• Check-in antwoorden worden nooit op individueel niveau gedeeld met HR
• HR ziet uitsluitend geaggregeerde teamgegevens (gemiddelden, trends)
• Individuele scores worden pas zichtbaar als een team kleiner is dan 5 personen, waarbij een beschermingsmelding wordt getoond
• Persoonlijke journaalentries en coachgesprekken zijn strikt privé
• Anonieme feedback bevat geen traceerbare metadata

Alle gegevensverwerking vindt plaats conform de AVG (Algemene Verordening Gegevensbescherming). De volledige Privacyverklaring is beschikbaar op vitanex.app/privacy.`,
  },
  {
    id: 'gegevens',
    titel: '5. Gegevensverwerking en AVG',
    inhoud: `Vitanex treedt op als gegevensverwerker in de zin van de AVG. De klantorganisatie treedt op als verwerkingsverantwoordelijke.

Vitanex verwerkt persoonsgegevens uitsluitend:
• Voor het verlenen van de overeengekomen Dienst
• Op basis van een geldige verwerkersovereenkomst (DPA)
• Nooit voor commerciële doeleinden van derden

Gegevens worden opgeslagen op beveiligde servers binnen de Europese Economische Ruimte. Vitanex maakt gebruik van Supabase (data hosting) en Anthropic Claude (AI-analyse), met passende verwerkersovereenkomsten.

Medewerkers hebben te allen tijde het recht op inzage, correctie en verwijdering van hun persoonsgegevens via instellingen@vitanex.app.`,
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
    inhoud: `Alle rechten, titels en belangen met betrekking tot de Dienst — inclusief software, UI/UX-ontwerp, logo's, teksten en algoritmen — zijn en blijven exclusief eigendom van Vitanex BV.

U ontvangt een beperkte, niet-exclusieve, niet-overdraagbare licentie om de Dienst te gebruiken conform deze Voorwaarden. U mag de software niet kopiëren, aanpassen, decompileren, reverse-engineeren of distribueren zonder voorafgaande schriftelijke toestemming.

Feedback, suggesties of ideeën die u deelt over de Dienst kunnen door Vitanex vrij worden gebruikt zonder verplichtingen.`,
  },
  {
    id: 'abonnement',
    titel: '8. Abonnement en betalingen',
    inhoud: `De Dienst wordt aangeboden via een maandelijks of jaarlijks abonnement per medewerker. Facturering vindt plaats vooraf op basis van het aantal actieve gebruikers.

• Minimumabonnement: zie actuele prijzenpagina op vitanex.app/#prijzen
• Betalingstermijn: 30 dagen na factuurdatum
• Automatische verlenging tenzij 30 dagen voor het einde van de looptijd opgezegd
• Prijswijzigingen worden minimaal 60 dagen vooraf gecommuniceerd

Bij wanbetaling kan de toegang tot de Dienst worden opgeschort na een betalingsherinnering. Vitanex is niet aansprakelijk voor verlies van gegevens als gevolg van opschorting wegens wanbetaling.`,
  },
  {
    id: 'aansprakelijkheid',
    titel: '9. Beperking van aansprakelijkheid',
    inhoud: `De Dienst wordt aangeboden "as is" en "as available". Vitanex geeft geen garanties, expliciet of impliciet, met betrekking tot de beschikbaarheid, nauwkeurigheid of geschiktheid voor een bepaald doel.

Vitanex is niet aansprakelijk voor:
• Indirecte, incidentele of gevolgschade
• Verlies van gegevens, inkomsten of winst
• Schade als gevolg van ongeautoriseerde toegang door derden
• Beslissingen genomen op basis van AI-inzichten uit het platform

De totale aansprakelijkheid van Vitanex is in alle gevallen beperkt tot het bedrag dat u in de afgelopen 12 maanden heeft betaald voor de Dienst.`,
  },
  {
    id: 'beëindiging',
    titel: '10. Beëindiging',
    inhoud: `U kunt de Dienst op elk moment opzeggen via uw accountbeheer of door een e-mail te sturen naar kanebongers@gmail.com.

Bij beëindiging:
• Wordt de toegang tot de Dienst uiterlijk na 30 dagen stopgezet
• Worden alle persoonsgegevens binnen 90 dagen verwijderd, tenzij wettelijke bewaarplichten gelden
• Ontvangt u op verzoek een export van uw bedrijfsgegevens

Vitanex kan het account onmiddellijk beëindigen bij ernstige schending van deze Voorwaarden.`,
  },
  {
    id: 'toepasselijk',
    titel: '11. Toepasselijk recht',
    inhoud: `Deze Voorwaarden worden beheerst door het Belgisch recht. Geschillen worden voorgelegd aan de bevoegde rechtbanken van Antwerpen, België.

Indien een bepaling van deze Voorwaarden ongeldig of niet-afdwingbaar wordt verklaard, blijven de overige bepalingen onverminderd van kracht.

Vitanex BV
Antwerpen, België
KBO: [registratienummer]
BTW: BE [btw-nummer]`,
  },
]

export default function Voorwaarden() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e', fontFamily: 'var(--font-geist-sans)' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(29,158,117,0.08) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold border"
            style={{ background: 'rgba(29,158,117,0.1)', borderColor: 'rgba(29,158,117,0.25)', color: '#4ECBA5' }}>
            Juridisch
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Algemene Voorwaarden
          </h1>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Laatst bijgewerkt: 1 mei 2025 · Van kracht vanaf 1 juni 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-4 gap-12">

        {/* Table of contents */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Inhoud
            </p>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-sm py-1.5 transition leading-tight"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                >
                  {s.titel}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Sections */}
        <main className="lg:col-span-3 flex flex-col gap-12">
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="text-xl font-bold text-white mb-4">{s.titel}</h2>
              <div className="text-base leading-relaxed whitespace-pre-line"
                style={{ color: 'rgba(255,255,255,0.55)' }}>
                {s.inhoud}
              </div>
              <div className="mt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            </section>
          ))}

          {/* Contact */}
          <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-white font-semibold mb-2">Vragen over deze voorwaarden?</p>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Neem contact op met ons via onderstaand e-mailadres.
            </p>
            <a
              href="mailto:kanebongers@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition hover:opacity-90"
              style={{ background: '#1D9E75' }}
            >
              ✉️ kanebongers@gmail.com
            </a>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer style={{ background: '#060c18', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1D9E75' }}>
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <span className="font-bold text-white">Vitanex</span>
          </Link>
          <div className="flex items-center gap-6 text-xs flex-wrap justify-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
            <Link href="/voorwaarden" className="transition hover:text-white/50" style={{ color: '#4ECBA5' }}>Voorwaarden</Link>
            <Link href="/contact" className="transition hover:text-white/50">Contact</Link>
            <Link href="/login" className="transition hover:text-white/50">Inloggen</Link>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>© 2025 Vitanex · Gemaakt in België 🇧🇪</p>
        </div>
      </footer>
    </div>
  )
}
