import type { CoachingBoek } from './typen'

// Benen: squats, lunges, heupscharnieren, beenmachines en sprongen
export const COACHING_BENEN: CoachingBoek = {
  'Achterwaartse lunge': {
    kernpunten: [
      { punt: 'Grote stap naar achteren', uitleg: 'Met een ruime stap blijft je voorste knie boven je voet en voel je het werk in bil en bovenbeen.' },
      { punt: 'Gewicht op je voorste hiel', uitleg: 'Je voorste been doet het werk. Het achterste been is vooral steun en balans.' },
      { punt: 'Romp rechtop', uitleg: 'Borst omhoog en blik vooruit, buik licht aangespannen. Zo blijft je onderrug rustig.' },
      { punt: 'Zak recht omlaag', uitleg: 'Denk aan een lift: je heup zakt verticaal, niet naar voren. Achterste knie stopt net boven de grond.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten op heupbreedte en je handen in je zij of voor je borst.',
      'Sta naast een rek of muur als je balans nog wankel is, zodat je je kunt vasthouden.',
    ],
    stappen: [
      'Stap met een been een grote pas naar achteren en zet de bal van die voet neer.',
      'Zak gecontroleerd tot beide knieen ongeveer een rechte hoek maken.',
      'Duw door de hiel van je voorste voet en trek je achterste been terug naast het andere.',
      'Wissel van been of doe eerst alle herhalingen aan een kant.',
    ],
    fouten: [
      { fout: 'Te kleine stap naar achteren', beter: 'Stap verder terug, zodat je voorste hiel aan de grond blijft en je gewicht op je voorste been rust.' },
      { fout: 'Voorste knie valt naar binnen', beter: 'Duw je knie licht naar buiten, in de richting van je tweede en derde teen.' },
      { fout: 'Afzetten met het achterste been', beter: 'Kom omhoog vanuit je voorste been. Het achterste been volgt alleen.' },
    ],
    ademhaling: 'Adem in terwijl je zakt en adem uit als je jezelf terug omhoog duwt.',
    tempo: 'Per been: 2 tellen omlaag, kort stil, 1 tel terug.',
    makkelijker: 'Houd je vast aan een rek of muur en zak minder diep.',
    zwaarder: 'Pak een dumbbell in elke hand of houd een kettlebell voor je borst.',
  },

  'Achterwaartse lunge met dumbbells': {
    kernpunten: [
      { punt: 'Schouders laag', uitleg: 'Laat de dumbbells hangen aan gestrekte armen en trek je schouders niet op naar je oren.' },
      { punt: 'Stap ver genoeg terug', uitleg: 'Met een ruime pas blijft je voorste scheen bijna verticaal en blijft je gewicht op je voorste hiel.' },
      { punt: 'Druk via je voorste hiel', uitleg: 'Je voelt het in bil en bovenbeen van het voorste been. Dat been tilt je omhoog.' },
      { punt: 'Romp blijft rechtop', uitleg: 'De dumbbells trekken je niet naar voren. Borst omhoog, buik licht aangespannen.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte en een dumbbell in elke hand, handpalmen naar je toe.',
      'Kies een gewicht dat je zonder wiebelen de hele set kunt vasthouden.',
    ],
    stappen: [
      'Stap met een been een grote pas naar achteren, landen op de bal van je voet.',
      'Zak recht naar beneden tot je achterste knie bijna de grond raakt.',
      'Duw door je voorste hiel en breng je achterste voet terug naar de start.',
    ],
    fouten: [
      { fout: 'Wiebelen bij het terugstappen', beter: 'Zet je voeten niet op een lijn maar op heupbreedte, alsof je op twee rails loopt.' },
      { fout: 'Dumbbells zwaaien mee', beter: 'Houd je armen stil langs je lichaam. Is dat lastig, neem dan lichter gewicht.' },
      { fout: 'Achterste knie klapt op de grond', beter: 'Stop net boven de vloer en kom gecontroleerd terug, zonder te stuiteren.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit als je omhoog duwt.',
    tempo: '2 tellen omlaag, 1 tel terug naar de start.',
    makkelijker: 'Doe de oefening zonder gewicht en houd je met een hand vast.',
    zwaarder: 'Zet je voorste voet op een lage step zodat je dieper kunt zakken.',
  },

  'Adductie aan de kabel': {
    kernpunten: [
      { punt: 'Sta stevig op je standbeen', uitleg: 'Knie licht gebogen en een hand aan het rek. Zo kan je binnenkant bovenbeen werken zonder dat je wankelt.' },
      { punt: 'Romp blijft stil', uitleg: 'Leun niet weg van de kabel. Alleen je been beweegt, je bovenlichaam staat recht.' },
      { punt: 'Been langs je standbeen', uitleg: 'Trek het been naar binnen tot net voor of langs je standbeen. Je voelt de binnenkant van je dij aanspannen.' },
      { punt: 'Langzaam terug', uitleg: 'Laat de kabel je been niet wegtrekken. Remmen op de weg terug is de helft van het werk.' },
    ],
    opstelling: [
      'Maak de enkelband vast aan de laagste stand van de kabel en doe hem om het been aan de kant van de kabel.',
      'Sta zijwaarts naast de kabel, ver genoeg zodat er al spanning staat als je been licht naar buiten hangt.',
    ],
    stappen: [
      'Begin met je werkbeen iets naar buiten, richting de kabel.',
      'Trek het been gestrekt naar binnen, langs of net voor je standbeen.',
      'Laat het rustig terugkomen tot je weer de beginspanning voelt.',
    ],
    fouten: [
      { fout: 'Bovenlichaam leunt mee', beter: 'Houd je vast en houd je schouders recht boven je heupen.' },
      { fout: 'Te zwaar, dus zwaaien', beter: 'Kies een gewicht dat je in een rustig tempo beheerst. Kleine beweging, volle controle.' },
      { fout: 'Heup draait open', beter: 'Houd je tenen naar voren gericht, zo blijft het werk bij de binnenkant van je bovenbeen.' },
    ],
    ademhaling: 'Adem uit als je het been naar binnen trekt, adem in op de weg terug.',
    tempo: '1 tel naar binnen, kort vasthouden, 2 tellen terug.',
    makkelijker: 'Gebruik een licht elastiek om je enkel in plaats van de kabel.',
    zwaarder: 'Houd het been 2 tellen vast aan de binnenkant voor je terug laat komen.',
  },

  'Adductie staand met elastiek': {
    kernpunten: [
      { punt: 'Hand tegen de muur', uitleg: 'Steun licht met een hand. Dan hoeft je standbeen niet te balanceren en werkt de binnenkant van je dij.' },
      { punt: 'Romp blijft recht', uitleg: 'Leun niet weg van het anker. Je schouders staan boven je heupen, alleen het werkbeen beweegt.' },
      { punt: 'Been langs je standbeen', uitleg: 'Trek je been gestrekt naar binnen tot net voor je standbeen. Daar voel je de binnenkant van je dij het best.' },
      { punt: 'Remmen op de weg terug', uitleg: 'Laat het elastiek je been niet terugschieten. Langzaam terug is de helft van het werk.' },
    ],
    opstelling: [
      'Maak het elastiek laag vast, bijvoorbeeld aan een rek, en doe de lus om de enkel aan de kant van het anker.',
      'Stap zijwaarts weg van het anker tot er al spanning staat als je werkbeen iets naar buiten hangt.',
    ],
    stappen: [
      'Begin met je werkbeen iets naar buiten, richting het anker.',
      'Trek het been gestrekt naar binnen, langs of net voor je standbeen.',
      'Laat het rustig terugkomen tot je weer de beginspanning voelt.',
    ],
    fouten: [
      { fout: 'Bovenlichaam hangt naar de kant', beter: 'Steun met je hand en houd je schouders recht boven je heupen.' },
      { fout: 'Zwaaien met het been', beter: 'Kies een lichter elastiek of sta dichter bij het anker. Rustig tempo, volle controle.' },
      { fout: 'Tenen draaien naar buiten', beter: 'Houd je tenen naar voren gericht, zo blijft het werk bij de binnenkant van je bovenbeen.' },
    ],
    ademhaling: 'Adem uit als je het been naar binnen trekt, adem in op de weg terug.',
    tempo: '1 tel naar binnen, kort vasthouden, 2 tellen terug.',
    makkelijker: 'Sta dichter bij het anker zodat het elastiek minder strak staat.',
    zwaarder: 'Gebruik een zwaarder elastiek of houd het been 2 tellen vast aan de binnenkant.',
  },

  'Adductor machine': {
    kernpunten: [
      { punt: 'Rug tegen de leuning', uitleg: 'Zit rechtop met je onderrug tegen het kussen, dan blijft het werk in de binnenkant van je bovenbenen.' },
      { punt: 'Begin met kleine spreiding', uitleg: 'Zet de startstand niet te wijd. Een lichte rek is goed, trekken in je liezen is te veel.' },
      { punt: 'Knijp rustig dicht', uitleg: 'Breng je benen gecontroleerd samen en voel de binnenkant van je dijen aanspannen.' },
      { punt: 'Gewicht niet laten vallen', uitleg: 'Laat de kussens rustig terugkomen zonder dat de gewichten tegen elkaar tikken.' },
    ],
    opstelling: [
      'Stel de startstand zo in dat je benen gespreid staan met een lichte rek, niet maximaal.',
      'Zet je voeten op de steunen en leg de binnenkant van je knieen tegen de kussens. Houd de handgrepen vast.',
    ],
    stappen: [
      'Span je buik licht aan en zit rechtop.',
      'Breng je benen gecontroleerd naar elkaar toe tot de kussens elkaar bijna raken.',
      'Laat ze rustig terug naar de startstand.',
    ],
    fouten: [
      { fout: 'Startstand te wijd', beter: 'Zet de spreiding kleiner. Pas als het goed voelt kun je hem een stapje wijder zetten.' },
      { fout: 'Naar voren buigen bij het dichtknijpen', beter: 'Houd je rug tegen de leuning en trek met je benen, niet met je bovenlichaam.' },
      { fout: 'Benen laten terugklappen', beter: 'Rem de terugweg af in 2 tellen. Zo werk je de hele beweging door.' },
    ],
    ademhaling: 'Adem uit als je je benen samenbrengt, adem in als ze terug gaan.',
    tempo: '1 tel dicht, kort vasthouden, 2 tellen terug.',
    makkelijker: 'Verklein de spreiding en neem minder gewicht.',
    zwaarder: 'Houd de benen 2 tellen samen geknepen voor je ze terug laat gaan.',
  },

  'Back squat': {
    kernpunten: [
      { punt: 'Stang op je bovenrug', uitleg: 'De stang ligt op de spieren onder je nek, niet op je wervels. Handen stevig om de stang, ellebogen omlaag.' },
      { punt: 'Buik aanspannen', uitleg: 'Adem in en zet je romp vast alsof iemand in je buik prikt. Zo blijft je rug neutraal onder de stang.' },
      { punt: 'Gewicht op je middenvoet', uitleg: 'Je hele voet blijft op de grond. Hielen en grote teen houden contact, je staat niet op je tenen.' },
      { punt: 'Knieen volgen je tenen', uitleg: 'Duw je knieen in de richting van je tenen naar buiten, ze vallen niet naar binnen.' },
      { punt: 'Borst omhoog bij het opstaan', uitleg: 'Heupen en schouders komen tegelijk omhoog. Je heupen schieten niet als eerste weg.' },
    ],
    opstelling: [
      'Zet het rek zo dat de stang op borsthoogte ligt en de veiligheidssteunen net onder je diepste punt staan.',
      'Stap onder de stang, til hem uit het rek en zet 2 of 3 stappen terug. Voeten op schouderbreedte, tenen iets naar buiten.',
    ],
    stappen: [
      'Adem diep in en span je romp aan.',
      'Zak door heupen en knieen tegelijk te buigen tot je heupen ongeveer op kniehoogte zijn.',
      'Duw de grond weg met je hele voet en kom recht omhoog.',
      'Adem uit bovenaan en zet je opnieuw vast voor de volgende herhaling.',
    ],
    fouten: [
      { fout: 'Hielen komen los van de grond', beter: 'Zit meer naar achteren en houd je gewicht op je middenvoet. Werk eventueel aan je enkelmobiliteit.' },
      { fout: 'Knieen vallen naar binnen bij het opstaan', beter: 'Duw je knieen actief naar buiten, in lijn met je tenen. Lukt dat niet, dan is het gewicht te zwaar.' },
      { fout: 'Onderrug wordt bol onderin', beter: 'Zak alleen zo diep als je rug neutraal blijft en span je buik steviger aan voor elke herhaling.' },
      { fout: 'Heupen schieten eerst omhoog', beter: 'Denk aan borst en heupen samen omhoog. Je romphoek blijft gelijk tot je bijna staat.' },
    ],
    ademhaling: 'Adem in en houd vast tijdens het zakken, adem uit als je bijna boven bent.',
    tempo: '2 tot 3 tellen omlaag, geen stuitering, krachtig omhoog.',
    makkelijker: 'Leer eerst de goblet squat of de squat in de smith machine.',
    zwaarder: 'Houd onderin 2 tellen stil voor je omhoog duwt (pauze squat).',
  },

  'Box jump': {
    kernpunten: [
      { punt: 'Zwaai je armen mee', uitleg: 'Armen naar achteren bij het inzakken en krachtig naar voren en omhoog. Dat geeft je sprong extra hoogte.' },
      { punt: 'Land zacht', uitleg: 'Land met je hele voet op de box en buig door je knieen en heupen, alsof je geluidloos wilt landen.' },
      { punt: 'Knieen naar buiten bij landing', uitleg: 'Je knieen wijzen in de richting van je tenen. Vallen ze naar binnen, dan is de box te hoog.' },
      { punt: 'Stap rustig af', uitleg: 'Stap met een been tegelijk naar beneden. Terugspringen geeft een harde landing zonder dat het iets toevoegt.' },
    ],
    opstelling: [
      'Kies een stevige box die niet kan schuiven en begin laag, bijvoorbeeld 30 tot 40 cm.',
      'Sta op een halve pas van de box met je voeten op heupbreedte.',
    ],
    stappen: [
      'Zak snel in een korte squat en zwaai je armen naar achteren.',
      'Spring explosief omhoog en naar voren, armen zwaaien mee.',
      'Land zacht met beide voeten tegelijk midden op de box en kom rechtop staan.',
      'Stap rustig met een been tegelijk naar beneden.',
    ],
    fouten: [
      { fout: 'Box te hoog gekozen', beter: 'Land je in een diepe squat of met je knieen tegen je borst, dan is de box te hoog. Kies een box waarop je rechtop landt.' },
      { fout: 'Hard landen met gestrekte benen', beter: 'Buig door bij de landing en vang je gewicht op met heupen en knieen.' },
      { fout: 'Doorgaan als je moe bent', beter: 'Stop als je sprongen lager of slordiger worden. Kwaliteit boven aantal, een misser op een box doet pijn.' },
    ],
    ademhaling: 'Adem kort uit bij de afzet en adem rustig in als je op de box staat.',
    tempo: 'Explosief omhoog, elke sprong los met een korte pauze ertussen.',
    makkelijker: 'Gebruik een lagere box of doe een step-up in een vlot tempo.',
    zwaarder: 'Maak de box geleidelijk hoger, nooit hoger dan je zacht en rechtop kunt landen.',
  },

  'Bulgarian split squat': {
    kernpunten: [
      { punt: 'Voorste hiel blijft aan de grond', uitleg: 'Je duwt via je hele voorste voet. Komt de hiel los, dan staat je voet te dicht bij de bank.' },
      { punt: 'Zak recht naar beneden', uitleg: 'Je heup gaat verticaal omlaag. Je voelt het in bil en bovenbeen van je voorste been.' },
      { punt: 'Achterste voet ontspannen', uitleg: 'Je achterste been is alleen steun. Leg de wreef of de tenen op de bank en duw er niet mee af.' },
      { punt: 'Romp licht voorover is goed', uitleg: 'Een kleine helling naar voren met een rechte rug geeft meer werk voor je bil. Niet inzakken.' },
    ],
    opstelling: [
      'Zet een bank achter je en leg de wreef van je achterste voet erop.',
      'Zet je voorste voet een grote stap voor de bank, zo dat je knie onderin ongeveer boven je enkel staat.',
      'Houd een dumbbell in elke hand, of begin zonder gewicht.',
    ],
    stappen: [
      'Span je buik aan en kijk vooruit.',
      'Zak gecontroleerd tot je voorste bovenbeen ongeveer horizontaal is.',
      'Duw via je voorste hiel terug omhoog zonder je knie op slot te zetten.',
    ],
    fouten: [
      { fout: 'Voorste voet te dicht bij de bank', beter: 'Schuif je voorste voet verder naar voren tot je hiel onderin aan de grond blijft.' },
      { fout: 'Wiebelen naar links en rechts', beter: 'Zet je voeten niet achter elkaar op een lijn maar iets uit elkaar, alsof je op twee rails staat.' },
      { fout: 'Duwen met het achterste been', beter: 'Ontspan de achterste voet. Al het werk komt uit je voorste been.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit bij het omhoog duwen.',
    tempo: '3 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Doe hem zonder gewicht en houd je met een hand vast aan een rek.',
    zwaarder: 'Neem zwaardere dumbbells of houd onderin 2 tellen stil.',
  },

  Deadlift: {
    kernpunten: [
      { punt: 'Stang boven je middenvoet', uitleg: 'Van bovenaf gezien loopt de stang over het midden van je voet. Zo trek je in een rechte lijn omhoog.' },
      { punt: 'Rug recht, borst trots', uitleg: 'Je rug blijft neutraal van begin tot eind, niet hol en niet bol. Kijk een paar meter voor je op de grond.' },
      { punt: 'Spanning voor je trekt', uitleg: 'Trek de stang strak tegen de schijven zodat er geen ruimte meer is. Pas dan duw je de grond weg.' },
      { punt: 'Stang langs je benen', uitleg: 'De stang schuift langs je scheenbenen en dijen omhoog. Zo blijft de last dicht bij je lichaam.' },
      { punt: 'Bovenaan rechtop, niet hol', uitleg: 'Eindig met gestrekte heupen en aangespannen billen. Leun niet achterover.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte en de stang boven je middenvoet.',
      'Buig voorover en pak de stang net buiten je knieen. Laat je scheenbenen de stang raken zonder hem weg te duwen.',
      'Strek je armen en span je brede rugspieren aan, alsof je je oksels naar je heupen trekt.',
    ],
    stappen: [
      'Adem diep in, span je buik aan en trek de spanning uit de stang.',
      'Duw de grond weg met je benen, de stang blijft tegen je benen.',
      'Als de stang voorbij je knieen is, duw je je heupen naar voren tot je rechtop staat.',
      'Laat de stang zakken door eerst je heupen naar achteren te duwen en dan je knieen te buigen.',
    ],
    fouten: [
      { fout: 'Onderrug wordt bol', beter: 'Zet je rug opnieuw vast voor elke herhaling. Lukt het niet met dit gewicht, ga dan lichter.' },
      { fout: 'Stang zwaait voor je benen uit', beter: 'Trek de stang naar je toe en houd hem tegen je benen. Een lange broek of sokken helpen.' },
      { fout: 'Rukken aan de stang', beter: 'Bouw eerst spanning op, dan pas omhoog. De start is een stevige duw, geen ruk.' },
      { fout: 'Heupen schieten eerst omhoog', beter: 'Heupen en schouders komen samen omhoog. Begin met je benen te duwen, niet met je rug te trekken.' },
    ],
    ademhaling: 'Adem in en houd vast voor je trekt, adem uit bovenaan of terug op de grond.',
    tempo: 'Gecontroleerd omhoog, 2 tellen omlaag, elke herhaling opnieuw opbouwen.',
    makkelijker: 'Begin met een kettlebell deadlift of leg de stang op blokken zodat hij hoger ligt.',
    zwaarder: 'Verhoog het gewicht in kleine stappen zolang je rug neutraal blijft.',
  },

  'Front squat': {
    kernpunten: [
      { punt: 'Ellebogen hoog', uitleg: 'Je bovenarmen wijzen bijna horizontaal naar voren. Zakken je ellebogen, dan rolt de stang van je schouders.' },
      { punt: 'Stang rust op je schouders', uitleg: 'De stang rust op de voorkant van je schouders. Je vingers houden hem alleen op zijn plaats.' },
      { punt: 'Romp rechtop', uitleg: 'Je borst blijft omhoog en je zakt recht tussen je hielen. Je voelt het vooral in de voorkant van je bovenbenen.' },
      { punt: 'Knieen ver naar voren mag', uitleg: 'Bij een front squat schuiven je knieen naar voren over je tenen. Dat is normaal, zolang je hielen aan de grond blijven.' },
    ],
    opstelling: [
      'Zet het rek op borsthoogte en de veiligheidssteunen net onder je diepste punt.',
      'Leg de stang voor op je schouders dicht tegen je hals, vingers onder de stang net buiten schouderbreedte, ellebogen hoog.',
      'Stap uit het rek en zet je voeten op schouderbreedte, tenen licht naar buiten.',
    ],
    stappen: [
      'Adem in en span je romp aan.',
      'Zak recht naar beneden en houd je ellebogen omhoog.',
      'Duw de grond weg en kom rechtop, ellebogen leiden de beweging omhoog.',
    ],
    fouten: [
      { fout: 'Ellebogen zakken onderin', beter: 'Denk aan ellebogen naar het plafond bij het opstaan. Is het te zwaar, neem dan lichter gewicht.' },
      { fout: 'Polsen doen pijn', beter: 'Houd de stang met minder vingers vast of kruis je armen over de stang tot je polsen soepeler zijn.' },
      { fout: 'Hielen komen omhoog', beter: 'Werk aan je enkelmobiliteit of zet je hielen op een klein verhoginkje, zoals een dun schijfje.' },
    ],
    ademhaling: 'Adem in en houd vast tijdens het zakken, adem uit bovenaan.',
    tempo: '2 tot 3 tellen omlaag, kort stil, krachtig omhoog.',
    makkelijker: 'Oefen eerst de goblet squat, dezelfde houding met minder eisen aan je polsen.',
    zwaarder: 'Houd onderin 2 tellen stil voor je omhoog komt.',
  },

  'Goblet squat': {
    kernpunten: [
      { punt: 'Gewicht tegen je borst', uitleg: 'Houd de dumbbell of kettlebell dicht tegen je borstbeen. Zo blijft je romp vanzelf rechtop.' },
      { punt: 'Ellebogen tussen je knieen', uitleg: 'Onderin zakken je ellebogen tussen je knieen door. Dat helpt je knieen naar buiten te duwen.' },
      { punt: 'Hielen op de grond', uitleg: 'Je hele voet blijft plat. Voel het gewicht op je middenvoet en hielen.' },
      { punt: 'Borst omhoog', uitleg: 'Kijk vooruit en houd je borst trots. Je rug blijft neutraal, ook onderin.' },
    ],
    opstelling: [
      'Sta met je voeten iets breder dan je heupen en je tenen licht naar buiten.',
      'Houd een dumbbell verticaal met beide handen onder de bovenste schijf, of een kettlebell aan de handvatten, tegen je borst.',
    ],
    stappen: [
      'Adem in en span je buik aan.',
      'Zak met je billen naar achteren en omlaag tot je bovenbenen ongeveer horizontaal zijn.',
      'Duw de grond weg met je hele voet en kom rechtop.',
    ],
    fouten: [
      { fout: 'Gewicht zakt weg van je borst', beter: 'Trek het gewicht tegen je borstbeen. Hangt het voor je uit, dan trekt het je naar voren.' },
      { fout: 'Knieen vallen naar binnen', beter: 'Duw je knieen naar buiten tegen je ellebogen aan, in de richting van je tenen.' },
      { fout: 'Ronde rug onderin', beter: 'Zak minder diep, alleen zo ver als je rug neutraal blijft.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit bij het omhoog komen.',
    tempo: '3 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Squat naar een bank, zo heb je een vaste diepte en houvast.',
    zwaarder: 'Neem een zwaarder gewicht of houd onderin 3 tellen stil.',
  },

  'Hack squat': {
    kernpunten: [
      { punt: 'Rug plat tegen de leuning', uitleg: 'Je hele rug en je billen blijven tegen het kussen. Komt je onderrug los, dan zak je te diep.' },
      { punt: 'Knieen in lijn met je tenen', uitleg: 'Je knieen bewegen in de richting van je tenen, ze vallen niet naar binnen.' },
      { punt: 'Duw met je hele voet', uitleg: 'Hielen en voorvoet duwen samen tegen het plateau. Je voelt vooral de voorkant van je bovenbenen.' },
      { punt: 'Knieen niet op slot', uitleg: 'Strek bovenaan bijna volledig, maar houd een klein beetje buiging. Zo blijft de spanning op je spieren.' },
    ],
    opstelling: [
      'Zet je schouders onder de kussens en je rug tegen de leuning.',
      'Zet je voeten op heupbreedte midden op het plateau, tenen licht naar buiten.',
      'Ontgrendel de veiligheidshendel pas als je stevig staat.',
    ],
    stappen: [
      'Adem in en span je buik aan.',
      'Zak gecontroleerd tot je knieen ongeveer een rechte hoek maken.',
      'Duw jezelf terug omhoog met je hele voet.',
      'Zet na de laatste herhaling de veiligheidsvergrendeling weer vast.',
    ],
    fouten: [
      { fout: 'Hielen komen los van het plateau', beter: 'Zet je voeten iets hoger op het plateau zodat je hele voet blijft staan.' },
      { fout: 'Knieen vallen naar binnen', beter: 'Duw je knieen actief naar buiten. Lukt dat niet, neem dan minder gewicht.' },
      { fout: 'Onderin stuiteren', beter: 'Rem af en draai rustig om onderin. Niet terugveren op je knieen.' },
    ],
    ademhaling: 'Adem in en zet je buik vast voor je zakt, adem uit als je bijna boven bent.',
    tempo: '3 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Minder gewicht en minder diep, of eerst de leg press.',
    zwaarder: 'Houd onderin 2 tellen stil of zet je voeten wat lager voor meer werk in je bovenbenen.',
  },

  'Leg curl liggend': {
    kernpunten: [
      { punt: 'Heupen op het kussen', uitleg: 'Druk je heupen in de bank. Komen je billen omhoog, dan neemt je onderrug het werk over.' },
      { punt: 'Hielen naar je billen', uitleg: 'Buig je knieen zo ver mogelijk. Je voelt de achterkant van je bovenbenen hard aanspannen.' },
      { punt: 'Langzaam terug', uitleg: 'Laat het gewicht in 2 tot 3 tellen zakken. Daar zit voor de hamstrings veel van het werk.' },
      { punt: 'Voeten naar je toe getrokken', uitleg: 'Trek je tenen licht naar je schenen. Dat geeft vaak een stevigere aanspanning.' },
    ],
    opstelling: [
      'Lig op je buik met je knieen net voorbij de rand van de bank, ter hoogte van het draaipunt.',
      'Zet het kussen net boven je hielen en houd de handgrepen vast.',
    ],
    stappen: [
      'Span je buik en billen licht aan.',
      'Buig je knieen en breng je hielen zo ver mogelijk naar je billen.',
      'Laat het kussen rustig zakken tot je benen bijna gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Billen komen omhoog', beter: 'Neem minder gewicht en druk je heupen bewust in het kussen.' },
      { fout: 'Gewicht laten vallen', beter: 'Rem de terugweg af. Tikken de gewichten op elkaar, dan ga je te snel.' },
      { fout: 'Kussen op je kuiten', beter: 'Zet het kussen lager, net boven je hielen, zodat je de hele beweging kunt maken.' },
    ],
    ademhaling: 'Adem uit als je de hielen naar je billen trekt, adem in op de weg terug.',
    tempo: '1 tel omhoog, kort vasthouden, 3 tellen terug.',
    makkelijker: 'Neem minder gewicht en maak een kleinere beweging.',
    zwaarder: 'Curl met twee benen en laat met een been zakken, langzaam in 4 tellen.',
  },

  'Leg curl staand': {
    kernpunten: [
      { punt: 'Bovenbeen blijft stil', uitleg: 'Je knie wijst naar beneden en schuift niet naar voren. Alleen je onderbeen beweegt.' },
      { punt: 'Heup tegen het kussen', uitleg: 'Leun licht met je heup of dij tegen het steunkussen. Zo blijft je bekken stil.' },
      { punt: 'Hiel naar je bil', uitleg: 'Buig je knie zo ver als lukt. Je voelt de achterkant van je bovenbeen aanspannen.' },
      { punt: 'Gewicht niet laten vallen', uitleg: 'Laat je been rustig terug zakken. Die remmende fase traint je hamstring net zo goed.' },
    ],
    opstelling: [
      'Stel het kussen zo in dat het net boven je enkel aan de achterkant van je onderbeen ligt.',
      'Sta met je knie ter hoogte van het draaipunt en houd de handgrepen vast. Standbeen licht gebogen.',
    ],
    stappen: [
      'Span je buik licht aan en sta rechtop.',
      'Buig je knie en breng je hiel naar je bil.',
      'Laat je been gecontroleerd zakken tot het bijna gestrekt is. Wissel na de set van been.',
    ],
    fouten: [
      { fout: 'Heup komt mee naar achteren', beter: 'Houd je heup tegen het kussen en neem minder gewicht.' },
      { fout: 'Holle onderrug', beter: 'Span je buik en billen licht aan, zodat je bekken niet naar voren kantelt.' },
      { fout: 'Te snel terug', beter: 'Tel 3 tellen op de terugweg. Tikt het gewicht, dan ga je te snel.' },
    ],
    ademhaling: 'Adem uit als je je hiel omhoog trekt, adem in op de weg terug.',
    tempo: '1 tel omhoog, kort vasthouden, 3 tellen terug.',
    makkelijker: 'Neem minder gewicht en maak de beweging kleiner.',
    zwaarder: 'Houd bovenaan 2 tellen vast voor je laat zakken.',
  },

  'Leg curl zittend': {
    kernpunten: [
      { punt: 'Knie bij het draaipunt', uitleg: 'Je knie ligt op een lijn met de as van de machine. Dan beweegt het kussen soepel mee met je been.' },
      { punt: 'Rug tegen de leuning', uitleg: 'Zit rechtop met je rug tegen het kussen. Niet naar voren hangen of trekken met je armen.' },
      { punt: 'Bovenbenen vast', uitleg: 'De beensteun drukt stevig op je bovenbenen. Zo kun je alleen met je hamstrings trekken.' },
      { punt: 'Langzaam terug', uitleg: 'Laat je benen in 2 tot 3 tellen terugkomen. Je voelt de rek in de achterkant van je bovenbenen.' },
    ],
    opstelling: [
      'Stel de rugleuning zo in dat je knie bij het draaipunt zit.',
      'Leg het onderste kussen net boven je hielen en zet de beensteun stevig op je bovenbenen, net boven je knieen.',
    ],
    stappen: [
      'Pak de handgrepen en zit rechtop.',
      'Buig je knieen en trek het kussen zo ver mogelijk onder je door.',
      'Laat je benen gecontroleerd terug tot ze bijna gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Beensteun zit te los', beter: 'Zet de steun strakker op je bovenbenen zodat je heupen niet omhoog kunnen komen.' },
      { fout: 'Halve beweging', beter: 'Buig zo ver als je kunt en strek bijna volledig. Neem lichter gewicht als dat nodig is.' },
      { fout: 'Knie niet bij het draaipunt', beter: 'Verschuif de rugleuning tot je knie en de as op een lijn liggen.' },
    ],
    ademhaling: 'Adem uit als je de knieen buigt, adem in op de weg terug.',
    tempo: '1 tel buigen, kort vasthouden, 3 tellen terug.',
    makkelijker: 'Minder gewicht en een iets kleinere beweging.',
    zwaarder: 'Buig met twee benen en laat met een been terug in 4 tellen.',
  },

  'Leg extension': {
    kernpunten: [
      { punt: 'Knie bij het draaipunt', uitleg: 'Je knie ligt op een lijn met de as van de machine. Zo loopt de beweging soepel en schuift het kussen niet over je scheen.' },
      { punt: 'Rustig strekken', uitleg: 'Strek je benen zonder klap of zwaai. Je voelt de voorkant van je bovenbenen aanspannen.' },
      { punt: 'Bovenaan kort vasthouden', uitleg: 'Houd de strekking 1 tel vast en span je bovenbeen bewust aan voor je laat zakken.' },
      { punt: 'Billen op de stoel', uitleg: 'Houd de handgrepen vast en blijf zitten. Kom je omhoog uit de stoel, dan is het te zwaar.' },
    ],
    opstelling: [
      'Stel de rugleuning zo in dat je knieen bij het draaipunt zitten.',
      'Zet het kussen op je scheenbenen, net boven je enkels. Pak de handgrepen naast de stoel.',
    ],
    stappen: [
      'Span je buik licht aan en zit rechtop.',
      'Strek je benen gecontroleerd tot ze bijna recht zijn.',
      'Laat het kussen rustig zakken tot je knieen weer ongeveer een rechte hoek maken.',
    ],
    fouten: [
      { fout: 'Benen omhoog zwaaien', beter: 'Neem minder gewicht en strek in een rustige tel. Zwaaien belast je knie en traint je spier minder.' },
      { fout: 'Kussen te hoog op het scheenbeen', beter: 'Zet het kussen lager, net boven je enkels.' },
      { fout: 'Gewicht laten vallen', beter: 'Rem af op de weg naar beneden, in 2 tot 3 tellen.' },
    ],
    ademhaling: 'Adem uit bij het strekken, adem in als je laat zakken.',
    tempo: '1 tel strekken, 1 tel vasthouden, 3 tellen terug.',
    makkelijker: 'Bij gevoelige knieen: licht gewicht en alleen het deel van de beweging dat pijnvrij voelt.',
    zwaarder: 'Strek met twee benen en laat met een been langzaam terug zakken.',
  },

  'Leg press': {
    kernpunten: [
      { punt: 'Onderrug tegen de leuning', uitleg: 'Je billen en onderrug blijven tegen het kussen. Komen ze los, dan zak je te diep.' },
      { punt: 'Knieen in lijn met je tenen', uitleg: 'Je knieen bewegen in de richting van je tenen. Ze vallen niet naar binnen en klappen niet naar buiten.' },
      { punt: 'Knieen niet op slot', uitleg: 'Strek bovenaan bijna, maar niet helemaal. Zo blijft het gewicht op je spieren en niet op je gewricht.' },
      { punt: 'Duw met je hele voet', uitleg: 'Hielen blijven op het plateau. Je voelt het in je billen en bovenbenen.' },
    ],
    opstelling: [
      'Stel de rugleuning zo in dat je onderrug goed tegen het kussen ligt.',
      'Zet je voeten op heupbreedte midden op het plateau, tenen licht naar buiten. Pak de handgrepen naast de stoel.',
      'Duw het plateau iets omhoog en zet de veiligheidshendels los.',
    ],
    stappen: [
      'Laat het plateau gecontroleerd zakken tot je knieen ongeveer een rechte hoek maken.',
      'Duw het plateau terug met je hele voet tot je benen bijna gestrekt zijn.',
      'Zet na de laatste herhaling de veiligheidshendels weer vast.',
    ],
    fouten: [
      { fout: 'Billen komen los van het kussen', beter: 'Zak minder diep. Je bekken mag niet kantelen, dat zet druk op je onderrug.' },
      { fout: 'Knieen klikken op slot bovenaan', beter: 'Stop net voor volledige strekking en houd een kleine buiging in je knieen.' },
      { fout: 'Duwen met je handen op je knieen', beter: 'Houd de handgrepen vast. Lukt de herhaling niet zonder hulp, neem dan minder gewicht.' },
    ],
    ademhaling: 'Adem in en zet je buik vast voor het plateau zakt, adem uit als je bijna gestrekt bent.',
    tempo: '3 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Minder gewicht en minder diep zakken.',
    zwaarder: 'Houd onderin 2 tellen stil of duw met een been tegelijk.',
  },

  'Lunge met barbell': {
    kernpunten: [
      { punt: 'Stang stevig op je bovenrug', uitleg: 'De stang ligt op de spieren onder je nek en je handen trekken hem vast. Zo schuift hij niet bij elke stap.' },
      { punt: 'Voeten op twee rails', uitleg: 'Stap niet op een lijn maar met je voeten op heupbreedte. Zo blijf je stabiel onder de stang.' },
      { punt: 'Voorste knie boven je voet', uitleg: 'Je knie beweegt in de richting van je tenen en valt niet naar binnen.' },
      { punt: 'Romp rechtop', uitleg: 'Borst omhoog en buik aangespannen. De stang trekt je niet naar voren.' },
    ],
    opstelling: [
      'Zet het rek op borsthoogte en neem de stang op je bovenrug, zoals bij de back squat.',
      'Stap uit het rek en zet je voeten op heupbreedte. Zorg voor genoeg vrije ruimte voor je.',
    ],
    stappen: [
      'Adem in, span je buik aan en zet een flinke pas naar voren.',
      'Zak recht naar beneden tot je achterste knie bijna de grond raakt.',
      'Duw krachtig af met je voorste been en stap terug naar de start.',
    ],
    fouten: [
      { fout: 'Uit balans bij het terugstappen', beter: 'Maak de pas iets korter en zet je voeten breder. Beheers je dit niet, ga terug naar dumbbells.' },
      { fout: 'Romp valt voorover', beter: 'Houd je borst omhoog en je ellebogen onder de stang. Neem minder gewicht.' },
      { fout: 'Achterste knie klapt op de grond', beter: 'Stop net boven de vloer en kom gecontroleerd omhoog.' },
    ],
    ademhaling: 'Adem in en zet je buik vast voor je stapt, adem uit als je terug bent bij de start.',
    tempo: '2 tellen omlaag, krachtig terug naar de start.',
    makkelijker: 'Doe de lunge met dumbbells of de achterwaartse lunge.',
    zwaarder: 'Verhoog het gewicht in kleine stappen zolang je stabiel blijft.',
  },

  'Lunge met dumbbells': {
    kernpunten: [
      { punt: 'Flinke pas naar voren', uitleg: 'Een ruime stap houdt je voorste knie boven je voet en geeft je bil meer werk.' },
      { punt: 'Voorste knie boven je voet', uitleg: 'Je knie wijst naar je tenen en valt niet naar binnen bij het afduwen.' },
      { punt: 'Romp rechtop', uitleg: 'Laat de dumbbells langs je zij hangen en houd je borst omhoog.' },
      { punt: 'Krachtig terugduwen', uitleg: 'Zet af met de hiel van je voorste voet en stap in een beweging terug.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte en een dumbbell in elke hand, armen gestrekt langs je lichaam.',
    ],
    stappen: [
      'Stap een flinke pas naar voren en zet je voet stevig neer.',
      'Zak recht naar beneden tot je achterste knie bijna de grond raakt.',
      'Duw via je voorste hiel terug naar de start en wissel van been.',
    ],
    fouten: [
      { fout: 'Remmen op je tenen', beter: 'Land met je hele voet en houd je gewicht op je middenvoet en hiel.' },
      { fout: 'Knie valt naar binnen', beter: 'Duw je voorste knie licht naar buiten, in lijn met je tenen.' },
      { fout: 'Te korte pas', beter: 'Stap verder naar voren zodat je onderin twee hoeken van ongeveer 90 graden maakt.' },
    ],
    ademhaling: 'Adem in bij het uitstappen en zakken, adem uit bij het terugduwen.',
    tempo: '2 tellen omlaag, 1 tel terug naar de start.',
    makkelijker: 'Doe de achterwaartse lunge, die is rustiger voor je knie.',
    zwaarder: 'Neem zwaardere dumbbells of doe de walking lunge.',
  },

  'Roemeense deadlift met barbell': {
    kernpunten: [
      { punt: 'Heupen naar achteren', uitleg: 'Je duwt je billen naar achteren alsof je een deur met je billen dichtduwt. De stang zakt vanzelf mee.' },
      { punt: 'Stang langs je benen', uitleg: 'De stang schuift langs je dijen naar beneden. Komt hij los van je benen, dan wordt het zwaar voor je rug.' },
      { punt: 'Rug recht', uitleg: 'Je rug blijft neutraal, van nek tot stuit. Je kijkt een paar meter voor je op de grond.' },
      { punt: 'Knieen licht gebogen', uitleg: 'Je knieen buigen een beetje en blijven zo staan. Het is geen squat.' },
      { punt: 'Billen aanspannen bovenaan', uitleg: 'Kom omhoog door je heupen naar voren te duwen. Niet achterover leunen.' },
    ],
    opstelling: [
      'Pak de stang op heupbreedte met je handpalmen naar je toe, bijvoorbeeld uit een rek op heuphoogte.',
      'Sta rechtop met je voeten op heupbreedte en de stang tegen je dijen. Schouders laag en naar achteren.',
    ],
    stappen: [
      'Adem in en span je buik aan.',
      'Duw je heupen naar achteren en laat de stang langs je benen zakken tot je een flinke rek in je hamstrings voelt.',
      'Duw je heupen naar voren en kom rechtop, de stang blijft dicht bij je benen.',
    ],
    fouten: [
      { fout: 'Rug wordt bol onderin', beter: 'Stop eerder. Je zakt alleen zo ver als je rug recht blijft, vaak net onder je knieen.' },
      { fout: 'Knieen buigen steeds verder', beter: 'Zet je knieen in een lichte buiging vast en beweeg alleen vanuit je heupen.' },
      { fout: 'Stang hangt voor je uit', beter: 'Span je brede rugspieren aan, alsof je je oksels naar je heupen trekt. De stang schuift langs je broek.' },
    ],
    ademhaling: 'Adem in en zet je buik vast voor je zakt, adem uit als je bijna rechtop staat.',
    tempo: '3 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Doe hem met dumbbells of een lichte stang en zak minder diep.',
    zwaarder: 'Verhoog het gewicht of houd onderin 2 tellen stil in de rek.',
  },

  'Roemeense deadlift met dumbbells': {
    kernpunten: [
      { punt: 'Heupen naar achteren', uitleg: 'Beweeg vanuit je heupen, alsof je met je billen een deur dichtduwt. Je knieen blijven bijna stil.' },
      { punt: 'Dumbbells langs je benen', uitleg: 'Laat de dumbbells langs je dijen en scheenbenen glijden. Dicht bij je lichaam spaart je onderrug.' },
      { punt: 'Rug recht', uitleg: 'Je rug blijft neutraal. Voel het in de achterkant van je bovenbenen, niet in je onderrug.' },
      { punt: 'Omhoog met je billen', uitleg: 'Span je billen aan en duw je heupen naar voren. Rechtop staan is genoeg, niet achterover leunen.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte en een dumbbell in elke hand voor je bovenbenen, handpalmen naar je toe.',
      'Knieen licht gebogen, schouders laag en naar achteren.',
    ],
    stappen: [
      'Adem in en span je buik aan.',
      'Duw je heupen naar achteren en laat de dumbbells langs je benen zakken tot je een rek in je hamstrings voelt.',
      'Kom omhoog door je heupen naar voren te duwen.',
    ],
    fouten: [
      { fout: 'Te diep zakken met een bolle rug', beter: 'Stop zodra je rug wil krommen. Diepte komt met de tijd, rechte rug komt eerst.' },
      { fout: 'Het wordt een squat', beter: 'Houd je knieen in een lichte buiging en duw je heupen naar achteren, niet naar beneden.' },
      { fout: 'Hoofd omhoog naar de spiegel', beter: 'Houd je nek in lijn met je rug en kijk een stukje voor je op de grond.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit als je omhoog komt.',
    tempo: '3 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Gebruik lichte dumbbells en oefen eerst met je handen langs je benen, zonder gewicht.',
    zwaarder: 'Doe hem op een been, de andere voet licht achter je voor balans.',
  },

  'Squat in de smith machine': {
    kernpunten: [
      { punt: 'Voeten iets voor de stang', uitleg: 'Zet je voeten een klein stukje voor je lichaam, zo zak je recht en blijven je hielen aan de grond.' },
      { punt: 'Rug neutraal', uitleg: 'De machine geeft houvast, maar je rug moet zelf recht blijven. Buik aangespannen.' },
      { punt: 'Knieen volgen je tenen', uitleg: 'Je knieen bewegen in de richting van je tenen en vallen niet naar binnen.' },
      { punt: 'Veiligheidsstops goed zetten', uitleg: 'Zet de stops net onder je diepste punt. Dan kun je de stang altijd veilig neerleggen.' },
    ],
    opstelling: [
      'Zet de stang op schouderhoogte en de veiligheidsstops net onder het punt waar je bovenbenen horizontaal zijn.',
      'Ga onder de stang staan met de stang op je bovenrug en je voeten op schouderbreedte, iets voor de stang.',
      'Draai de stang los uit de haken door je polsen te draaien.',
    ],
    stappen: [
      'Adem in en span je buik aan.',
      'Zak tot je bovenbenen ongeveer horizontaal zijn.',
      'Duw de grond weg met je hele voet en kom omhoog.',
      'Haak de stang na de laatste herhaling weer in door je polsen terug te draaien.',
    ],
    fouten: [
      { fout: 'Voeten recht onder de stang', beter: 'Zet je voeten een klein stukje naar voren. Zo blijft je gewicht op je middenvoet en blijven je hielen aan de grond.' },
      { fout: 'Leunen tegen de stang', beter: 'Sta zelf stevig. De stang loopt mee, maar je romp draagt het gewicht.' },
      { fout: 'Te diep met een kantelend bekken', beter: 'Zak alleen zo ver als je onderrug neutraal blijft.' },
    ],
    ademhaling: 'Adem in en houd vast tijdens het zakken, adem uit bovenaan.',
    tempo: '3 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Minder gewicht en zak naar een bank achter je.',
    zwaarder: 'Houd onderin 2 tellen stil of verhoog het gewicht stapje voor stapje.',
  },

  'Squat jump': {
    kernpunten: [
      { punt: 'Korte squat, dan exploderen', uitleg: 'Zak niet te diep, ongeveer een kwart tot halve squat, en spring meteen krachtig omhoog.' },
      { punt: 'Land zacht', uitleg: 'Land op de bal van je voet en rol door naar je hiel. Buig door je knieen en heupen, alsof je geluidloos landt.' },
      { punt: 'Knieen naar buiten', uitleg: 'Bij afzet en landing wijzen je knieen in de richting van je tenen.' },
      { punt: 'Armen helpen mee', uitleg: 'Zwaai je armen naar achteren bij het inzakken en omhoog bij de sprong.' },
    ],
    opstelling: [
      'Sta op een stevige, niet gladde ondergrond met je voeten op heupbreedte.',
      'Zorg voor genoeg ruimte boven en om je heen.',
    ],
    stappen: [
      'Zak snel in een korte squat en zwaai je armen naar achteren.',
      'Spring explosief omhoog en strek je heupen, knieen en enkels.',
      'Land zacht en vang de landing op in een korte squat.',
      'Sta even stil of spring meteen opnieuw als je de landing beheerst.',
    ],
    fouten: [
      { fout: 'Hard en stijf landen', beter: 'Buig door bij de landing. Hoor je je landing, dan is hij te hard.' },
      { fout: 'Knieen vallen naar binnen bij de landing', beter: 'Land met je knieen boven je voeten. Spring lager tot dat goed gaat.' },
      { fout: 'Doorgaan als je moe bent', beter: 'Stop als je sprongen lager of slordiger worden. Kwaliteit boven aantal.' },
    ],
    ademhaling: 'Adem kort uit bij de afzet, adem in bij de landing.',
    tempo: 'Explosief omhoog, zacht landen, beheerst opnieuw.',
    makkelijker: 'Doe een snelle squat met lichaamsgewicht en kom op je tenen zonder te springen.',
    zwaarder: 'Spring hoger of doe de box jump.',
  },

  'Squat met dumbbells': {
    kernpunten: [
      { punt: 'Borst omhoog', uitleg: 'De dumbbells hangen naast je benen. Houd je borst trots zodat je niet voorover klapt.' },
      { punt: 'Hielen aan de grond', uitleg: 'Je hele voet blijft plat. Voel het gewicht op je middenvoet en hielen.' },
      { punt: 'Knieen naar je tenen', uitleg: 'Je knieen bewegen in de richting van je tenen en vallen niet naar binnen.' },
      { punt: 'Armen hangen stil', uitleg: 'Je armen zijn alleen haken. Laat de dumbbells recht naar beneden hangen.' },
    ],
    opstelling: [
      'Sta met je voeten iets breder dan je heupen, tenen licht naar buiten.',
      'Houd een dumbbell naast elk been, handpalmen naar je toe, schouders laag.',
    ],
    stappen: [
      'Adem in en span je buik aan.',
      'Zak alsof je gaat zitten tot je bovenbenen ongeveer horizontaal zijn.',
      'Duw de grond weg en kom rechtop.',
    ],
    fouten: [
      { fout: 'Voorover vallen met de romp', beter: 'Houd je borst omhoog en zit tussen je hielen. Neem lichtere dumbbells als het blijft gebeuren.' },
      { fout: 'Op je tenen komen', beter: 'Zit meer naar achteren en houd je hielen aan de grond.' },
      { fout: 'Dumbbells tikken tegen je knieen', beter: 'Draai je handen iets zodat de dumbbells net naast je benen hangen.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit bij het omhoog komen.',
    tempo: '3 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Zak naar een bank of doe hem zonder gewicht.',
    zwaarder: 'Neem zwaardere dumbbells of houd onderin 2 tellen stil.',
  },

  'Squat met elastiek': {
    kernpunten: [
      { punt: 'Voeten plat op het elastiek', uitleg: 'Je hele voet staat op het elastiek. Zo kan het niet wegschieten.' },
      { punt: 'Handen bij je schouders', uitleg: 'Houd de uiteinden vast voor je schouders, ellebogen naar voren. Je armen blijven stil.' },
      { punt: 'Knieen volgen je tenen', uitleg: 'Je knieen bewegen in de richting van je tenen en vallen niet naar binnen.' },
      { punt: 'Uitduwen tot je rechtop staat', uitleg: 'Bovenaan is het elastiek het strakst. Strek je heupen en span je billen aan.' },
    ],
    opstelling: [
      'Sta met je voeten op schouderbreedte midden op het elastiek, tenen licht naar buiten.',
      'Houd de uiteinden bij je schouders met je handpalmen naar voren of naar elkaar.',
    ],
    stappen: [
      'Adem in en span je buik aan.',
      'Zak tot je bovenbenen ongeveer horizontaal zijn, borst omhoog.',
      'Duw de grond weg en kom helemaal rechtop tegen de spanning van het elastiek in.',
    ],
    fouten: [
      { fout: 'Elastiek schuift onder je voet', beter: 'Zet je voeten breder op het elastiek en houd ze plat. Controleer het elastiek op scheurtjes.' },
      { fout: 'Ellebogen zakken en je romp klapt voorover', beter: 'Houd je handen hoog bij je schouders en je borst omhoog.' },
      { fout: 'Niet helemaal uitstrekken', beter: 'Kom bovenaan echt rechtop staan. Daar zit bij een elastiek het meeste werk.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit bij het omhoog komen.',
    tempo: '2 tellen omlaag, 1 tel omhoog, kort vasthouden bovenaan.',
    makkelijker: 'Gebruik een lichter elastiek of zak minder diep.',
    zwaarder: 'Gebruik een zwaarder elastiek of zak langzamer in 4 tellen.',
  },

  'Squat met elastiek boven de knieen': {
    kernpunten: [
      { punt: 'Knieen naar buiten', uitleg: 'Duw je knieen de hele herhaling tegen het elastiek in naar buiten. Zo werken je billen aan de zijkant mee.' },
      { punt: 'Elastiek net boven de knie', uitleg: 'Niet op of onder de knie, maar net erboven. Daar blijft het zitten en drukt het niet op je gewricht.' },
      { punt: 'Borst omhoog', uitleg: 'Je romp blijft rechtop en je kijkt vooruit. Armen voor je helpen je in balans.' },
      { punt: 'Hele voet aan de grond', uitleg: 'Je gewicht verdeeld over hiel en voorvoet. Je grote teen blijft op de grond als je knieen naar buiten gaan.' },
    ],
    opstelling: [
      'Doe een minibandje om beide benen, net boven je knieen.',
      'Sta met je voeten op schouderbreedte, tenen licht naar buiten, en strek je armen voor je of vouw je handen.',
    ],
    stappen: [
      'Duw je knieen licht naar buiten zodat er spanning op het elastiek komt.',
      'Zak tot je bovenbenen ongeveer horizontaal zijn, knieen in lijn met je tenen.',
      'Duw de grond weg en kom helemaal rechtop, zonder de spanning los te laten.',
    ],
    fouten: [
      { fout: 'Knieen vallen naar binnen', beter: 'Kies een lichter elastiek en duw bewust naar buiten. Je knieen wijzen naar je tweede en derde teen.' },
      { fout: 'Elastiek rolt op of zakt af', beter: 'Leg het plat net boven de knie. Een breder stoffen bandje blijft beter zitten.' },
      { fout: 'Voeten rollen naar de buitenkant', beter: 'Houd je grote teen op de grond. Naar buiten duwen doe je met je knieen, niet met je voeten.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit bij het omhoog komen.',
    tempo: '2 tellen omlaag, 1 tel omhoog, spanning blijft op het elastiek.',
    makkelijker: 'Gebruik een lichter elastiek of zak naar een bank achter je.',
    zwaarder: 'Gebruik een zwaarder elastiek of houd een dumbbell voor je borst.',
  },

  'Squat met lichaamsgewicht': {
    kernpunten: [
      { punt: 'Billen naar achteren', uitleg: 'Zak alsof je op een stoel gaat zitten die net achter je staat. Je heupen gaan naar achteren en omlaag.' },
      { punt: 'Knieen volgen je tenen', uitleg: 'Je knieen bewegen in de richting van je tenen. Ze vallen niet naar binnen.' },
      { punt: 'Hielen op de grond', uitleg: 'Je hele voet blijft plat. Je voelt het gewicht op je middenvoet en hielen.' },
      { punt: 'Borst omhoog', uitleg: 'Armen voor je uit helpen je in balans. Je rug blijft recht.' },
    ],
    opstelling: [
      'Sta met je voeten iets breder dan je heupen en je tenen licht naar buiten.',
      'Strek je armen voor je uit op schouderhoogte of houd je handen voor je borst.',
    ],
    stappen: [
      'Adem in en span je buik aan.',
      'Zak met je billen naar achteren en omlaag, zo diep als je met een rechte rug kunt.',
      'Duw de grond weg en kom rechtop, billen aangespannen.',
    ],
    fouten: [
      { fout: 'Knieen schieten naar binnen', beter: 'Duw je knieen naar buiten, in lijn met je tenen.' },
      { fout: 'Hielen komen omhoog', beter: 'Zit meer naar achteren en houd je gewicht op je middenvoet en hielen. Zet je voeten eventueel iets breder.' },
      { fout: 'Ronde rug onderin', beter: 'Zak minder diep. Diepte komt vanzelf als je mobiliteit beter wordt.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit bij het omhoog komen.',
    tempo: '3 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Squat naar een bank of houd je vast aan een rek.',
    zwaarder: 'Pak een dumbbell voor je borst (goblet squat) of zak in 4 tellen.',
  },

  'Squat naar een bank': {
    kernpunten: [
      { punt: 'Billen naar achteren', uitleg: 'Reik met je billen naar de bank achter je. Zo gaan je heupen naar achteren en blijven je knieen rustig.' },
      { punt: 'Raak de bank, niet ploffen', uitleg: 'Tik de bank net aan met je billen. Je blijft spanning houden en gaat niet zitten.' },
      { punt: 'Knieen volgen je tenen', uitleg: 'Je knieen bewegen in de richting van je tenen en vallen niet naar binnen.' },
      { punt: 'Opstaan via je hielen', uitleg: 'Duw de grond weg met je hele voet. Niet naar voren zwaaien om omhoog te komen.' },
    ],
    opstelling: [
      'Zet een stevige bank achter je die niet kan schuiven.',
      'Sta een kleine stap voor de bank met je voeten iets breder dan je heupen, tenen licht naar buiten.',
    ],
    stappen: [
      'Strek je armen voor je uit en span je buik aan.',
      'Zak gecontroleerd tot je billen de bank net raken.',
      'Kom zonder vaart weer rechtop.',
    ],
    fouten: [
      { fout: 'Ploffen op de bank', beter: 'Rem af in 3 tellen en tik de bank alleen aan.' },
      { fout: 'Naar voren zwaaien bij het opstaan', beter: 'Houd je borst omhoog en duw via je hielen. Neem een hogere bank als het nog niet lukt.' },
      { fout: 'Knieen vallen naar binnen', beter: 'Duw je knieen naar buiten, in lijn met je tenen.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit bij het opstaan.',
    tempo: '3 tellen omlaag, aantikken, 1 tel omhoog.',
    makkelijker: 'Gebruik een hogere bank of leg er een kussen op.',
    zwaarder: 'Gebruik een lagere bank of houd een dumbbell voor je borst.',
  },

  'Step-up': {
    kernpunten: [
      { punt: 'Hele voet op de bank', uitleg: 'Zet je hele voet op de bank, niet alleen je voorvoet. Zo kun je via je hiel duwen.' },
      { punt: 'Duw met het voorste been', uitleg: 'Het been op de bank tilt je omhoog. Zet zo min mogelijk af met je achterste voet.' },
      { punt: 'Knie boven je voet', uitleg: 'Je knie wijst naar je tenen en valt niet naar binnen als je opstapt.' },
      { punt: 'Gecontroleerd afstappen', uitleg: 'Laat jezelf rustig zakken. Niet terugvallen naar de grond.' },
    ],
    opstelling: [
      'Kies een stevige bank of opstapje waarbij je knie niet hoger komt dan je heup.',
      'Sta recht voor de bank en zet een voet er volledig op.',
    ],
    stappen: [
      'Leun licht naar voren en duw via de hiel van je voorste voet.',
      'Strek je been en kom rechtop op de bank staan.',
      'Laat je andere voet gecontroleerd terug naar de grond zakken. Je werkbeen blijft op de bank en remt.',
    ],
    fouten: [
      { fout: 'Afzetten met het onderste been', beter: 'Til je achterste tenen bewust licht op, zo doet je voorste been het werk.' },
      { fout: 'Knie valt naar binnen', beter: 'Duw je knie naar buiten in lijn met je tenen. Kies een lagere bank als dat niet lukt.' },
      { fout: 'Bank te hoog', beter: 'Kies een hoogte waarbij je knie niet boven je heup komt.' },
    ],
    ademhaling: 'Adem uit als je opstapt, adem in als je afstapt.',
    tempo: '1 tel op, 2 tellen gecontroleerd af.',
    makkelijker: 'Gebruik een lager opstapje en houd je vast aan een rek.',
    zwaarder: 'Neem dumbbells in je handen of kies een iets hogere bank.',
  },

  'Step-up met dumbbells': {
    kernpunten: [
      { punt: 'Duw vanuit je hiel', uitleg: 'Duw via de hiel van je bovenste been. Je voelt het in bil en bovenbeen van dat been.' },
      { punt: 'Niet afzetten met onderste been', uitleg: 'Je achterste voet doet zo weinig mogelijk. Anders verdwijnt het werk uit je voorste been.' },
      { punt: 'Schouders laag', uitleg: 'Laat de dumbbells aan gestrekte armen hangen en trek je schouders niet op.' },
      { punt: 'Romp rechtop', uitleg: 'Een lichte helling naar voren bij het opstappen is goed. Bovenaan sta je helemaal rechtop.' },
    ],
    opstelling: [
      'Sta voor een stevige bank met een dumbbell in elke hand, armen gestrekt langs je lichaam.',
      'Kies een hoogte waarbij je knie niet boven je heup komt en zet een voet volledig op de bank.',
    ],
    stappen: [
      'Leun licht naar voren en duw via je hiel omhoog.',
      'Strek je been helemaal en kom rechtop op de bank staan.',
      'Stap gecontroleerd weer af en zet je voet zacht neer.',
    ],
    fouten: [
      { fout: 'Springen vanaf de grond', beter: 'Til je achterste tenen licht op voor je opstapt. Het bovenste been doet al het werk.' },
      { fout: 'Dumbbells zwaaien mee', beter: 'Houd je armen stil. Lukt dat niet, neem dan lichtere dumbbells.' },
      { fout: 'Neerploffen bij het afstappen', beter: 'Laat jezelf in 2 tellen zakken op je bovenste been.' },
    ],
    ademhaling: 'Adem uit als je opstapt, adem in als je afstapt.',
    tempo: '1 tel op, 2 tellen gecontroleerd af.',
    makkelijker: 'Doe de step-up zonder gewicht of op een lagere bank.',
    zwaarder: 'Neem zwaardere dumbbells of een iets hogere bank.',
  },

  'Sumo squat met dumbbell': {
    kernpunten: [
      { punt: 'Brede stand, tenen naar buiten', uitleg: 'Je voeten staan ruim breder dan je schouders met je tenen schuin naar buiten. Zo werkt ook de binnenkant van je dijen.' },
      { punt: 'Knieen naar buiten', uitleg: 'Je knieen wijzen in de richting van je tenen. In deze brede stand vallen ze snel naar binnen.' },
      { punt: 'Zak recht naar beneden', uitleg: 'Je romp blijft rechtop en je zakt verticaal, alsof je langs een muur naar beneden glijdt.' },
      { punt: 'Gewicht hangt tussen je benen', uitleg: 'Houd de dumbbell met beide handen aan gestrekte armen. Je armen doen niets.' },
    ],
    opstelling: [
      'Sta breed met je tenen schuin naar buiten.',
      'Houd een dumbbell verticaal met beide handen aan de bovenste schijf, tussen je benen.',
    ],
    stappen: [
      'Adem in en span je buik aan.',
      'Zak recht naar beneden en duw je knieen naar buiten.',
      'Duw via je hielen terug omhoog en span je billen aan.',
    ],
    fouten: [
      { fout: 'Knieen vallen naar binnen', beter: 'Duw je knieen actief naar buiten. Zet je tenen eventueel iets minder ver naar buiten.' },
      { fout: 'Voorover buigen', beter: 'Houd je borst omhoog. Laat de dumbbell recht onder je schouders hangen.' },
      { fout: 'Stand te breed', beter: 'Zet je voeten iets dichter bij elkaar als je liezen trekken of je niet diep kunt zakken.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit bij het omhoog komen.',
    tempo: '3 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Doe hem zonder gewicht of zak minder diep.',
    zwaarder: 'Neem een zwaardere dumbbell of kettlebell en houd onderin 2 tellen stil.',
  },

  'Walking lunge': {
    kernpunten: [
      { punt: 'Romp rechtop', uitleg: 'Je borst blijft omhoog en je kijkt vooruit. De dumbbells hangen stil langs je zij.' },
      { punt: 'Voorste knie boven je voet', uitleg: 'Je knie beweegt in de richting van je tenen en valt niet naar binnen.' },
      { punt: 'Knie niet op de grond', uitleg: 'Stop net boven de vloer met je achterste knie. Niet laten tikken of klappen.' },
      { punt: 'Rustig ritme', uitleg: 'Elke stap is een beheerste lunge. Liever langzaam en stabiel dan snel en wiebelig.' },
    ],
    opstelling: [
      'Zorg voor een vrije baan van minstens 10 meter.',
      'Sta met je voeten op heupbreedte en een dumbbell in elke hand, armen gestrekt.',
    ],
    stappen: [
      'Stap een flinke pas naar voren en zak tot je achterste knie bijna de grond raakt.',
      'Duw via je voorste hiel omhoog en breng je achterste been naar voren in de volgende stap.',
      'Herhaal en blijf in een rustig ritme doorlopen.',
    ],
    fouten: [
      { fout: 'Voeten op een lijn', beter: 'Loop op heupbreedte, alsof je op twee rails loopt. Zo blijf je in balans.' },
      { fout: 'Steeds sneller gaan', beter: 'Houd elke stap even rustig. Vaart maakt de lunge slordig en zwaar voor je knie.' },
      { fout: 'Te korte passen', beter: 'Maak een flinke stap zodat je onderin twee hoeken van ongeveer 90 graden maakt.' },
    ],
    ademhaling: 'Adem in als je zakt, adem uit als je omhoog duwt.',
    tempo: '2 tellen omlaag, 1 tel omhoog en door naar de volgende stap.',
    makkelijker: 'Doe hem zonder dumbbells en sluit na elke stap je voeten even aan.',
    zwaarder: 'Neem zwaardere dumbbells of houd ze boven je hoofd voor extra werk voor je romp.',
  },

  'Walking lunge met lichaamsgewicht': {
    kernpunten: [
      { punt: 'Handen in je zij', uitleg: 'Zo blijven je armen stil en voel je meteen of je romp rechtop blijft.' },
      { punt: 'Flinke pas vooruit', uitleg: 'Een ruime stap geeft onderin twee hoeken van ongeveer 90 graden en spaart je voorste knie.' },
      { punt: 'Duw via je voorste hiel', uitleg: 'Je voorste been tilt je omhoog en naar voren. Je voelt het in bil en bovenbeen.' },
      { punt: 'Knie niet op de grond', uitleg: 'Stop net boven de vloer met je achterste knie. Niet laten tikken of klappen.' },
    ],
    opstelling: [
      'Zorg voor een vrije baan van minstens 10 meter.',
      'Sta met je voeten op heupbreedte en zet je handen in je zij.',
    ],
    stappen: [
      'Stap een flinke pas naar voren en zak tot je achterste knie bijna de grond raakt.',
      'Duw via je voorste hiel omhoog en breng je achterste been naar voren in de volgende stap.',
      'Herhaal en blijf in een rustig ritme doorlopen.',
    ],
    fouten: [
      { fout: 'Voeten op een lijn', beter: 'Loop op heupbreedte, alsof je op twee rails loopt. Zo blijf je in balans.' },
      { fout: 'Romp valt voorover', beter: 'Borst omhoog en blik vooruit. Zak recht naar beneden in plaats van naar voren.' },
      { fout: 'Steeds sneller gaan', beter: 'Houd elke stap even rustig. Vaart maakt de lunge slordig en zwaar voor je knie.' },
    ],
    ademhaling: 'Adem in als je zakt, adem uit als je omhoog duwt.',
    tempo: '2 tellen omlaag, 1 tel omhoog en door. Elke stap is een herhaling.',
    makkelijker: 'Sluit na elke stap je voeten even aan en zak minder diep.',
    zwaarder: 'Pak een dumbbell in elke hand of loop een langere baan.',
  },

  'Wall sit': {
    kernpunten: [
      { punt: 'Rug plat tegen de muur', uitleg: 'Je hele rug en je achterhoofd raken de muur. Zo houd je je romp stil en je rug neutraal.' },
      { punt: 'Knieen boven je enkels', uitleg: 'Zet je voeten ver genoeg van de muur zodat je knieen recht boven je enkels staan.' },
      { punt: 'Gewicht op je hielen', uitleg: 'Duw je hielen in de grond. Je voelt je bovenbenen branden, niet je knieen.' },
      { punt: 'Handen niet op je benen', uitleg: 'Leg je handen niet op je dijen om te steunen. Laat ze hangen of kruis ze voor je borst.' },
    ],
    opstelling: [
      'Sta met je rug tegen een muur en zet je voeten ongeveer twee voetlengtes naar voren, op heupbreedte.',
      'Leg je armen gekruist voor je borst of laat ze ontspannen langs je lichaam hangen.',
    ],
    stappen: [
      'Glijd langs de muur omlaag tot je knieen ongeveer een rechte hoek maken.',
      'Houd die positie vast voor de afgesproken tijd en adem rustig door.',
      'Schuif langs de muur weer omhoog of zet je handen op je dijen om op te staan.',
    ],
    fouten: [
      { fout: 'Voeten te dicht bij de muur', beter: 'Zet je voeten verder naar voren tot je knieen boven je enkels staan en niet over je tenen.' },
      { fout: 'Knieen vallen naar binnen', beter: 'Duw je knieen licht naar buiten, in lijn met je tenen. Je voeten blijven plat op heupbreedte.' },
      { fout: 'Steunen op je dijen', beter: 'Haal je handen van je benen. Moet je steunen, kies dan een hogere positie.' },
    ],
    ademhaling: 'Adem rustig en regelmatig door, houd je adem niet vast.',
    tempo: 'Statisch vasthouden, bijvoorbeeld 20 tot 45 seconden.',
    makkelijker: 'Zak minder diep, zodat je knieen minder dan een rechte hoek buigen.',
    zwaarder: 'Houd langer vast of leg een schijf op je bovenbenen.',
  },
}
