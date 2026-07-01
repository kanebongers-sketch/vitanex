'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Play, Square, CheckCircle2, Target, Timer as TimerIcon, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { useToast } from '@/components/ui/Toast'
import { vitaEvent } from '@/lib/vita/events'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { CollapsibleRoot, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/Collapsible'

type HoofdTab = 'adem' | 'beweging' | 'voeding' | 'slaap' | 'mentaal' | 'timer'
type AdemTab = 'box' | '478' | 'coherentie' | 'wim'
type TimerTab = 'focus' | 'pauze' | 'micro'

// --- Breathing data ----------------------------------------------------------
const ADEM: Record<AdemTab, {
  naam: string
  beschrijving: string
  fases: { label: string; duur: number; kleur: string }[]
  voordelen: string[]
}> = {
  box: {
    naam: 'Box breathing',
    beschrijving: 'Gebruikt door Navy SEALs en topsporters om stress snel te verlagen en focus te herwinnen.',
    voordelen: ['Verlaagt cortisol', 'Verbetert concentratie', 'Kalmeert het zenuwstelsel'],
    fases: [
      { label: 'Inademen',  duur: 4, kleur: 'var(--mf-green)' },
      { label: 'Vasthouden', duur: 4, kleur: 'var(--mf-blue)' },
      { label: 'Uitademen', duur: 4, kleur: 'var(--mf-purple)' },
      { label: 'Vasthouden', duur: 4, kleur: 'var(--mf-amber)' },
    ],
  },
  '478': {
    naam: '4-7-8 methode',
    beschrijving: 'Ontwikkeld door Dr. Andrew Weil. Kalmeert het autonome zenuwstelsel en helpt bij angst en inslapen.',
    voordelen: ['Vermindert angst', 'Helpt bij inslapen', 'Verlaagt hartslag'],
    fases: [
      { label: 'Inademen',  duur: 4, kleur: 'var(--mf-green)' },
      { label: 'Vasthouden', duur: 7, kleur: 'var(--mf-blue)' },
      { label: 'Uitademen', duur: 8, kleur: 'var(--mf-purple)' },
    ],
  },
  coherentie: {
    naam: 'Hartcoherentie',
    beschrijving: 'Synchroniseert de ademhaling met het hart. 5-5 ritme activeert de herstelrespons.',
    voordelen: ['Balanceert hart & geest', 'Verlaagt bloeddruk', 'Verbetert emotieregulatie'],
    fases: [
      { label: 'Inademen',  duur: 5, kleur: 'var(--mf-green)' },
      { label: 'Uitademen', duur: 5, kleur: 'var(--mf-purple)' },
    ],
  },
  wim: {
    naam: 'Fysiologische snik',
    beschrijving: 'Dubbele inademing door de neus gevolgd door een lange uitademing. Stamt uit neurowetenschappelijk onderzoek van Stanford.',
    voordelen: ['Snelste stressverlichting', 'Activeert parasympathisch stelsel', 'Werkt binnen 1 minuut'],
    fases: [
      { label: 'In (neus)',      duur: 2, kleur: 'var(--mf-green)' },
      { label: 'Extra in (neus)', duur: 1, kleur: 'var(--mf-blue)' },
      { label: 'Lang uitademen', duur: 8, kleur: 'var(--mf-purple)' },
    ],
  },
}

// --- Timer data ---------------------------------------------------------------
const TIMERS: Record<TimerTab, { naam: string; duur: number; kleur: string; afk: string; tip: string }> = {
  focus: { naam: 'Diepe focus', duur: 25 * 60, kleur: 'var(--mf-green)', afk: '25',  tip: 'Leg je telefoon weg, sluit onnodige tabs en zet notificaties op stil.' },
  pauze: { naam: 'Pauze',       duur: 5 * 60,  kleur: 'var(--mf-blue)', afk: '5',   tip: 'Sta op, rek je uit, kijk even naar buiten. Geen scherm.' },
  micro: { naam: 'Micro-break', duur: 90,       kleur: 'var(--mf-purple)', afk: '90s', tip: 'Sluit je ogen. Adem 3x diep in. Ontspan je kaken en schouders.' },
}

// --- Movement data ------------------------------------------------------------
const BUREAUOEFENINGEN = [
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

// --- Nutrition data -----------------------------------------------------------
const VOEDING_CATEGORIEEN = [
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

// --- Sleep data ---------------------------------------------------------------
const SLAAP_SECTIES = [
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

// --- Mental reset data --------------------------------------------------------
const MENTAAL_TECHNIEKEN = [
  {
    naam: '5-4-3-2-1 grounding',
    afk: 'GR',
    duur: '2 min',
    kleur: 'var(--mf-green)',
    beschrijving: 'Een evidence-based techniek tegen angst en overweldigend gevoel.',
    stappen: [
      '5 dingen die je KAN ZIEN  benoem ze in je hoofd',
      '4 dingen die je KAN AANRAKEN  voel ze even aan',
      '3 dingen die je KAN HOREN  luister actief',
      '2 dingen die je KAN RUIKEN  ook fantasie telt',
      '1 ding dat je KAN PROEVEN  neem een slokje water',
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
      'Schrijf alles op wat in je hoofd zit  geen censuur',
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
      'Richt je aandacht op je voeten  voel het contact met de grond',
      'Beweeg langzaam omhoog: kuiten, dijen, heupen',
      'Buik, borst  voel je ademhaling van binnenuit',
      'Rug, schouders  laat bewust los bij elke uitademing',
      'Nek, kaak, gezicht  ontspan elk spiergroepje',
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
      'Schrijf elk punt op  schrijven versterkt het effect',
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
      'Localiseer de spanning in je lichaam  waar voel je het?',
      'Noem 1 ding dat je stress geeft',
      'Vraag: kan ik dit NU oplossen of niet?',
      'Als ja: plan de eerste kleine stap. Als nee: laat het bewust los.',
    ],
  },
]

function formatTijd(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

type IntensiteitBadge = 'laag' | 'gemiddeld' | 'hoog'

function IntensiteitLabel({ niveau }: { niveau: IntensiteitBadge }) {
  const map = {
    laag: { label: 'Laag', bg: 'var(--mf-green-light)', kleur: 'var(--mf-green-dark)' },
    gemiddeld: { label: 'Gemiddeld', bg: 'var(--mf-amber-light)', kleur: 'var(--mf-amber-dark)' },
    hoog: { label: 'Hoog', bg: 'var(--mf-red-light)', kleur: 'var(--mf-red)' },
  }
  const c = map[niveau]
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.kleur }}>
      {c.label}
    </span>
  )
}

export default function FocusPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [klaar, setKlaar] = useState(false)
  const [tab, setTab] = useState<HoofdTab>('adem')
  const [focusMinutenVandaag, setFocusMinutenVandaag] = useState(0)
  const [focusSessiesVandaag, setFocusSessiesVandaag] = useState(0)

  // -- Breathing state ------------------------------------------------------
  const [ademTab, setAdemTab] = useState<AdemTab>('box')
  const [ademActief, setAdemActief] = useState(false)
  const [ademFaseIdx, setAdemFaseIdx] = useState(0)
  const [ademTeller, setAdemTeller] = useState(0)
  const [ademRonden, setAdemRonden] = useState(0)
  const ademRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // -- Timer state ----------------------------------------------------------
  const [timerTab, setTimerTab] = useState<TimerTab>('focus')
  const [timerActief, setTimerActief] = useState(false)
  const [timerRest, setTimerRest] = useState(TIMERS.focus.duur)
  const [timerKlaar, setTimerKlaar] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // -- Movement state -------------------------------------------------------
  const [openOefening, setOpenOefening] = useState<number | null>(null)

  // -- Mental state ---------------------------------------------------------
  const [openTechniek, setOpenTechniek] = useState<number | null>(null)

  // -- Voeding state --------------------------------------------------------
  const [openVoedingCat, setOpenVoedingCat] = useState<number | null>(0)

  // -- Slaap state ----------------------------------------------------------
  const [openSlaapSectie, setOpenSlaapSectie] = useState<number | null>(0)

  useEffect(() => {
    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const vandaagStr = new Date().toISOString().split('T')[0]
        const { data: logs } = await supabase
          .from('focus_timer_logs')
          .select('duur_minuten')
          .eq('user_id', user.id)
          .eq('datum', vandaagStr)

        if (logs) {
          setFocusSessiesVandaag(logs.length)
          setFocusMinutenVandaag(logs.reduce((acc, l) => acc + (l.duur_minuten ?? 0), 0))
        }
      } catch {
        toast({ title: 'Kon je focus-statistieken niet laden', description: 'Probeer het later opnieuw.', variant: 'warning' })
      } finally {
        setKlaar(true)
      }
    }
    check()
  }, [router, toast])

  // -- Breathing engine ------------------------------------------------------
  useEffect(() => {
    if (!ademActief) {
      if (ademRef.current) clearInterval(ademRef.current)
      return
    }
    const fases = ADEM[ademTab].fases

    let faseIdx = 0
    let teller = fases[0].duur

    ademRef.current = setInterval(() => {
      teller--
      setAdemTeller(teller)
      if (teller <= 0) {
        faseIdx = (faseIdx + 1) % fases.length
        teller = fases[faseIdx].duur
        setAdemFaseIdx(faseIdx)
        setAdemTeller(teller)
        if (faseIdx === 0) setAdemRonden(r => r + 1)
      }
    }, 1000)

    return () => { if (ademRef.current) clearInterval(ademRef.current) }
  }, [ademActief, ademTab])

  // -- Timer engine -----------------------------------------------------------
  useEffect(() => {
    if (!timerActief) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setTimerRest(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setTimerActief(false)
          setTimerKlaar(true)

          // Log voltooide sessie (niet-blokkerend)
          vitaEvent('habit_completed', { kind: 'focus' })
          const duur = Math.round(TIMERS[timerTab as TimerTab]?.duur / 60) || 25
          const apiType = timerTab === 'focus' ? 'deep_work' : timerTab === 'pauze' ? 'pauze' : 'pomodoro'
          authFetch('/api/focus/log', {
            method: 'POST',
            body: JSON.stringify({ duur_minuten: duur, type: apiType }),
          }).catch(() => {
            toast({ title: 'Sessie niet opgeslagen', description: 'Je focusblok telt nog steeds — we konden hem alleen niet vastleggen.', variant: 'warning' })
          })

          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerActief])

  function startAdem() {
    setAdemFaseIdx(0)
    setAdemTeller(ADEM[ademTab].fases[0].duur)
    setAdemActief(true)
  }

  function stopAdem() {
    setAdemActief(false)
    setAdemFaseIdx(0)
    setAdemTeller(0)
    setAdemRonden(0)
  }

  function wisselTimerTab(t: TimerTab) {
    setTimerTab(t)
    setTimerActief(false)
    setTimerKlaar(false)
    setTimerRest(TIMERS[t].duur)
  }

  const huidigeFase = ADEM[ademTab].fases[ademFaseIdx]
  const timerConfig = TIMERS[timerTab]
  const timerVoortgang = 1 - timerRest / timerConfig.duur

  const maxR = 80
  const minR = 45
  const pulsR = huidigeFase?.label === 'Uitademen' || huidigeFase?.label === 'Vasthouden'
    ? maxR - ((maxR - minR) * (1 - ademTeller / (huidigeFase?.duur ?? 1)))
    : minR + ((maxR - minR) * (1 - ademTeller / (huidigeFase?.duur ?? 1)))

  const TABS: { id: HoofdTab; label: string }[] = [
    { id: 'adem', label: 'Ademhaling' },
    { id: 'beweging', label: 'Beweging' },
    { id: 'voeding', label: 'Voeding' },
    { id: 'slaap', label: 'Slaap' },
    { id: 'mentaal', label: 'Mentaal' },
    { id: 'timer', label: 'Timer' },
  ]

  if (!klaar) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
    </div>
  )

  return (
    <div className="min-h-screen mf-mesh-bg" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="p-6 pb-20">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Focus & Welzijn</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Ademhaling, beweging, voeding, slaap en mentale reset.</p>
        </div>

        {/* Vandaag strip */}
        {(focusMinutenVandaag > 0 || focusSessiesVandaag > 0) && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20,
          }}>
            {[
              { Icon: Target, waarde: `${focusMinutenVandaag}`, sub: 'min focus', kleur: focusMinutenVandaag >= 50 ? 'var(--mf-green)' : focusMinutenVandaag >= 25 ? 'var(--mf-amber)' : 'var(--text-3)' },
              { Icon: TimerIcon, waarde: `${focusSessiesVandaag}`, sub: focusSessiesVandaag === 1 ? 'sessie' : 'sessies', kleur: focusSessiesVandaag >= 4 ? 'var(--mf-green)' : 'var(--text-3)' },
              { Icon: Flame, waarde: focusMinutenVandaag >= 100 ? 'Top!' : focusMinutenVandaag >= 50 ? 'Goed' : 'Bezig', sub: 'vandaag', kleur: focusMinutenVandaag >= 100 ? 'var(--mf-green)' : focusMinutenVandaag >= 50 ? 'var(--mf-amber)' : 'var(--text-3)' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '12px 10px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: m.kleur }}><m.Icon size={18} aria-hidden /></div>
                <div style={{ fontSize: 15, fontWeight: 800, color: m.kleur, lineHeight: 1 }}>{m.waarde}</div>
                <div style={{ fontSize: 9, color: 'var(--text-4)', marginTop: 2, fontWeight: 600 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab bar  scrollable on mobile */}
        <TabsRoot value={tab} onValueChange={(v) => setTab(v as HoofdTab)}>
        <div className="overflow-x-auto pb-1 mb-6">
          <TabsList
            aria-label="Welzijnscategorieën"
            className="mf-focus-tabs"
            style={{
              display: 'flex', gap: 6, minWidth: 'max-content',
              background: 'var(--bg-subtle)', borderRadius: 16, padding: 6, border: 'none',
            }}
          >
            {TABS.map(t => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="mf-focus-tab"
                style={{
                  padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                  whiteSpace: 'nowrap', color: 'var(--text-3)',
                }}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <style>{`
            .mf-focus-tabs .mf-focus-tab[data-state='active'] {
              background: var(--bg-card);
              color: var(--text-1);
              box-shadow: var(--shadow-xs);
            }
            .mf-focus-tabs .mf-focus-tab .mf-tabs-indicator { display: none; }
            .mf-collapsible-card { background: var(--bg-card); border-color: var(--border); }
            .mf-acc-trigger { background: transparent; cursor: pointer; appearance: none; border: none; }
            .mf-acc-trigger:hover { background: var(--bg-subtle); }
            .mf-divider-row { border-bottom: 1px solid var(--border); }
            .mf-divider-row:last-child { border-bottom: 0; }
            .mf-reset-btn:hover { background: var(--bg-subtle); }
          `}</style>
        </div>

        {/* -------------- ADEMHALING -------------- */}
        <TabsContent value="adem" style={{ paddingTop: 0 }}>
          <>
            <div className="rounded-2xl border p-5 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Kies techniek</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(Object.keys(ADEM) as AdemTab[]).map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { if (!ademActief) setAdemTab(k) }}
                    disabled={ademActief}
                    aria-pressed={ademTab === k}
                    aria-label={`Kies ${ADEM[k].naam}`}
                    className="mf-pressable py-2.5 px-3 rounded-xl text-xs font-medium border transition text-left"
                    style={{
                      background: ademTab === k ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
                      borderColor: ademTab === k ? 'var(--mentaforce-primary)' : 'var(--border)',
                      color: ademTab === k ? 'var(--mentaforce-primary)' : 'var(--text-3)',
                      opacity: ademActief && ademTab !== k ? 0.4 : 1,
                    }}
                  >
                    <span className="font-semibold block">{ADEM[k].naam}</span>
                    <span className="opacity-70">{ADEM[k].fases.map(f => f.duur).join('-')}s</span>
                  </button>
                ))}
              </div>

              {!ademActief && (
                <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-subtle)' }}>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>{ADEM[ademTab].beschrijving}</p>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {ADEM[ademTab].fases.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: `color-mix(in srgb, ${f.kleur} 12%, transparent)`, color: f.kleur }}>
                        <span className="font-bold">{f.duur}s</span>
                        <span>{f.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-4)' }}>Voordelen</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ADEM[ademTab].voordelen.map(v => (
                      <span key={v} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' }}>
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ademActief && huidigeFase && (
                <div className="flex flex-col items-center py-4">
                  <div
                    role="img"
                    aria-label={`${huidigeFase.label}, nog ${ademTeller} seconden`}
                    style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, ${huidigeFase.kleur} 18%, transparent) 0%, transparent 70%)` }} />
                    <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden focusable="false" style={{ position: 'relative', zIndex: 1 }}>
                      <circle cx="100" cy="100" r={pulsR + 12} fill={huidigeFase.kleur} opacity="0.07" />
                      <circle
                        cx="100" cy="100" r={pulsR}
                        fill={huidigeFase.kleur}
                        opacity="0.88"
                        style={{ transition: 'r 0.9s ease-in-out' }}
                      />
                      <text x="100" y="94" textAnchor="middle" fill="var(--bg-app)" fontSize="13" fontWeight="600">
                        {huidigeFase.label}
                      </text>
                      <text x="100" y="118" textAnchor="middle" fill="var(--bg-app)" fontSize="28" fontWeight="800">
                        {ademTeller}
                      </text>
                    </svg>
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }} aria-live="polite">
                    {ademRonden} ronde{ademRonden !== 1 ? 'n' : ''} voltooid
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => ademActief ? stopAdem() : startAdem()}
                aria-label={ademActief ? 'Ademhaling stoppen' : 'Ademhaling starten'}
                className="mf-pressable w-full py-3.5 rounded-xl font-semibold text-sm transition"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: ademActief ? 'var(--mf-red)' : 'var(--mentaforce-primary)', color: 'var(--bg-app)' }}
              >
                {ademActief
                  ? (<><Square size={14} aria-hidden /><span>Stop</span></>)
                  : (<><Play size={14} aria-hidden /><span>Start ademhaling</span></>)}
              </button>
            </div>

            <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Wanneer gebruik je wat?</p>
              {[
                { when: 'Acuut gestrest of overprikkeld', use: 'Fysiologische snik', reden: 'Snelste resultaat, werkt in 1-2 ademhalingen' },
                { when: 'Aankomende presentatie of gesprek', use: 'Box breathing', reden: '5 minuten voor een stressvolle situatie' },
                { when: 'Niet kunnen slapen', use: '4-7-8 methode', reden: '3-4 rondes ontspant het parasympathisch stelsel' },
                { when: 'Mentale vermoeidheid overdag', use: 'Hartcoherentie', reden: 'Herstelt energiebalans bij langdurige stress' },
              ].map(r => (
                <div key={r.when} className="mf-divider-row flex gap-3 py-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--mentaforce-primary)' }} />
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: 'var(--text-4)' }}>{r.when}</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{r.use}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{r.reden}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        </TabsContent>

        {/* -------------- BEWEGING -------------- */}
        <TabsContent value="beweging" style={{ paddingTop: 0 }}>
          <>
            <div className="rounded-2xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                Elke 50-90 minuten even bewegen <strong>kan helpen je focus te verbeteren</strong> en rugklachten te verlichten.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { niveau: 'laag', kleur: 'var(--mf-green-dark)', bg: 'var(--mf-green-light)' },
                { niveau: 'gemiddeld', kleur: 'var(--mf-amber-dark)', bg: 'var(--mf-amber-light)' },
                { niveau: 'hoog', kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)' },
              ].map(({ niveau, kleur, bg }) => {
                const count = BUREAUOEFENINGEN.filter(o => o.intensiteit === niveau).length
                return (
                  <span key={niveau} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: bg, color: kleur }}>
                    {niveau.charAt(0).toUpperCase() + niveau.slice(1)} ({count})
                  </span>
                )
              })}
            </div>

            <div className="space-y-3">
              {BUREAUOEFENINGEN.map((oe, idx) => {
                const open = openOefening === idx
                return (
                <CollapsibleRoot key={idx} open={open} onOpenChange={(o) => setOpenOefening(o ? idx : null)} className="rounded-2xl border overflow-hidden mf-collapsible-card">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="mf-acc-trigger w-full px-5 py-4 flex items-center gap-4 text-left transition"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)' }}>{(oe as {afk: string}).afk}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{oe.naam}</p>
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>{oe.duur} · {oe.stappen.length} stappen</p>
                      </div>
                      <IntensiteitLabel niveau={oe.intensiteit as IntensiteitBadge} />
                      <span className="ml-1" style={{ color: 'var(--text-3)' }}>{open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}</span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="text-xs italic mt-3 mb-3" style={{ color: 'var(--text-3)' }}>{oe.waarom}</p>
                      <ol className="space-y-2">
                        {oe.stappen.map((s, i) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                              style={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)' }}>
                              {i + 1}
                            </span>
                            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{s}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CollapsibleContent>
                </CollapsibleRoot>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Snel bewegingsschema</p>
              {[
                { tijd: '09:00', actie: 'Sta op, doe 10 squats voor je begint' },
                { tijd: '10:30', actie: 'Sta 10 min (of loop naar collega ipv mailen)' },
                { tijd: '12:00', actie: 'Loop 10 min buiten tijdens de lunch' },
                { tijd: '14:30', actie: 'Snelle energieboost (4 min desk workout)' },
                { tijd: '16:00', actie: 'Rek & strek: nek, schouders, polsen (2 min)' },
              ].map(r => (
                <div key={r.tijd} className="mf-divider-row flex gap-3 items-center py-2">
                  <span className="text-xs font-bold w-12 flex-shrink-0" style={{ color: 'var(--text-4)' }}>{r.tijd}</span>
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>{r.actie}</p>
                </div>
              ))}
            </div>
          </>
        </TabsContent>

        {/* -------------- VOEDING -------------- */}
        <TabsContent value="voeding" style={{ paddingTop: 0 }}>
          <>
            <div className="rounded-2xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                Voeding kan invloed hebben op cortisol, serotonine en dopamine  de stofjes die meespelen bij je stress en energie.
              </p>
            </div>

            <div className="space-y-3">
              {VOEDING_CATEGORIEEN.map((cat, idx) => {
                const open = openVoedingCat === idx
                return (
                <CollapsibleRoot key={idx} open={open} onOpenChange={(o) => setOpenVoedingCat(o ? idx : null)} className="rounded-2xl border overflow-hidden mf-collapsible-card">
                  <CollapsibleTrigger asChild>
                    <button type="button" className="mf-acc-trigger w-full px-5 py-4 flex items-center gap-4 text-left transition">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `color-mix(in srgb, ${cat.kleur} 12%, transparent)`, color: cat.kleur }}>{(cat as {afk: string}).afk}</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{cat.titel}</p>
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>{cat.tips.length} tips</p>
                      </div>
                      <span className="ml-1" style={{ color: 'var(--text-3)' }}>{open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}</span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      {cat.tips.map((tip, ti) => (
                        <div key={ti} className="mf-divider-row px-5 py-4">
                          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{tip.titel}</p>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{tip.tekst}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </CollapsibleRoot>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Ideale werkdag qua eten</p>
              {[
                { tijd: 'Ochtend', kleur: 'var(--mf-green)', items: ['Eiwitrijk ontbijt (eieren, kwark)', 'Eerste koffie na 90 min opstaan', '500ml water voor 10:00'] },
                { tijd: 'Middag', kleur: 'var(--mf-blue)', items: ['Lichte lunch (proteinen + groenten)', 'Noten of bessen als snack', 'Koffie stop om 14:00'] },
                { tijd: 'Avond', kleur: 'var(--mf-purple)', items: ['Magnesiumrijke groenten (spinazie)', 'Geen alcohol als je wil slapen', 'Chamomile of valeriaan thee'] },
              ].map(b => (
                <div key={b.tijd} className="mb-4 last:mb-0">
                  <p className="text-xs font-bold mb-2" style={{ color: b.kleur }}>{b.tijd}</p>
                  {b.items.map(i => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: b.kleur }} />
                      <p className="text-sm" style={{ color: 'var(--text-2)' }}>{i}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        </TabsContent>

        {/* -------------- SLAAP -------------- */}
        <TabsContent value="slaap" style={{ paddingTop: 0 }}>
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Ideale slaapduur', waarde: '79u', kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)' },
                { label: 'Ideale nap', waarde: '1020m', kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)' },
                { label: 'Geen schermen', waarde: '60m voor bed', kleur: 'var(--mf-blue)', bg: 'var(--mf-blue-light)' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <p className="text-sm font-bold mb-0.5" style={{ color: s.kleur }}>{s.waarde}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {SLAAP_SECTIES.map((sec, idx) => {
                const open = openSlaapSectie === idx
                return (
                <CollapsibleRoot key={idx} open={open} onOpenChange={(o) => setOpenSlaapSectie(o ? idx : null)} className="rounded-2xl border overflow-hidden mf-collapsible-card">
                  <CollapsibleTrigger asChild>
                    <button type="button" className="mf-acc-trigger w-full px-5 py-4 flex items-center gap-4 text-left transition">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `color-mix(in srgb, ${sec.kleur} 12%, transparent)`, color: sec.kleur }}>{(sec as {afk: string}).afk}</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{sec.titel}</p>
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>{sec.items.length} tips</p>
                      </div>
                      <span className="ml-1" style={{ color: 'var(--text-3)' }}>{open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}</span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      {sec.items.map((item, ii) => (
                        <div key={ii} className="mf-divider-row px-5 py-4">
                          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{item.titel}</p>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{item.tekst}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </CollapsibleRoot>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Slaap-wind-down routine</p>
              {[
                { tijd: 'T-60 min', kleur: 'var(--mf-purple)', actie: 'Schermen weg of blauwlichtfilter aan' },
                { tijd: 'T-45 min', kleur: 'var(--mf-purple)', actie: 'Warme douche of bad (kerntemperatuur daalt daarna)' },
                { tijd: 'T-30 min', kleur: 'var(--mf-blue)', actie: 'Schrijf morgenlijst + worry dump' },
                { tijd: 'T-20 min', kleur: 'var(--mf-blue)', actie: 'Lees boek (geen tablet) of doe lichte stretch' },
                { tijd: 'T-10 min', kleur: 'var(--mf-green)', actie: 'Verduister de kamer, stel temperatuur in op 17-18°C' },
                { tijd: 'In bed', kleur: 'var(--mf-green)', actie: 'Diafragmatische ademhaling of 4-7-8 methode' },
              ].map(r => (
                <div key={r.tijd} className="mf-divider-row flex gap-3 items-start py-2">
                  <span className="text-xs font-bold w-16 flex-shrink-0 mt-0.5" style={{ color: r.kleur }}>{r.tijd}</span>
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>{r.actie}</p>
                </div>
              ))}
            </div>
          </>
        </TabsContent>

        {/* -------------- MENTAAL -------------- */}
        <TabsContent value="mentaal" style={{ paddingTop: 0 }}>
          <>
            <div className="rounded-2xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                Mentale technieken kunnen je helpen rustiger te worden en stress te verlagen door je aandacht bewust te sturen.
              </p>
            </div>

            <div className="space-y-3">
              {MENTAAL_TECHNIEKEN.map((tech, idx) => {
                const open = openTechniek === idx
                return (
                <CollapsibleRoot key={idx} open={open} onOpenChange={(o) => setOpenTechniek(o ? idx : null)} className="rounded-2xl border overflow-hidden mf-collapsible-card">
                  <CollapsibleTrigger asChild>
                    <button type="button" className="mf-acc-trigger w-full px-5 py-4 flex items-center gap-4 text-left transition">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `color-mix(in srgb, ${tech.kleur} 12%, transparent)`, color: tech.kleur }}>{(tech as {afk: string}).afk}</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{tech.naam}</p>
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>{tech.duur} · {tech.stappen.length} stappen</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${tech.kleur} 12%, transparent)`, color: tech.kleur }}>
                        {tech.duur}
                      </span>
                      <span className="ml-2" style={{ color: 'var(--text-3)' }}>{open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}</span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="text-xs italic mt-3 mb-3" style={{ color: 'var(--text-3)' }}>{tech.beschrijving}</p>
                      <ol className="space-y-2">
                        {tech.stappen.map((s, i) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                              style={{ background: `color-mix(in srgb, ${tech.kleur} 12%, transparent)`, color: tech.kleur }}>
                              {i + 1}
                            </span>
                            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{s}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CollapsibleContent>
                </CollapsibleRoot>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Stress signalen herkennen</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-4)' }}>Fysieke en mentale tekenen dat je een reset nodig hebt:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Kortaf reageren op collega\'s',
                  'Kaken op elkaar zetten',
                  'Moeite om te focussen',
                  'Ondiep ademen',
                  'Leeg gevoel, geen motivatie',
                  'Kleine dingen groot maken',
                  'Vermoeid maar niet kunnen slapen',
                  'Constant scherm scrollen',
                ].map(s => (
                  <div key={s} className="flex items-center gap-2 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--mf-red)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-2)' }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        </TabsContent>

        {/* -------------- TIMER -------------- */}
        <TabsContent value="timer" style={{ paddingTop: 0 }}>
          <>
            <div className="flex gap-2 mb-5">
              {(Object.keys(TIMERS) as TimerTab[]).map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => wisselTimerTab(k)}
                  aria-pressed={timerTab === k}
                  aria-label={`${TIMERS[k].naam}, ${formatTijd(TIMERS[k].duur)}`}
                  className="mf-pressable flex-1 py-3 rounded-xl text-xs font-medium border transition flex flex-col items-center gap-1"
                  style={{
                    background: timerTab === k ? 'var(--mentaforce-primary-light)' : 'var(--bg-card)',
                    borderColor: timerTab === k ? 'var(--mentaforce-primary)' : 'var(--border)',
                    color: timerTab === k ? 'var(--mentaforce-primary)' : 'var(--text-3)',
                  }}
                >
                  <span className="text-xs font-bold opacity-60">{TIMERS[k].afk}</span>
                  <span className="font-medium">{TIMERS[k].naam}</span>
                  <span style={{ opacity: 0.6 }}>{formatTijd(TIMERS[k].duur)}</span>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border p-6 mb-4 flex flex-col items-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div
                role="img"
                aria-label={`${timerConfig.naam}: ${formatTijd(timerRest)} resterend`}
                style={{ position: 'relative', width: 200, height: 200 }}
              >
                <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, ${timerConfig.kleur} 18%, transparent) 0%, transparent 70%)` }} />
                <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden focusable="false" style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}>
                  <circle cx="100" cy="100" r="88" fill="none" style={{ stroke: 'var(--border-strong)' }} strokeWidth="8" />
                  <circle
                    cx="100" cy="100" r="88"
                    fill="none"
                    stroke={timerConfig.kleur}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - timerVoortgang)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2 }} aria-hidden>
                  <span className="text-4xl font-bold" style={{ color: 'var(--text-1)' }}>{formatTijd(timerRest)}</span>
                  <span className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{timerConfig.naam}</span>
                </div>
              </div>

              {timerKlaar && (
                <div className="mt-4 text-center" role="status">
                  <div className="flex justify-center" style={{ color: 'var(--mf-green)' }}>
                    <CheckCircle2 size={40} aria-hidden strokeWidth={2} />
                  </div>
                  <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-2)' }}>Klaar!</p>
                </div>
              )}

              <p className="text-xs text-center mt-4 max-w-xs" style={{ color: 'var(--text-4)' }}>{timerConfig.tip}</p>
            </div>

            <div className="flex gap-3 mb-5">
              <button
                type="button"
                onClick={() => setTimerActief(!timerActief)}
                disabled={timerKlaar}
                aria-label={timerActief ? 'Timer pauzeren' : timerRest === timerConfig.duur ? 'Timer starten' : 'Timer hervatten'}
                className="mf-pressable flex-1 py-3.5 rounded-xl font-semibold text-sm transition disabled:opacity-40"
                style={{ background: timerActief ? 'var(--mf-amber)' : timerConfig.kleur, color: 'var(--bg-app)' }}
              >
                {timerActief ? 'Pauzeer' : timerRest === timerConfig.duur ? 'Start' : 'Hervat'}
              </button>
              <button
                type="button"
                onClick={() => { setTimerActief(false); setTimerKlaar(false); setTimerRest(timerConfig.duur) }}
                aria-label="Timer resetten"
                className="mf-pressable mf-reset-btn px-5 py-3.5 rounded-xl text-sm border transition"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--text-3)' }}
              >
                Reset
              </button>
            </div>

            {timerTab === 'micro' && (
              <div className="rounded-2xl border p-5 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Ideeën voor je micro-break</p>
                {[
                  'Kijk 20 sec naar iets op 6 meter (20-20-20 regel)',
                  'Rek je nek links en rechts, 3x per kant',
                  'Drink een glas water',
                  'Loop een rondje door het kantoor',
                  'Doe 3 diepe buikademhalingen',
                  'Schud je handen en polsen los',
                  'Stuur een berichtje naar iemand die je energie geeft',
                ].map(s => (
                  <div key={s} className="mf-divider-row flex items-center gap-2.5 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--mf-purple)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-2)' }}>{s}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Pomodoro methode</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
                Werk in blokken van 25 minuten gefocust werk, gevolgd door 5 minuten pauze. Na 4 blokken een lange pauze van 15-30 minuten.
              </p>
              <div className="flex gap-2 items-center flex-wrap">
                {['25m focus', '5m pauze', '25m focus', '5m pauze', '25m focus', '5m pauze', '25m focus', '20m pauze'].map((b, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{
                      background: b.includes('focus') ? 'var(--mf-green-light)' : b.includes('20') ? 'var(--mf-purple-light)' : 'var(--mf-blue-light)',
                      color: b.includes('focus') ? 'var(--mf-green-dark)' : b.includes('20') ? 'var(--mf-purple)' : 'var(--mf-blue)',
                    }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </>
        </TabsContent>
        </TabsRoot>

      </main>
    </div>
  )
}
