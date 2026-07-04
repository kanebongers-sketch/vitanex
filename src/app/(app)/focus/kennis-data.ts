// Statische kennisinhoud voor de tabs Beweging, Voeding, Slaap en Mentaal.
// Puur data — geen client-code.

export type Intensiteit = 'laag' | 'gemiddeld' | 'hoog'

export interface BureauOefening {
  naam: string
  afk: string
  duur: string
  stappen: string[]
  waarom: string
  intensiteit: Intensiteit
}

export const BUREAUOEFENINGEN: BureauOefening[] = [
  {
    naam: 'Nek- en schouderrol',
    afk: 'NS',
    duur: '2 min',
    stappen: [
      'Kantel je hoofd langzaam naar rechts, houd 10 sec vast',
      'Rol je kin naar je borst en naar links, houd 10 sec vast',
      'Rol je schouders 5x naar achteren, daarna 5x naar voren',
      'Knijp je schouderbladen 3x samen voor 5 seconden',
    ],
    waarom: 'Vermindert spanning door langdurig naar een scherm kijken.',
    intensiteit: 'laag',
  },
  {
    naam: 'Zittende rugstrek',
    afk: 'RG',
    duur: '2 min',
    stappen: [
      'Ga rechtop zitten op de rand van je stoel',
      'Kruis je rechterarm voor je lichaam en draai de romp naar rechts',
      'Houd 15 seconden vast, adem rustig door',
      'Herhaal links',
      'Stretch je armen boven je hoofd en rek 10 seconden',
    ],
    waarom: 'Verlicht rugpijn en verbetert de houding.',
    intensiteit: 'laag',
  },
  {
    naam: 'Standing desk reset',
    afk: 'SD',
    duur: '3 min',
    stappen: [
      'Sta op en doe 10 kuitraises (op je tenen gaan staan)',
      'Doe 10 squats (langzaam, houd 2 sec vast onderaan)',
      'Loop 1 minuut rustig door het kantoor of op de plek',
      'Doe 5 heupwippen per kant terwijl je staat',
    ],
    waarom: 'Verbetert bloedsomloop na lang zitten.',
    intensiteit: 'gemiddeld',
  },
  {
    naam: 'Pols & hand workout',
    afk: 'PH',
    duur: '2 min',
    stappen: [
      'Strek je rechterarm en buig je pols omhoog, houd 10 sec vast',
      'Buig je pols omlaag, houd 10 sec vast',
      'Maak vuisten, dan waaier je vingers zo wijd mogelijk uit (10x)',
      'Draai je polsen 5x per kant in cirkels',
    ],
    waarom: 'Voorkomt RSI en pijnlijke polsen bij toetsenbordgebruik.',
    intensiteit: 'laag',
  },
  {
    naam: 'Core activatie',
    afk: 'CA',
    duur: '3 min',
    stappen: [
      'Ga zitten met voeten plat op de grond',
      'Trek je navel in en span je buik aan voor 10 seconden (4x)',
      'Doe zittende knieheffers: til afwisselend je knie op (20x per been)',
      'Leun 45 graden achterover en houd 20 seconden een hollow-hold vast',
    ],
    waarom: 'Versterkt de buikspieren die je rug ondersteunen.',
    intensiteit: 'gemiddeld',
  },
  {
    naam: 'Oog & kaak ontspanning',
    afk: 'OG',
    duur: '2 min',
    stappen: [
      'Wrijf je handpalmen warm en leg ze 30 sec over je gesloten ogen (palming)',
      'Kijk 20 seconden naar een punt op 6 meter (20-20-20 regel)',
      'Beweeg je ogen langzaam in een grote cirkel (3x per kant)',
      'Laat je kaak los hangen, masseer je kaakspieren 30 seconden',
    ],
    waarom: 'Verlaagt oogvermoeidheid en kaakspanning door stress.',
    intensiteit: 'laag',
  },
  {
    naam: 'Snelle energieboost',
    afk: 'SE',
    duur: '4 min',
    stappen: [
      '20 jumping jacks (of arm-zwaai als je niet wilt springen)',
      '10 push-ups (of op de muur als dat makkelijker is)',
      '15 seconden snel ter plekke stappen',
      '10 tricep dips op je stoel',
      'Eindig met 5 diepe buikademhalingen',
    ],
    waarom: 'Verhoogt hartslag en alertheid bij een middagdip.',
    intensiteit: 'hoog',
  },
  {
    naam: 'Progressieve spierontspanning',
    afk: 'PS',
    duur: '5 min',
    stappen: [
      'Span je voeten aan voor 5 sec, laat los. Voel het verschil.',
      'Span je kuiten aan, houd 5 sec, laat los.',
      'Dijen en billen: span aan, houd 5 sec, laat los.',
      'Buik en borst: inademen, alles aanspannen, 5 sec, uitademen & loslaten.',
      'Handen en armen: vuisten, biceps aanspannen, 5 sec, loslaten.',
      'Schouders optrekken naar oren, 5 sec, dan helemaal loslaten.',
      'Gezichtsspieren samenknijpen, 5 sec, dan alles ontspannen.',
    ],
    waarom: 'Wetenschappelijk bewezen methode om spierspanning en angst te verlagen.',
    intensiteit: 'laag',
  },
]

