import type { CoachingBoek } from './typen'

// Uitbreiding van migratie 444, onderlichaam en romp: deadlift- en split
// squatvarianten, leg press zittend, nordic curl, romp, dragen en conditie.
export const COACHING_AANVULLING_ONDER: CoachingBoek = {
  'Trap bar deadlift': {
    kernpunten: [
      { punt: 'Midden in de bar', uitleg: 'Het gewicht hangt naast je, precies boven het midden van je voeten. Zo trek je recht omhoog.' },
      { punt: 'Borst omhoog, rug lang', uitleg: 'Je rug blijft in dezelfde stand van begin tot eind. Kijk een paar meter voor je op de grond.' },
      { punt: 'Duw de vloer weg', uitleg: 'Denk aan duwen met je benen, niet aan trekken met je rug. Heupen en schouders komen samen omhoog.' },
      { punt: 'Bovenin rechtop, klaar', uitleg: 'Billen aan en rechtop staan. Niet achterover leunen en je schouders niet optrekken.' },
    ],
    opstelling: [
      'Stap in de trap bar met je voeten op heupbreedte, het midden van je voet onder de handvatten.',
      'Zak met je heupen naar achteren en omlaag tot je de handvatten met gestrekte armen vastpakt.',
    ],
    stappen: [
      'Adem in, zet je buik vast en trek de speling uit de stang tot hij net niet loskomt.',
      'Duw de vloer weg tot je rechtop staat, knieen en heupen tegelijk gestrekt.',
      'Zet de stang terug door eerst je heupen naar achteren te brengen en daarna je knieen te buigen.',
    ],
    fouten: [
      { fout: 'Heupen schieten eerst omhoog', beter: 'Begin met je borst iets hoger en duw met je benen, zodat heupen en schouders samen stijgen.' },
      { fout: 'Onderrug wordt bol', beter: 'Neem minder gewicht, zet je buik vaster en houd je borst omhoog voor je begint te trekken.' },
      { fout: 'Achterover leunen bovenin', beter: 'Stop als je recht staat met je billen aangespannen. Je schouders blijven boven je heupen.' },
    ],
    ademhaling: 'Adem in en zet je buik vast voor je trekt, adem uit als je bovenin staat of de stang terug staat.',
    tempo: '1 tel omhoog, kort stil, 2 tellen terug naar de grond.',
    makkelijker: 'Gebruik de hoge handvatten als de bar die heeft, of zet de schijven op een verhoging.',
    zwaarder: 'Gebruik de lage handvatten of houd onderin een tel stil net boven de grond.',
  },

  'Sumo deadlift': {
    kernpunten: [
      { punt: 'Knieen naar buiten', uitleg: 'Je knieen volgen je tenen. Zo maak je ruimte voor je romp en blijft de stang dicht bij je.' },
      { punt: 'Schenen bijna verticaal', uitleg: 'De stang staat tegen je schenen en je heupen staan dichter bij de stang dan bij een gewone deadlift.' },
      { punt: 'Borst omhoog, rug lang', uitleg: 'Romp rechter dan bij een gewone deadlift. Je rug blijft de hele beweging in dezelfde stand.' },
      { punt: 'Duw de vloer uit elkaar', uitleg: 'Denk aan je voeten naar buiten duwen terwijl je omhoog komt. Dan werken je billen en binnenkant bovenbeen mee.' },
    ],
    opstelling: [
      'Sta breed met je tenen schuin naar buiten, de stang boven het midden van je voeten.',
      'Pak de stang op schouderbreedte tussen je knieen, armen gestrekt en recht naar beneden.',
    ],
    stappen: [
      'Duw je knieen naar buiten, adem in en zet je buik vast.',
      'Trek de speling uit de stang en duw de vloer weg tot je rechtop staat.',
      'Laat de stang langs je benen zakken: eerst heupen naar achteren, dan knieen buigen.',
    ],
    fouten: [
      { fout: 'Knieen vallen naar binnen', beter: 'Duw je knieen actief naar buiten in de lijn van je tenen. Zet je voeten iets minder breed als dat niet lukt.' },
      { fout: 'Stang los van je benen', beter: 'Houd de stang tegen je schenen en dijen. Trek hem met gestrekte armen naar je toe.' },
      { fout: 'Heupen te laag, als een squat', beter: 'Zak alleen zo ver dat je de stang met gestrekte armen pakt. Het blijft een heupbeweging.' },
    ],
    ademhaling: 'Adem in en zet je buik vast voor elke herhaling, adem uit als je bovenin staat.',
    tempo: '1 tel omhoog, kort stil, 2 tellen terug naar de grond.',
    makkelijker: 'Begin met een kettlebell tussen je voeten in dezelfde brede stand.',
    zwaarder: 'Houd onderin een tel stil net boven de grond voor je weer omhoog komt.',
  },

  'Deadlift met kettlebell': {
    kernpunten: [
      { punt: 'Heupen naar achteren', uitleg: 'Je duwt je billen naar de muur achter je. Je knieen buigen maar een beetje mee.' },
      { punt: 'Rug recht', uitleg: 'Van je hoofd tot je stuit een rechte lijn. Borst open, schouders weg van je oren.' },
      { punt: 'Bel tussen je voeten', uitleg: 'Het gewicht blijft onder je, midden tussen je voeten. Dan hoeft je rug niet te compenseren.' },
      { punt: 'Bovenin billen aan', uitleg: 'Je eindigt rechtop met je billen aangespannen, zonder achterover te leunen.' },
    ],
    opstelling: [
      'Sta met je voeten iets breder dan heupbreedte, de kettlebell tussen je voeten op lijn met je enkels.',
    ],
    stappen: [
      'Duw je heupen naar achteren tot je het handvat met twee handen en gestrekte armen pakt.',
      'Span je buik aan en kom rechtop door je heupen naar voren te brengen.',
      'Zet de kettlebell terug op dezelfde plek met dezelfde heupbeweging.',
    ],
    fouten: [
      { fout: 'Knieen ver naar voren, als een squat', beter: 'Breng je heupen verder naar achteren. Je schenen blijven bijna verticaal.' },
      { fout: 'Ronde rug bij het oppakken', beter: 'Borst naar voren en buik aan voor je optilt. Kom je er niet bij, zet de bel dan op een verhoging.' },
      { fout: 'Trekken met je armen', beter: 'Je armen zijn touwen. Het gewicht komt omhoog doordat je heupen naar voren gaan.' },
    ],
    ademhaling: 'Adem in voor je optilt, adem uit als je rechtop staat.',
    tempo: '1 tel omhoog, kort stil, 2 tellen terug.',
    makkelijker: 'Zet de kettlebell op een step of een paar schijven, zodat je minder diep hoeft.',
    zwaarder: 'Pak een zwaardere kettlebell of doe de oefening op een been.',
  },

  'Pull-through aan de kabel': {
    kernpunten: [
      { punt: 'Heupen naar achteren', uitleg: 'Je duwt je billen naar het toestel toe. Je knieen buigen licht en blijven daarna stil.' },
      { punt: 'Armen zijn touwen', uitleg: 'Je armen hangen lang tussen je benen en trekken niet. Al het werk komt uit je heupen.' },
      { punt: 'Rug recht', uitleg: 'Ook als je voorover hangt blijft je rug lang en je borst open.' },
      { punt: 'Bovenin billen aan', uitleg: 'Eindig rechtop met je billen hard aangespannen, zonder je onderrug hol te trekken.' },
    ],
    opstelling: [
      'Zet de kabel helemaal laag met een touw en sta met je rug naar het toestel.',
      'Pak het touw tussen je benen en stap twee grote passen naar voren, voeten iets breder dan heupbreedte.',
    ],
    stappen: [
      'Laat je heupen naar achteren gaan tot je een rek in je hamstrings voelt, het touw tussen je benen door.',
      'Breng je heupen krachtig naar voren tot je rechtop staat.',
      'Span bovenin je billen aan en laat de kabel gecontroleerd terug.',
    ],
    fouten: [
      { fout: 'Squatten in plaats van scharnieren', beter: 'Houd je schenen bijna verticaal en duw je billen naar achteren in plaats van omlaag.' },
      { fout: 'Trekken met je armen', beter: 'Laat je armen gestrekt hangen. Het touw beweegt alleen doordat je heupen bewegen.' },
      { fout: 'Holle rug bovenin', beter: 'Stop als je recht staat. Ribben laag en billen aan in plaats van je heupen naar voren te duwen.' },
    ],
    ademhaling: 'Adem in als je heupen naar achteren gaan, adem uit als je ze naar voren brengt.',
    tempo: '2 tellen naar achteren, 1 tel naar voren, kort vasthouden.',
    makkelijker: 'Neem minder gewicht en ga minder ver naar achteren.',
    zwaarder: 'Houd bovenin 2 tellen vast en laat de kabel in 3 tellen terug.',
  },

  'Hip thrust met dumbbell': {
    kernpunten: [
      { punt: 'Onderkant schouderbladen op bank', uitleg: 'De rand van de bank ligt net onder je schouderbladen. Dat is het draaipunt van de beweging.' },
      { punt: 'Kin naar je borst', uitleg: 'Je kijkt naar voren, niet naar het plafond. Dan blijven je ribben laag en je onderrug rustig.' },
      { punt: 'Duw door je hielen', uitleg: 'Je voeten staan plat. Duw via je hielen, dan werken je billen en niet je bovenbenen.' },
      { punt: 'Bovenin recht en vast', uitleg: 'Van knie tot schouder een rechte lijn. Houd die een tel vast met je billen aangespannen.' },
    ],
    opstelling: [
      'Zit op de grond met je bovenrug tegen een bank en leg de dumbbell dwars op je heupen.',
      'Zet je voeten op heupbreedte zo dat je schenen bovenin verticaal staan.',
    ],
    stappen: [
      'Houd de dumbbell met twee handen vast en duw je heupen omhoog.',
      'Stop als je lichaam recht is van knie tot schouder en houd kort vast.',
      'Laat je heupen rustig zakken tot je billen net boven de grond zijn.',
    ],
    fouten: [
      { fout: 'Holle rug bovenin', beter: 'Kin naar je borst en ribben omlaag. Je stopt als je recht bent, niet verder.' },
      { fout: 'Voeten te ver weg', beter: 'Zet je voeten dichterbij tot je schenen bovenin recht omhoog staan. Dan voel je je billen meer dan je hamstrings.' },
      { fout: 'Dumbbell rolt weg', beter: 'Leg hem in de plooi van je heupen en houd hem met twee handen vast. Een matje eronder maakt het prettiger.' },
    ],
    ademhaling: 'Adem uit terwijl je je heupen omhoog duwt, adem in als je zakt.',
    tempo: '1 tel omhoog, 1 tel vasthouden, 2 tellen omlaag.',
    makkelijker: 'Doe de beweging zonder gewicht of als glute bridge op de grond.',
    zwaarder: 'Houd bovenin 3 tellen vast of stap over op de hip thrust met barbell.',
  },

  'Split squat met dumbbells': {
    kernpunten: [
      { punt: 'Voeten blijven staan', uitleg: 'Je stapt niet. Je zet je voeten een keer neer en zakt daarna alleen op en neer.' },
      { punt: 'Recht omlaag zakken', uitleg: 'Je heup gaat als een lift omlaag. Achterste knie stopt net boven de grond.' },
      { punt: 'Druk via voorste voet', uitleg: 'Je voorste been doet het werk. Het achterste been helpt alleen met je balans.' },
      { punt: 'Schouders laag', uitleg: 'Laat de dumbbells aan gestrekte armen hangen en trek je schouders niet op.' },
    ],
    opstelling: [
      'Pak een dumbbell in elke hand en zet een grote pas: voorste voet plat, achterste voet op de bal.',
      'Zet je voeten op heupbreedte naast elkaar, alsof je op twee rails staat.',
    ],
    stappen: [
      'Zak recht omlaag tot je achterste knie net boven de grond is.',
      'Duw via je hele voorste voet terug omhoog, zonder je knieen helemaal op slot te zetten.',
      'Doe alle herhalingen op dit been en wissel dan.',
    ],
    fouten: [
      { fout: 'Voeten op een lijn, wiebelen', beter: 'Zet je voeten op heupbreedte naast elkaar. Dat geeft meteen meer balans.' },
      { fout: 'Voorste knie valt naar binnen', beter: 'Houd je knie in de lijn van je tweede en derde teen.' },
      { fout: 'Te kleine pas', beter: 'Zet je voeten verder uit elkaar, zodat je voorste hiel aan de grond blijft als je onderin bent.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit als je omhoog duwt.',
    tempo: '2 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Doe de oefening zonder gewicht en houd je met een hand vast aan een rek.',
    zwaarder: 'Pak zwaardere dumbbells of zet je achterste voet op een bank (Bulgarian split squat).',
  },

  'Split squat': {
    kernpunten: [
      { punt: 'Voeten blijven staan', uitleg: 'Je stapt niet. Je zet je voeten een keer neer en zakt daarna alleen op en neer.' },
      { punt: 'Recht omlaag zakken', uitleg: 'Je heup gaat als een lift omlaag. Achterste knie stopt net boven de grond.' },
      { punt: 'Romp rechtop', uitleg: 'Borst omhoog en buik licht aan. Je schouders blijven boven je heupen.' },
      { punt: 'Gewicht op voorste been', uitleg: 'Duw via je hele voorste voet omhoog. Het achterste been is steun.' },
    ],
    opstelling: [
      'Zet een grote pas: voorste voet plat, achterste voet op de bal, voeten op heupbreedte naast elkaar.',
      'Zet je handen in je zij of houd een rek vast als je balans wiebelt.',
    ],
    stappen: [
      'Zak recht omlaag tot je achterste knie net boven de grond is.',
      'Duw via je voorste voet terug omhoog.',
      'Doe alle herhalingen op dit been en wissel dan.',
    ],
    fouten: [
      { fout: 'Naar voren schuiven bij het zakken', beter: 'Zak recht omlaag. Je voorste knie mag naar voren, maar je heup blijft boven het midden.' },
      { fout: 'Voorste hiel komt los', beter: 'Zet je voeten verder uit elkaar en duw je hiel bewust in de grond.' },
      { fout: 'Romp hangt naar voren', beter: 'Borst omhoog en blik vooruit. Een lichte voorover hoek mag, inzakken niet.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit als je omhoog duwt.',
    tempo: '2 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Zak minder diep en houd je met een hand vast.',
    zwaarder: 'Pak een dumbbell in elke hand of houd onderin 2 tellen stil.',
  },

  'Zijwaartse lunge': {
    kernpunten: [
      { punt: 'Breed opzij stappen', uitleg: 'Een ruime stap geeft ruimte om te zakken. Je voeten wijzen allebei naar voren.' },
      { punt: 'Heupen naar achteren', uitleg: 'Zak alsof je opzij op een stoel gaat zitten. Je knie blijft boven je voet.' },
      { punt: 'Ander been gestrekt', uitleg: 'Het been waar je niet op zakt blijft lang. Daar voel je de binnenkant van je bovenbeen rekken.' },
      { punt: 'Hele voet aan de grond', uitleg: 'Beide voeten blijven plat. Duw je terug via de hiel van je gebogen been.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten bij elkaar en je handen voor je borst.',
    ],
    stappen: [
      'Stap breed opzij en zak door dat been, heupen naar achteren en borst omhoog.',
      'Zak tot je bovenbeen ongeveer horizontaal is of zo ver als lukt met een rechte rug.',
      'Duw jezelf krachtig terug naar het midden en wissel van kant.',
    ],
    fouten: [
      { fout: 'Knie schiet ver voorbij de tenen', beter: 'Breng je heupen verder naar achteren, zodat je gewicht op het midden van je voet en je hiel blijft.' },
      { fout: 'Romp klapt voorover', beter: 'Borst omhoog en blik vooruit. Zak minder diep als dat nodig is.' },
      { fout: 'Hiel komt los van de grond', beter: 'Maak de stap iets kleiner en duw je hele voet in de grond.' },
    ],
    ademhaling: 'Adem in als je opzij zakt, adem uit als je terug duwt.',
    tempo: '2 tellen omlaag, 1 tel terug naar het midden.',
    makkelijker: 'Zak minder diep en houd je vast aan een rek voor je.',
    zwaarder: 'Houd een dumbbell of kettlebell voor je borst.',
  },

  'Nordic hamstring curl': {
    kernpunten: [
      { punt: 'Rechte lijn knie tot hoofd', uitleg: 'Je knikt niet in je heupen. Je hele lichaam valt als een plank naar voren.' },
      { punt: 'Zo langzaam mogelijk', uitleg: 'Het werk zit in het remmen. Rek de weg omlaag zo lang als je kunt.' },
      { punt: 'Billen aan', uitleg: 'Met je billen en buik aangespannen blijft je heup gestrekt en werken je hamstrings.' },
      { punt: 'Vang je op met je handen', uitleg: 'Houd je handen klaar voor je borst en vang jezelf zacht op als je het niet meer houdt.' },
    ],
    opstelling: [
      'Kniel op een mat met je hielen vast onder een rol of een stevige steun, of laat iemand je enkels vasthouden.',
      'Kom rechtop op je knieen, armen gekruist voor je borst of handen klaar om te vangen.',
    ],
    stappen: [
      'Laat je lichaam in een rechte lijn zo langzaam mogelijk naar voren zakken.',
      'Vang je op met je handen zodra je het niet meer kunt remmen.',
      'Duw jezelf met je handen terug omhoog en trek met je hamstrings mee.',
    ],
    fouten: [
      { fout: 'Knikken in de heupen', beter: 'Billen aan en heupen naar voren. Zak dan minder ver tot je de lijn kunt houden.' },
      { fout: 'Te snel vallen', beter: 'Zak minder ver en rem bewust. Een kort, langzaam stuk is beter dan een lange val.' },
      { fout: 'Te veel herhalingen te snel', beter: 'Begin met weinig herhalingen en bouw per week op. Deze oefening is zwaar voor je hamstrings.' },
    ],
    ademhaling: 'Adem rustig uit tijdens het zakken, adem in als je terug omhoog komt.',
    tempo: '3 tot 5 tellen omlaag, terug omhoog met hulp van je handen.',
    makkelijker: 'Gebruik een elastiek om je borst dat aan een rek achter je vastzit en je ondersteunt.',
    zwaarder: 'Rem de hele weg tot de grond en trek jezelf zonder handen terug omhoog.',
  },

  'Leg press zittend': {
    kernpunten: [
      { punt: 'Rug tegen de leuning', uitleg: 'Je onderrug en billen blijven tegen het kussen. Komen ze los, dan ga je te diep.' },
      { punt: 'Voeten midden op de plaat', uitleg: 'Op heupbreedte, tenen licht naar buiten. Je knieen volgen de richting van je tenen.' },
      { punt: 'Druk via je hele voet', uitleg: 'Hielen blijven op de plaat. Dan werken je bovenbenen en billen samen.' },
      { punt: 'Knieen niet op slot', uitleg: 'Strek je benen bijna helemaal, maar houd een kleine buiging aan het eind.' },
    ],
    opstelling: [
      'Stel de leuning of de slede zo in dat je knieen in de beginstand ongeveer een rechte hoek maken.',
      'Zet je voeten op heupbreedte midden op de plaat en pak de handvatten naast de zitting.',
    ],
    stappen: [
      'Duw de plaat weg tot je benen bijna gestrekt zijn.',
      'Laat je knieen gecontroleerd buigen tot ongeveer een rechte hoek, of zo diep als lukt met je rug tegen de leuning.',
      'Duw zonder te stuiteren weer weg.',
    ],
    fouten: [
      { fout: 'Billen komen los van de zitting', beter: 'Buig je knieen minder ver of zet de leuning verder naar achteren.' },
      { fout: 'Knieen vallen naar binnen', beter: 'Duw je knieen in de lijn van je tenen. Zet je voeten iets breder als dat helpt.' },
      { fout: 'Knieen op slot bovenin', beter: 'Stop net voor je benen helemaal gestrekt zijn en ga meteen door naar de volgende herhaling.' },
    ],
    ademhaling: 'Adem in als je knieen buigen, adem uit terwijl je de plaat wegduwt.',
    tempo: '2 tellen terug, kort stil, 1 tel wegduwen.',
    makkelijker: 'Neem minder gewicht en maak de beweging iets kleiner.',
    zwaarder: 'Doe de oefening met een been of houd onderin 2 tellen stil.',
  },

  'Crunch machine': {
    kernpunten: [
      { punt: 'Rol je romp op', uitleg: 'Breng je ribben naar je heupen. Je rug wordt rond, je buik doet het werk.' },
      { punt: 'Armen trekken niet', uitleg: 'Je handen liggen alleen aan de handvatten. De kracht komt uit je buik.' },
      { punt: 'Uitademen bij oprollen', uitleg: 'Blaas je adem uit terwijl je oprolt. Dan span je je buik dieper aan.' },
      { punt: 'Rustig terug', uitleg: 'Laat het gewicht langzaam terugkomen en laat de schijven niet op elkaar vallen.' },
    ],
    opstelling: [
      'Stel de zitting zo in dat de handvatten bij je schouders zitten en zet je voeten onder de rollen.',
    ],
    stappen: [
      'Pak de handvatten en zet je buik vast.',
      'Rol je romp naar voren en omlaag terwijl je uitademt.',
      'Kom gecontroleerd terug tot je bijna rechtop zit.',
    ],
    fouten: [
      { fout: 'Trekken met je armen', beter: 'Ontspan je armen en houd je handen alleen op de handvatten. Neem minder gewicht.' },
      { fout: 'Buigen vanuit de heupen', beter: 'Rol je rug wervel voor wervel op in plaats van als een plank voorover te klappen.' },
      { fout: 'Gewicht valt terug', beter: 'Laat het in 2 tellen terugkomen. De weg terug telt ook.' },
    ],
    ademhaling: 'Adem uit terwijl je oprolt, adem in als je terugkomt.',
    tempo: '1 tel oprollen, kort vasthouden, 2 tellen terug.',
    makkelijker: 'Neem minder gewicht en maak de beweging kleiner.',
    zwaarder: 'Houd onderin 2 tellen vast of doe de cable crunch.',
  },

  'Hollow hold': {
    kernpunten: [
      { punt: 'Onderrug in de mat', uitleg: 'Je onderrug blijft de hele tijd tegen de grond. Dat is belangrijker dan hoe laag je benen zijn.' },
      { punt: 'Ribben omlaag', uitleg: 'Trek je ribben naar je heupen, alsof je je buik platdrukt.' },
      { punt: 'Lang en laag', uitleg: 'Armen naast je oren en benen gestrekt, allebei een stukje van de grond.' },
      { punt: 'Rustig doorademen', uitleg: 'Adem kort en rustig in en uit zonder je buik los te laten.' },
    ],
    opstelling: [
      'Lig op je rug op een mat met je armen boven je hoofd en je benen gestrekt.',
    ],
    stappen: [
      'Druk je onderrug in de mat en span je buik aan.',
      'Til je schouders, armen en benen een stukje op tot je een lichte banaan vormt.',
      'Houd deze houding vast voor de afgesproken tijd en leg daarna alles rustig neer.',
    ],
    fouten: [
      { fout: 'Onderrug komt los', beter: 'Til je benen hoger of buig je knieen tot je onderrug weer tegen de grond ligt.' },
      { fout: 'Nek trekt omhoog', beter: 'Kin licht naar je borst en kijk naar je tenen. De beweging komt uit je buik.' },
      { fout: 'Adem vasthouden', beter: 'Adem kort en rustig door. Lukt dat niet, maak de houding dan lichter.' },
    ],
    ademhaling: 'Blijf rustig doorademen terwijl je je buik aangespannen houdt.',
    tempo: 'Houd 15 tot 30 seconden vast en bouw op.',
    makkelijker: 'Buig je knieen en houd je armen langs je lichaam.',
    zwaarder: 'Houd langer vast of wieg klein heen en weer zonder de houding te verliezen.',
  },

  'Suitcase carry': {
    kernpunten: [
      { punt: 'Niet scheef hangen', uitleg: 'Het gewicht trekt je opzij. Je romp blijft recht, alsof je tussen twee muren loopt.' },
      { punt: 'Schouders recht', uitleg: 'De schouder aan de kant van het gewicht zakt niet en de andere trekt niet op.' },
      { punt: 'Buik aan', uitleg: 'Span je buik rondom aan, vooral aan de kant zonder gewicht.' },
      { punt: 'Rustig doorlopen', uitleg: 'Kleine, rustige passen in een rechte lijn. Niet haasten.' },
    ],
    opstelling: [
      'Zet een kettlebell naast je voet en pak hem op met een rechte rug, zoals bij een deadlift.',
    ],
    stappen: [
      'Kom rechtop met de kettlebell aan een gestrekte arm naast je.',
      'Loop rechtop de afgesproken afstand of tijd.',
      'Zet de kettlebell neer met een rechte rug en wissel van hand.',
    ],
    fouten: [
      { fout: 'Romp buigt naar het gewicht', beter: 'Neem een lichtere kettlebell en duw je hoofd omhoog naar het plafond.' },
      { fout: 'Arm tegen je been geklemd', beter: 'Laat de kettlebell vrij hangen, net naast je been.' },
      { fout: 'Snel en wankel lopen', beter: 'Loop langzamer met kleinere passen en kijk recht vooruit.' },
    ],
    ademhaling: 'Blijf rustig doorademen, kort en hoog, terwijl je buik aangespannen blijft.',
    tempo: 'Rustig wandeltempo, 20 tot 40 meter of 30 seconden per kant.',
    makkelijker: 'Neem een lichtere kettlebell en loop een kortere afstand.',
    zwaarder: 'Pak een zwaardere kettlebell of loop een langere afstand.',
  },

  'Slee duwen': {
    kernpunten: [
      { punt: 'Schuine rechte lijn', uitleg: 'Van je hoofd tot je achterste voet een rechte lijn, schuin naar voren.' },
      { punt: 'Armen gestrekt', uitleg: 'Je armen geven de kracht door. Ze buigen niet en duwen niet zelf.' },
      { punt: 'Korte krachtige passen', uitleg: 'Zet af via je voorvoeten met kleine passen, als bij een sprint omhoog.' },
      { punt: 'Buik vast', uitleg: 'Je onderrug zakt niet door. Span je buik aan zodat de kracht uit je benen in de slee komt.' },
    ],
    opstelling: [
      'Pak de palen van de slee op borsthoogte of lager en stap naar achteren tot je armen gestrekt zijn.',
      'Leun naar voren tot je lichaam schuin staat, een voet voor en een achter.',
    ],
    stappen: [
      'Duw de slee in beweging met een krachtige eerste pas.',
      'Blijf korte, snelle passen maken tot het einde van de baan.',
      'Kom rustig tot stilstand en herstel voor de volgende baan.',
    ],
    fouten: [
      { fout: 'Rechtop duwen', beter: 'Leun verder naar voren en pak de palen lager vast. Dan gaat je kracht naar voren en niet omhoog.' },
      { fout: 'Holle onderrug', beter: 'Span je buik aan en houd je heupen in lijn met je romp.' },
      { fout: 'Grote, trage passen', beter: 'Maak je passen korter en sneller en zet af via je voorvoeten.' },
    ],
    ademhaling: 'Adem krachtig en ritmisch door, niet vasthouden tijdens het duwen.',
    tempo: 'Blokken van 10 tot 20 meter, flink aanzetten, ruim herstel tussendoor.',
    makkelijker: 'Haal gewicht van de slee of duw een kortere afstand.',
    zwaarder: 'Leg meer gewicht op de slee of maak de baan langer.',
  },

  'Wall ball': {
    kernpunten: [
      { punt: 'Kracht uit je benen', uitleg: 'De bal gaat omhoog doordat je uit de squat omhoog schiet. Je armen maken de worp alleen af.' },
      { punt: 'Diepe squat, borst omhoog', uitleg: 'Zak tot je heupen onder je knieen zijn of zo diep als lukt met een rechte rug.' },
      { punt: 'Vang voor je borst', uitleg: 'Vang de bal voor je borst, ellebogen omlaag, en zak meteen door in de volgende squat.' },
      { punt: 'Een vloeiende beweging', uitleg: 'Squat, gooi, vang en zak gaan zonder pauze in elkaar over.' },
    ],
    opstelling: [
      'Sta op ongeveer een armlengte van de muur met je voeten op schouderbreedte.',
      'Houd de medicijnbal met twee handen voor je borst, ellebogen omlaag.',
    ],
    stappen: [
      'Zak in een squat met de bal voor je borst.',
      'Kom krachtig omhoog en gooi de bal in dezelfde beweging naar het doel op de muur.',
      'Vang de bal voor je borst en zak direct door in de volgende squat.',
    ],
    fouten: [
      { fout: 'Gooien met alleen je armen', beter: 'Wacht met gooien tot je benen bijna gestrekt zijn. De worp is het einde van de squat.' },
      { fout: 'Bal boven je hoofd vangen', beter: 'Laat de bal tot borsthoogte zakken voor je hem vangt, dan zak je soepel door.' },
      { fout: 'Te ver van de muur', beter: 'Ga dichter bij de muur staan, zodat de bal recht omlaag terugkomt en je niet naar voren hoeft.' },
    ],
    ademhaling: 'Adem in als je zakt, adem krachtig uit tijdens het gooien.',
    tempo: 'Vloeiend ritme, blokken van 30 tot 60 seconden of een vast aantal herhalingen.',
    makkelijker: 'Neem een lichtere bal en een lager doel op de muur.',
    zwaarder: 'Neem een zwaardere bal of een hoger doel.',
  },
}
