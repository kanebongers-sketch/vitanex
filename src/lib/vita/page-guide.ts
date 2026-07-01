import type { EmotionState } from '@/lib/vita/emotion-engine'

// ─── Page guide registry ─────────────────────────────────────────────────────
// VITA (de panda) gebruikt dit om per pagina uit te leggen waar je bent, waarom
// het ertoe doet, en wat je hier in één stap kunt doen. Doel: minder muur-van-
// informatie, meer "je gids wijst je de volgende stap" — als een game met levels.

export interface PageGuide {
  /** Korte, herkenbare naam van de pagina. */
  label: string
  /** Eén zin: wat is dit + waarom doet het ertoe (panda-stem, warm en kort). */
  uitleg: string
  /** De concrete volgende stap die je hier kunt zetten. */
  stap?: string
  /** Emotie waarmee de panda deze pagina "binnenkomt". */
  emotion: EmotionState
}

// Let op: langste prefix wint (zie getPageGuide). Daarom mogen overlappende
// routes zoals /stemming en /stemming-kalender allebei bestaan.
const GUIDES: Record<string, PageGuide> = {
  '/home': {
    label: 'Vandaag',
    uitleg: 'Je startpunt. Hier zie ik in één oogopslag hoe je ervoor staat en wijs ik je de volgende stap.',
    stap: 'Begin met je dagelijkse check-in of log je stemming.',
    emotion: 'calm',
  },
  '/checkin': {
    label: 'Wekelijkse check-in',
    uitleg: 'Je belangrijkste move van de week: 12 korte vragen. Daarna stel ik samen met jou je weekdoelen op.',
    stap: 'Doorloop de 12 vragen — duurt ~2 minuten. Levert de meeste XP op.',
    emotion: 'curious',
  },
  '/stemming-kalender': {
    label: 'Stemming kalender',
    uitleg: 'Je stemming van de afgelopen 90 dagen als kleurenkaart. Zo zie je in één blik je golfbeweging.',
    stap: 'Bekijk welke weken groen kleurden — wat deed je toen anders?',
    emotion: 'curious',
  },
  '/stemming': {
    label: 'Stemming',
    uitleg: 'In 5 seconden vastleggen hoe je je voelt. Elke log leert mij jouw ritme kennen.',
    stap: 'Tik je stemming en energie aan, klaar.',
    emotion: 'curious',
  },
  '/slaap': {
    label: 'Slaap',
    uitleg: 'Slaap is de basis onder alles — energie, focus, humeur. Log je nachten en ik laat je patronen zien.',
    stap: 'Log hoe lang en hoe goed je sliep.',
    emotion: 'calm',
  },
  '/stress': {
    label: 'Stress',
    uitleg: 'Stress meten is stress beheersen. Door het te volgen zien we wat jou opjaagt — en wat je rust geeft.',
    stap: 'Geef je stressniveau aan en, als je wilt, waar het vandaan komt.',
    emotion: 'supportive',
  },
  '/werkgeluk': {
    label: 'Werkgeluk',
    uitleg: 'Eén simpele score: hoe lekker zit je in je werk? Over tijd wordt de trend het echte verhaal.',
    stap: 'Schuif je werkgeluk-score van vandaag.',
    emotion: 'curious',
  },
  '/psych-veiligheid': {
    label: 'Psychologische veiligheid',
    uitleg: 'Durf je je uit te spreken in je team? Deze korte check meet hoe veilig dat voelt.',
    stap: 'Beantwoord de stellingen — eerlijk, het is van jou.',
    emotion: 'supportive',
  },
  '/inzichten': {
    label: 'Inzichten',
    uitleg: 'Hier vat ik je data samen tot iets bruikbaars: wat valt op, wat kun je ermee.',
    stap: 'Lees je belangrijkste inzicht van deze week.',
    emotion: 'focused',
  },
  '/patronen': {
    label: 'Mijn patronen',
    uitleg: 'De verbanden die ik in jouw data vind — bijvoorbeeld hoe je slaap je stemming kleurt.',
    stap: 'Bekijk je sterkste patroon en de tip erbij.',
    emotion: 'focused',
  },
  '/rapport': {
    label: 'Rapport',
    uitleg: 'Je vitaliteitsoverzicht per domein. Het complete plaatje, in één rustig overzicht.',
    stap: 'Scan je domeinscores — waar zit je laagste?',
    emotion: 'focused',
  },
  '/mijn-rapport': {
    label: 'Mijn rapport',
    uitleg: 'Je persoonlijke AI-rapport, klaar om te lezen of te downloaden.',
    stap: 'Bekijk je laatste rapport of exporteer het als PDF.',
    emotion: 'focused',
  },
  '/sport': {
    label: 'Sport',
    uitleg: 'Je trainingen en schema op één plek. Bewegen is een van de sterkste knoppen voor je welzijn.',
    stap: 'Start een training of laat mij een schema voor je maken.',
    emotion: 'motivated',
  },
  '/voeding': {
    label: 'Voeding',
    uitleg: 'Wat je eet stuurt je energie. Log je maaltijden — een foto is genoeg, ik reken de rest uit.',
    stap: 'Log je volgende maaltijd met een foto.',
    emotion: 'curious',
  },
  '/water': {
    label: 'Water',
    uitleg: 'Klein maar groot effect: genoeg drinken houdt je focus scherp. Ik tel met je mee.',
    stap: 'Tik aan wat je net gedronken hebt.',
    emotion: 'motivated',
  },
  '/gezondheid': {
    label: 'Gezondheid',
    uitleg: 'Je metingen — stappen, slaap, hartslag — bij elkaar. Koppel je wearable voor het volledige beeld.',
    stap: 'Bekijk je metingen of koppel een app via Koppelingen.',
    emotion: 'focused',
  },
  '/focus': {
    label: 'Focus',
    uitleg: 'Je toolkit voor een heldere kop: ademhaling, een focustimer, micro-pauzes en mentale resets.',
    stap: 'Kies een ademhaling of start een focustimer van 25 min.',
    emotion: 'focused',
  },
  '/coach': {
    label: 'AI Coach',
    uitleg: 'Je persoonlijke coach die jouw data kent. Stel een vraag, krijg een antwoord op maat.',
    stap: 'Vraag me iets — bijvoorbeeld "hoe verbeter ik mijn slaap?".',
    emotion: 'supportive',
  },
  '/doelen': {
    label: 'Doelen',
    uitleg: 'Je weekdoelen, gekozen op basis van je check-in. Klein en haalbaar — daar zit de winst.',
    stap: 'Vink af wat je vandaag gehaald hebt. Elke afvink = XP.',
    emotion: 'motivated',
  },
  '/journal': {
    label: 'Journal',
    uitleg: 'Je vrije ruimte om te schrijven. Even je hoofd legen helpt aantoonbaar tegen piekeren.',
    stap: 'Schrijf een paar regels over je dag.',
    emotion: 'calm',
  },
  '/meditatie': {
    label: 'Meditatie',
    uitleg: 'Een paar minuten stilte resetten je zenuwstelsel. Ik begeleid je rustig door de sessie.',
    stap: 'Kies een korte sessie en zet je oortjes in.',
    emotion: 'calm',
  },
  '/ademhaling': {
    label: 'Ademhaling',
    uitleg: 'De snelste knop voor rust: bewust ademen kalmeert je in minder dan een minuut.',
    stap: 'Volg één ronde box-breathing met me mee.',
    emotion: 'calm',
  },
  '/dankbaarheid': {
    label: 'Dankbaarheid',
    uitleg: 'Drie dingen benoemen die goed gingen verschuift je focus. Klein gebaar, echt effect.',
    stap: 'Noteer 3 dingen waar je vandaag dankbaar voor bent.',
    emotion: 'supportive',
  },
  '/reflectie': {
    label: 'Reflectie',
    uitleg: 'Je wekelijkse terugblik in 6 vragen. Even afstand nemen maakt de volgende week scherper.',
    stap: 'Beantwoord de reflectievragen van deze week.',
    emotion: 'curious',
  },
  '/groeiplan': {
    label: 'Groeiplan',
    uitleg: 'Je persoonlijke plan op de langere termijn: sterke punten, aandachtspunten en concrete acties.',
    stap: 'Bekijk je acties of laat mij een vers groeiplan maken.',
    emotion: 'motivated',
  },
  '/disc': {
    label: 'DISC',
    uitleg: 'Ontdek je werkstijl in 24 stellingen. Handig om jezelf én je team beter te begrijpen.',
    stap: 'Doe de test — daarna ken ik jouw stijl.',
    emotion: 'curious',
  },
  '/niveau': {
    label: 'Fit Level',
    uitleg: 'Je voortgang als game: verzamel XP, klim van Starter naar Legende, ontgrendel badges.',
    stap: 'Kijk hoeveel XP je nog nodig hebt voor het volgende level.',
    emotion: 'proud',
  },
  '/achievements': {
    label: 'Achievements',
    uitleg: 'Je behaalde badges en wat er nog te ontgrendelen valt. Elke mijlpaal telt.',
    stap: 'Bekijk welke badge het dichtstbij is.',
    emotion: 'proud',
  },
  '/voortgang': {
    label: 'Voortgang',
    uitleg: 'Je totaaloverzicht: streaks, logs en weektrends bij elkaar.',
    stap: 'Check je huidige streak — hou ’m in stand!',
    emotion: 'motivated',
  },
  '/chat': {
    label: 'Berichten',
    uitleg: 'Je teamchat. Even contact maakt het werk lichter — verbinding is ook welzijn.',
    stap: 'Stuur een collega een bericht.',
    emotion: 'supportive',
  },
  '/mijn-gesprekken': {
    label: 'Mijn gesprekken',
    uitleg: 'Je geplande en eerdere gesprekken met HR, overzichtelijk op een rij.',
    stap: 'Bekijk je aankomende gesprek.',
    emotion: 'focused',
  },
  '/koppelingen': {
    label: 'Koppelingen',
    uitleg: 'Verbind je wearable of gezondheidsapp, zodat je data vanzelf binnenkomt.',
    stap: 'Koppel Apple Health of Google Fit.',
    emotion: 'focused',
  },
  '/stappen': {
    label: 'Stappen',
    uitleg: 'Je dagelijkse stappen op één plek, met een weekgrafiek naast je doel. Bewegen is een van de sterkste knoppen voor je energie.',
    stap: 'Log je stappen of laat ze automatisch binnenkomen via een koppeling.',
    emotion: 'motivated',
  },
  '/burnout': {
    label: 'Burn-outcheck',
    uitleg: 'Een korte scan die peilt hoe uitgeput, cynisch en effectief je je voelt. Vroeg signaleren maakt het verschil.',
    stap: 'Doorloop de scan — eerlijk antwoorden levert het scherpste beeld.',
    emotion: 'supportive',
  },
  '/mentale-sterkte': {
    label: 'Mentale sterkte',
    uitleg: 'Een korte quiz die je mentale veerkracht in kaart brengt, met een uitleg per antwoord. Zo zie je waar je stevig staat en waar niet.',
    stap: 'Doe de quiz — daarna bespreek ik je uitkomst met je.',
    emotion: 'focused',
  },
  '/doelkeuze': {
    label: 'Doelen kiezen',
    uitleg: 'Op basis van je check-in kies je hier één klein weekdoel voor je aandachtsgebieden. Klein en haalbaar — daar zit de winst.',
    stap: 'Kies per gebied één doel dat je deze week wilt halen.',
    emotion: 'motivated',
  },
  '/prestaties': {
    label: 'Metingen',
    uitleg: 'Je lichaamsmetingen — gewicht, vetpercentage, energie — bij elkaar, met je voortgang richting je doel.',
    stap: 'Leg een nieuwe meting vast om je trend te volgen.',
    emotion: 'focused',
  },
  '/uitdagingen': {
    label: 'Uitdagingen',
    uitleg: 'Meerdaagse mini-uitdagingen die een gewoonte helpen opbouwen. Elke dag afvinken houdt je op koers.',
    stap: 'Start een uitdaging die bij je past en vink vandaag af.',
    emotion: 'motivated',
  },
  '/team-uitdagingen': {
    label: 'Team-uitdagingen',
    uitleg: 'Uitdagingen die je samen met je team aangaat. Samen bewegen houdt het licht en verbindend.',
    stap: 'Log je voortgang van vandaag voor het team.',
    emotion: 'motivated',
  },
  '/welzijn': {
    label: 'Welzijn',
    uitleg: 'Verzamelde artikelen en oefeningen rond je welzijn, om even in te verdiepen wanneer je wilt.',
    stap: 'Blader door de content en kies iets dat nu bij je past.',
    emotion: 'calm',
  },
  '/groeien': {
    label: 'Groeien',
    uitleg: 'Content en oefeningen gericht op persoonlijke groei — kleine stappen die optellen.',
    stap: 'Kies een onderwerp waar je mee aan de slag wilt.',
    emotion: 'motivated',
  },
  '/actief': {
    label: 'Actief',
    uitleg: 'Alles rond bewegen en actief blijven op één plek. Beweging voedt je energie en je humeur.',
    stap: 'Bekijk wat je vandaag in beweging kan brengen.',
    emotion: 'motivated',
  },
  '/nieuws': {
    label: 'Nieuws',
    uitleg: 'Aankondigingen en updates vanuit je organisatie, overzichtelijk bij elkaar.',
    stap: 'Lees het laatste bericht dat voor jou relevant is.',
    emotion: 'curious',
  },
  '/bestanden': {
    label: 'Bestanden',
    uitleg: 'Je persoonlijke documenten en gegenereerde rapporten, plus wat je met HR deelt. Jij houdt de regie.',
    stap: 'Upload een document of bekijk je laatste rapport.',
    emotion: 'focused',
  },
  '/protocollen': {
    label: 'Protocollen',
    uitleg: 'De gepubliceerde afspraken en procedures van je organisatie, te doorzoeken op onderwerp.',
    stap: 'Zoek het protocol dat je nodig hebt.',
    emotion: 'focused',
  },
  '/profiel': {
    label: 'Profiel',
    uitleg: 'Je persoonlijke gegevens en voorkeuren. Houd ze up-to-date, dan blijft mijn beeld van jou kloppen.',
    stap: 'Werk je gegevens of voorkeuren bij.',
    emotion: 'curious',
  },
  '/instellingen': {
    label: 'Instellingen',
    uitleg: 'Je account, privacy en voorkeuren. Jij bepaalt wat er met je data gebeurt.',
    stap: 'Stel je voorkeuren in of beheer je privacy.',
    emotion: 'calm',
  },
}

// Langste matchende prefix wint, zodat /stemming-kalender niet door /stemming
// wordt opgeslokt.
const SORTED_PREFIXES = Object.keys(GUIDES).sort((a, b) => b.length - a.length)

export function getPageGuide(pathname: string): PageGuide | null {
  for (const prefix of SORTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return GUIDES[prefix]
  }
  return null
}