export interface SchemaRij {
  tijd: string
  actie: string
}

export const BEWEGINGSSCHEMA: SchemaRij[] = [
  { tijd: '09:00', actie: 'Sta op, doe 10 squats voor je begint' },
  { tijd: '10:30', actie: 'Sta 10 min (of loop naar collega ipv mailen)' },
  { tijd: '12:00', actie: 'Loop 10 min buiten tijdens de lunch' },
  { tijd: '14:30', actie: 'Snelle energieboost (4 min desk workout)' },
  { tijd: '16:00', actie: 'Rek & strek: nek, schouders, polsen (2 min)' },
]

export interface KennisTip {
  titel: string
  tekst: string
}

export interface VoedingCategorie {
  titel: string
  afk: string
  kleur: string
  tips: KennisTip[]
}

export const VOEDING_CATEGORIEEN: VoedingCategorie[] = [
  {
    titel: 'Hydratatie',
    afk: 'H2O',
    kleur: 'var(--mf-blue)',
    tips: [
      { titel: 'Drink voor je dorst voelt', tekst: 'Zodra je dorstig bent, ben je al 1-2% uitgedroogd. Dit verlaagt je concentratie meetbaar. Houd een fles water op je bureau.' },
      { titel: 'Koffieregel: 1 op 1', tekst: 'Drink bij elke kop koffie ook een glas water. Koffie werkt licht vochtafdrijvend. Zo blijf je gehydrateerd zonder cafeinegehalte te verlagen.' },
      { titel: 'Groene thee als alternatief', tekst: 'Groene thee bevat L-theanine, wat samen met cafeïne zorgt voor rustige, gestage focus zonder de jittery bijwerking van koffie.' },
      { titel: 'Kokoswatershot bij stress', tekst: 'Kokoswater bevat elektrolyten die verloren gaan bij stress (zweten, gespannen spieren). Een kleine portie helpt bij aanhoudende spanning.' },
    ],
  },
  {
    titel: 'Focus eten',
    afk: 'F',
    kleur: 'var(--mf-green)',
    tips: [
      { titel: 'Blauwe bessen: het hersenfruit', tekst: 'Rijk aan antioxidanten (flavonoiden) die de bloedtoevoer naar de prefrontale cortex verhogen. Een handje voor je werk bevordert aandacht en werkgeheugen.' },
      { titel: 'Noten als snack', tekst: 'Walnoten bevatten omega-3 vetzuren die de verbinding tussen neuronen versterken. Amandelen geven langzame energie. Ideaal als bureausnack.' },
      { titel: 'Donkere chocolade (>70%)', tekst: 'Bevat theobromine en flavonoiden die de bloedstroom naar de hersenen verbeteren. Een stuk na de lunch vermindert de middagdip.' },
      { titel: 'Avocado bij de lunch', tekst: 'Monounsaturated vetten in avocado ondersteunen de myeline-laag om zenuwbanen. Dit verbetert de signaaloverdracht in de hersenen.' },
      { titel: 'Eieren als ontbijt', tekst: 'Choline in eidooiers is een bouwsteen voor acetylcholine, de neurotransmitter van leren en geheugen. Geassocieerd met betere cognitieve prestaties.' },
    ],
  },
  {
    titel: 'Energieniveaus',
    afk: 'E',
    kleur: 'var(--mf-amber)',
    tips: [
      { titel: 'Vermijd suikerpieken', tekst: 'Na een snelle suikerpiek (snoep, frisdrank) volgt een even snelle dip, met verminderde concentratie. Kies voor complexe koolhydraten zoals havermout of volkorenbrood.' },
      { titel: 'Eiwitrijk ontbijt', tekst: 'Eiwitten (eieren, kwark, noten) stabiliseren de bloedsuiker en zorgen voor een lang gevoel van verzadiging. Dit voorkomt de ochtend-concentratieproblemen.' },
      { titel: 'Cafeïnetiming is alles', tekst: 'Drink je eerste koffie pas 90 minuten na het opstaan. Dan is de cortisol-piek al voorbij. Koffie werkt dan veel effectiever en de crash is kleiner.' },
      { titel: 'Lunch: licht maar vullend', tekst: 'Een te zware lunch (koolhydraatrijke pasta, aardappels) activeert je spijsvertering maximaal, wat energie wegtrekt van je hersenen. Kies voor salade met proteinen.' },
      { titel: 'Magnesium tegen stress', tekst: 'Langdurige stress put magnesiumreserves uit. Magnesiumrijke voedingsmiddelen (pompoenpitten, spinazie, donkere chocolade) helpen de stressrespons te temperen.' },
    ],
  },
  {
    titel: 'Anti-stress voeding',
    afk: 'AS',
    kleur: 'var(--mf-purple)',
    tips: [
      { titel: 'Adaptogenen: Ashwagandha', tekst: 'Ashwagandha (in supplementvorm of thee) is een klinisch onderzochte adaptogeen die de cortisolaanmaak bij chronische stress significant verlaagt.' },
      { titel: 'Gefermenteerd voedsel', tekst: 'Yoghurt, kefir en zuurkool bevatten probiotica die de darm-hersenverbinding ondersteunen. Gut health is direct gekoppeld aan stressgevoeligheid en stemming.' },
      { titel: 'Omega-3 vetzuren', tekst: 'Vette vis (zalm, makreel) 2x per week verlaagt ontstekingswaarden die samengaan met burn-out en depressie. Visolie supplement als alternatief.' },
      { titel: 'Vermijd alcohol bij stress', tekst: 'Hoewel alcohol ontspanning geeft, verstoort het REM-slaap en verhoogt het de volgende dag de cortisolspiegel. Dit maakt stress chronisch.' },
    ],
  },
]

export interface DagritmeBlok {
  tijd: string
  kleur: string
  items: string[]
}

export const VOEDING_DAGRITME: DagritmeBlok[] = [
  { tijd: 'Ochtend', kleur: 'var(--mf-green)', items: ['Eiwitrijk ontbijt (eieren, kwark)', 'Eerste koffie na 90 min opstaan', '500ml water voor 10:00'] },
  { tijd: 'Middag', kleur: 'var(--mf-blue)', items: ['Lichte lunch (proteinen + groenten)', 'Noten of bessen als snack', 'Koffie stop om 14:00'] },
  { tijd: 'Avond', kleur: 'var(--mf-purple)', items: ['Magnesiumrijke groenten (spinazie)', 'Geen alcohol als je wil slapen', 'Chamomile of valeriaan thee'] },
]

export interface SlaapSectieData {
  titel: string
  afk: string
  kleur: string
  items: KennisTip[]
}

export const SLAAP_SECTIES: SlaapSectieData[] = [
  {
    titel: 'Slaaproutine opbouwen',
    afk: 'SR',
    kleur: 'var(--mf-purple)',
    items: [
      { titel: 'Vaste slaaptijden', tekst: 'Je lichaam heeft een interne klok (circadiaan ritme). Elke dag op dezelfde tijd naar bed gaan en opstaan, ook in het weekend, verbetert slaapkwaliteit dramatisch na 2-3 weken.' },
      { titel: 'Wind-down ritueel', tekst: 'Begin 60 minuten voor slaaptijd met dimmen: geen schermen, zachte verlichting, rustige activiteit (lezen, stretchen, warme douche). Dit activeert melatonineproductie.' },
      { titel: 'Slaapomgeving optimaliseren', tekst: 'De ideale slaapkamer is koel (16-18°C), volledig donker en stil. Investeer in verduisterende gordijnen en oordoppen als dat nodig is.' },
      { titel: 'Geen schermen 1 uur voor bed', tekst: 'Blauw licht van schermen onderdrukt melatonine met tot 50%. Gebruik nacht-modus of bluelight-bril als je het niet kunt vermijden.' },
    ],
  },
  {
    titel: 'Slaap en stress',
    afk: 'SS',
    kleur: 'var(--mf-blue)',
    items: [
      { titel: 'Schrijf zorgen van je af', tekst: 'Maak voor het slapen een "worry dump": schrijf alles op wat je bezighoudt. Dit ontlaadt je werkgeheugen en voorkomt piekeren in bed.' },
      { titel: 'Piekertijd overdag inplannen', tekst: 'Reserveer 15-20 minuten overdag specifiek om te piekeren. Als je in bed begint te piekeren, herinner jezelf: dat doe ik morgen tijdens mijn piekertijd.' },
      { titel: 'Diafragmatische ademhaling in bed', tekst: 'Buikademhaling activeert het parasympathische zenuwstelsel. Leg je hand op je buik, adem 4 tel in, 6 tel uit. Herhaal 5-10 minuten.' },
      { titel: 'Cognitieve shuffle', tekst: 'Een techniek van Dr. Luc Beaulieu: stel je willekeurige, niet-emotionele beelden voor (bijv. een anker, dan een banaan, dan een vuurwerk). Dit voorkomt het analytische denken dat wakker houdt.' },
    ],
  },
  {
    titel: 'Powernap wetenschap',
    afk: 'PN',
    kleur: 'var(--mf-green)',
    items: [
      { titel: 'De ideale nap: 10-20 minuten', tekst: 'Korte naps van 10-20 minuten verbeteren alertheid, stemming en cognitieve prestaties zonder de slaapkwaliteit \'s nachts te verstoren. NASA-onderzoek bevestigt dit.' },
      { titel: 'Koffiedutje truc', tekst: 'Drink een espresso net voor je dutje. Cafeïne werkt na 20-25 minuten: je wordt wakker precies als het cafeïne begint te werken. Extra alert op twee manieren tegelijk.' },
      { titel: 'Nooit nappen na 15:00', tekst: 'Naps na 15:00 verstoren je slaapdruk (adenosine) en maken het moeilijker om op tijd in slaap te vallen. Plan je nap in de vroege middag.' },
      { titel: 'Slaapschuld is cumulatief', tekst: 'Elke nacht een uur te kort slapen is na een week equivalent aan een nacht geen slaap. Een weekend "uitslapen" maakt maar een deel van de schade goed.' },
    ],
  },
  {
    titel: 'Melatonine & supplementen',
    afk: 'ML',
    kleur: 'var(--mf-amber)',
    items: [
      { titel: 'Melatonine: minder is meer', tekst: 'De effectieve dosis melatonine is 0.5-1 mg, niet de 5-10 mg die in de meeste supplementen zit. Lagere doses werken even goed met minder bijeffecten.' },
      { titel: 'Magnesium glycinaat voor slaap', tekst: 'Magnesium glycinaat (niet oxide) ontspant spieren en zenuwstelsel. 200-400 mg 30 min voor bed helpt bij in- en doorslapen.' },
      { titel: 'L-theanine bij piekeren', tekst: 'L-theanine (aminozuur uit groene thee) verhoogt GABA en bevordert ontspanning zonder slaperigheid. Goed bij mentale onrust voor het slapen.' },
      { titel: 'Geen alcohol als slaaphulp', tekst: 'Alcohol verstoort de REM-slaapfase disproportioneel. Je valt sneller in slaap maar wakker vaker op en de slaap is minder herstellend.' },
    ],
  },
]

export interface SlaapFeit {
  label: string
  waarde: string
  kleur: string
}

export const SLAAP_FEITEN: SlaapFeit[] = [
  { label: 'Ideale slaapduur', waarde: '7-9u', kleur: 'var(--mf-purple)' },
  { label: 'Ideale nap', waarde: '10-20m', kleur: 'var(--mf-green)' },
  { label: 'Geen schermen', waarde: '60m voor bed', kleur: 'var(--mf-blue)' },
]

export interface WinddownStap {
  tijd: string
  kleur: string
  actie: string
}

export const WINDDOWN_ROUTINE: WinddownStap[] = [
  { tijd: 'T-60 min', kleur: 'var(--mf-purple)', actie: 'Schermen weg of blauwlichtfilter aan' },
  { tijd: 'T-45 min', kleur: 'var(--mf-purple)', actie: 'Warme douche of bad (kerntemperatuur daalt daarna)' },
  { tijd: 'T-30 min', kleur: 'var(--mf-blue)', actie: 'Schrijf morgenlijst + worry dump' },
  { tijd: 'T-20 min', kleur: 'var(--mf-blue)', actie: 'Lees boek (geen tablet) of doe lichte stretch' },
  { tijd: 'T-10 min', kleur: 'var(--mf-green)', actie: 'Verduister de kamer, stel temperatuur in op 17-18°C' },
  { tijd: 'In bed', kleur: 'var(--mf-green)', actie: 'Diafragmatische ademhaling of 4-7-8 methode' },
]

export interface MentaalTechniek {
  naam: string
  afk: string
  duur: string
  kleur: string
  beschrijving: string
  stappen: string[]
}

export const MENTAAL_TECHNIEKEN: MentaalTechniek[] = [
  {
    naam: '5-4-3-2-1 grounding',
    afk: 'GR',
    duur: '2 min',
    kleur: 'var(--mf-green)',
    beschrijving: 'Een evidence-based techniek tegen angst en overweldigend gevoel.',
    stappen: [
      '5 dingen die je KAN ZIEN — benoem ze in je hoofd',
      '4 dingen die je KAN AANRAKEN — voel ze even aan',
      '3 dingen die je KAN HOREN — luister actief',
      '2 dingen die je KAN RUIKEN — ook fantasie telt',
      '1 ding dat je KAN PROEVEN — neem een slokje water',
    ],
  },
  {
    naam: 'Mentale ontluchting',
    afk: 'MO',
    duur: '5 min',
    kleur: 'var(--mf-blue)',
    beschrijving: 'Schrijf alles uit je hoofd. Geen oordeel, geen structuur.',
    stappen: [
      'Pak een leeg blad of open een leeg document',
      'Stel een timer op 5 minuten',
      'Schrijf alles op wat in je hoofd zit — geen censuur',
      'Schrijf ook fysieke gevoelens op: spanning, vermoeidheid',
      'Als de timer afgaat, sluit je het document. Gaan.',
    ],
  },
  {
    naam: 'Cognitieve herstructurering',
    afk: 'CH',
    duur: '5 min',
    kleur: 'var(--mf-purple)',
    beschrijving: 'Stel de gedachte die je stress geeft in vraag.',
    stappen: [
      'Identificeer de stressvolle gedachte: "Ik ga dit niet afkrijgen."',
      'Vraag: Is dit 100% zeker waar?',
      'Vraag: Wat zijn bewijzen voor EN tegen deze gedachte?',
      'Vraag: Wat zou je zeggen tegen een vriend in deze situatie?',
      'Formuleer een realistischere gedachte: "Ik doe wat ik kan."',
    ],
  },
  {
    naam: 'Bodyscan meditatie',
    afk: 'BS',
    duur: '8 min',
    kleur: 'var(--mf-amber)',
    beschrijving: 'Scan je lichaam van voeten tot hoofd en laat spanning los.',
    stappen: [
      'Sluit je ogen en adem 3x diep in en uit',
      'Richt je aandacht op je voeten — voel het contact met de grond',
      'Beweeg langzaam omhoog: kuiten, dijen, heupen',
      'Buik, borst — voel je ademhaling van binnenuit',
      'Rug, schouders — laat bewust los bij elke uitademing',
      'Nek, kaak, gezicht — ontspan elk spiergroepje',
      'Observeer je hele lichaam als een geheel. Adem nog 3x.',
    ],
  },
  {
    naam: 'Dankbaarheidsscan',
    afk: 'DK',
    duur: '3 min',
    kleur: 'var(--mf-green)',
    beschrijving: 'Wetenschappelijk bewezen: dankbaarheid verhoogt dopamine en verlaagt cortisol.',
    stappen: [
      'Denk aan 3 specifieke dingen die goed gingen vandaag',
      'Geen grote zaken: "koffie was lekker" telt',
      'Schrijf elk punt op — schrijven versterkt het effect',
      'Noteer bij elk punt: waarom ben je hier dankbaar voor?',
      'Sluit af met: "Dit is wat vandaag goed was."',
    ],
  },
  {
    naam: 'Snelle stresscheck',
    afk: 'SC',
    duur: '1 min',
    kleur: 'var(--mf-red)',
    beschrijving: 'Beoordeel je stressniveau eerlijk en plan een actie.',
    stappen: [
      'Geef je stressniveau een cijfer van 1-10',
      'Localiseer de spanning in je lichaam — waar voel je het?',
      'Noem 1 ding dat je stress geeft',
      'Vraag: kan ik dit NU oplossen of niet?',
      'Als ja: plan de eerste kleine stap. Als nee: laat het bewust los.',
    ],
  },
]

export const STRESS_SIGNALEN: string[] = [
  'Kortaf reageren op collega\'s',
  'Kaken op elkaar zetten',
  'Moeite om te focussen',
  'Ondiep ademen',
  'Leeg gevoel, geen motivatie',
  'Kleine dingen groot maken',
  'Vermoeid maar niet kunnen slapen',
  'Constant scherm scrollen',
]
