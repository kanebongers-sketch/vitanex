// ─── Coaching: uitbreiding migratie 500, deel A (barbell en dumbbell) ───────
// Opdracht Kane (05-11-2026): "Nog meer oefeningen!". Eigen tekst van Fit
// Factory, zelfde opbouw en regels als de rest (coaching.test.ts).

import type { CoachingBoek } from './typen'

export const COACHING_UITBREIDING_500_A: CoachingBoek = {
  'Pendlay row': {
    kernpunten: [
      { punt: 'Romp horizontaal', uitleg: 'Je romp staat bijna evenwijdig aan de vloer en blijft daar de hele set. Zo werkt je rug en niet je onderrug.' },
      { punt: 'Elke keer vanaf de vloer', uitleg: 'De stang ligt na elke herhaling even stil op de vloer. Je begint telkens opnieuw zonder vaart.' },
      { punt: 'Explosief trekken', uitleg: 'Trek de stang snel naar je onderste ribben. Je ellebogen gaan naar achteren, niet wijd opzij.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte onder de stang, zoals bij een deadlift.',
      'Buig voorover met een lange rug en pak de stang iets breder dan schouderbreedte bovenhands.',
    ],
    stappen: [
      'Span je buik en rug aan zodat je romp stil blijft.',
      'Trek de stang explosief naar je onderste ribben.',
      'Zet de stang gecontroleerd terug op de vloer en laat hem even stil liggen.',
    ],
    fouten: [
      { fout: 'Romp komt mee omhoog', beter: 'Houd je romp horizontaal. Komt hij omhoog, dan is het gewicht te zwaar.' },
      { fout: 'Onderrug wordt bol', beter: 'Borst iets vooruit en heupen naar achteren. Lukt dat niet, pak dan minder gewicht.' },
      { fout: 'Stang stuitert op de vloer', beter: 'Zet hem rustig neer en laat hem stil liggen voordat je opnieuw trekt.' },
    ],
    ademhaling: 'Adem in voor de trek, houd je adem vast tijdens het trekken en adem uit als de stang op de vloer ligt.',
    tempo: 'Explosief omhoog, 1 tot 2 tellen omlaag, kort stil op de vloer.',
    makkelijker: 'Kies de barbell row met de romp iets hoger en zonder elke keer de vloer te raken.',
    zwaarder: 'Houd de stang bovenin een tel vast tegen je ribben.',
  },
  'Z-press': {
    kernpunten: [
      { punt: 'Rechtop zitten', uitleg: 'Je zit recht op je zitbeenderen zonder steun in je rug. Je romp houdt het gewicht stil.' },
      { punt: 'Stang recht omhoog', uitleg: 'De stang gaat in een rechte lijn boven je hoofd. Je hoofd gaat even naar achteren en daarna weer onder de stang.' },
      { punt: 'Niet achterover leunen', uitleg: 'Leun je achterover, dan is het te zwaar. Je ribben blijven laag en je buik aan.' },
    ],
    opstelling: [
      'Zit op de vloer met je benen gestrekt en iets uit elkaar.',
      'Houd de stang op je sleutelbeenderen met je handen iets breder dan je schouders.',
    ],
    stappen: [
      'Span je buik aan en zit zo hoog mogelijk.',
      'Druk de stang recht omhoog tot je armen gestrekt zijn.',
      'Laat de stang gecontroleerd zakken naar je sleutelbeenderen.',
    ],
    fouten: [
      { fout: 'Romp valt naar achteren', beter: 'Kies een lichter gewicht. Je romp moet het kunnen vasthouden.' },
      { fout: 'Knieen buigen om rechtop te blijven', beter: 'Zit iets breder met je benen. Lukt het nog niet, oefen eerst met je benen licht gebogen.' },
    ],
    ademhaling: 'Adem in onderin, houd vast tijdens het drukken en adem uit bovenin.',
    tempo: '1 tel omhoog, 2 tellen omlaag.',
    makkelijker: 'Gebruik twee lichte dumbbells of zit met licht gebogen knieen.',
    zwaarder: 'Houd de stang bovenin 2 tellen vast met gestrekte armen.',
  },
  'Push press': {
    kernpunten: [
      { punt: 'Korte dip, rechte romp', uitleg: 'Zak een klein stukje recht omlaag door je knieen. Je romp blijft rechtop, je zakt niet voorover.' },
      { punt: 'Benen geven de vaart', uitleg: 'Duw je krachtig omhoog vanuit je benen. Die vaart brengt de stang voorbij je hoofd.' },
      { punt: 'Armen maken het af', uitleg: 'Druk de stang daarna uit tot gestrekte armen. Bovenin staat hij boven je achterhoofd.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte en de stang op je schouders voor je hals.',
      'Pak de stang net buiten je schouders met je ellebogen iets voor de stang.',
    ],
    stappen: [
      'Zak snel een klein stukje door je knieen met je gewicht op je hele voet.',
      'Duw je explosief omhoog en druk de stang tegelijk boven je hoofd.',
      'Laat de stang gecontroleerd zakken naar je schouders en vang hem op met licht gebogen knieen.',
    ],
    fouten: [
      { fout: 'Te diepe dip', beter: 'De dip is kort, ongeveer een kwart squat. Dieper kost vaart.' },
      { fout: 'Voorover zakken in de dip', beter: 'Houd je romp rechtop en je gewicht midden op je voet.' },
      { fout: 'Holle rug bovenin', beter: 'Billen en buik aan. De stang staat boven je hoofd, niet erachter.' },
    ],
    ademhaling: 'Adem in voor de dip, houd vast tijdens het omhoog duwen en adem uit bovenin.',
    tempo: 'Snelle dip, explosief omhoog, 2 tellen omlaag.',
    makkelijker: 'Begin met de overhead press om de beweging van je armen te leren.',
    zwaarder: 'Kies meer gewicht dan bij de overhead press, je benen helpen mee.',
  },
  'Zercher squat': {
    kernpunten: [
      { punt: 'Borst omhoog', uitleg: 'De stang hangt voor je lichaam en trekt je naar voren. Houd je borst hoog, dan blijft je rug recht.' },
      { punt: 'Ellebogen hoog en vast', uitleg: 'Je handen blijven bij elkaar en je ellebogen dicht bij je romp. De stang ligt stil in je armen.' },
      { punt: 'Diep en gecontroleerd', uitleg: 'Zak zo diep als je kunt met een rechte rug. Je knieen gaan mee over je tenen.' },
    ],
    opstelling: [
      'Zet de stang in een rek op buikhoogte en leg hem in je elleboogplooien.',
      'Sta met je voeten iets breder dan je heupen en je tenen licht naar buiten.',
    ],
    stappen: [
      'Span je buik aan en til de stang uit het rek.',
      'Zak in een squat met je borst omhoog tot je dijen minstens evenwijdig zijn aan de vloer.',
      'Duw jezelf krachtig omhoog tot je rechtop staat.',
    ],
    fouten: [
      { fout: 'Rug wordt bol', beter: 'Borst omhoog en ellebogen hoog. Kies minder gewicht als het niet lukt.' },
      { fout: 'Stang zakt in de armen', beter: 'Houd je handen bij elkaar en knijp je armen samen.' },
    ],
    ademhaling: 'Adem in voor je zakt, houd vast in de squat en adem uit bovenin.',
    tempo: '2 tellen omlaag, 1 tel omhoog.',
    makkelijker: 'Kies de goblet squat met een dumbbell tegen je borst.',
    zwaarder: 'Houd onderin 2 tellen stil voordat je omhoog komt.',
  },
  'Box squat met barbell': {
    kernpunten: [
      { punt: 'Heupen naar achteren', uitleg: 'Je zit naar achteren op de bank, zoals op een stoel. Je schenen blijven bijna rechtop.' },
      { punt: 'Raak de bank rustig', uitleg: 'Zit kort en gespannen op de bank. Niet ploffen en niet ontspannen.' },
      { punt: 'Duw vanuit je hielen', uitleg: 'Kom omhoog zonder te schommelen. De kracht komt uit je heupen en benen.' },
    ],
    opstelling: [
      'Zet een bank achter je zodat je dijen er net evenwijdig aan de vloer op zitten.',
      'Leg de stang op je bovenrug en sta met je voeten iets breder dan je heupen.',
    ],
    stappen: [
      'Span je buik aan en duw je heupen naar achteren.',
      'Zak tot je kort en gespannen op de bank zit.',
      'Duw jezelf vanuit je hielen omhoog tot je rechtop staat.',
    ],
    fouten: [
      { fout: 'Ploffen op de bank', beter: 'Zak gecontroleerd en raak de bank zacht. Blijf gespannen zitten.' },
      { fout: 'Schommelen om omhoog te komen', beter: 'Je romp blijft in dezelfde hoek. Kom omhoog zonder naar achteren te leunen.' },
    ],
    ademhaling: 'Adem in voor je zakt, houd vast op de bank en adem uit bovenin.',
    tempo: '2 tellen omlaag, 1 tel zitten, 1 tel omhoog.',
    makkelijker: 'Kies een hogere bank of de squat naar een bank zonder stang.',
    zwaarder: 'Kies een lagere bank of zit 2 tellen gespannen stil.',
  },
  'Floor press met barbell': {
    kernpunten: [
      { punt: 'Bovenarmen rustig neer', uitleg: 'Je bovenarmen raken onderin de vloer. Leg ze zacht neer en houd kort stil.' },
      { punt: 'Ellebogen schuin', uitleg: 'Je ellebogen staan ongeveer 45 graden van je romp. Zo blijven je schouders veilig.' },
      { punt: 'Druk vanuit stilstand', uitleg: 'Na de korte stop druk je de stang zonder vaart terug omhoog.' },
    ],
    opstelling: [
      'Lig op de vloer met je knieen gebogen en je voeten plat.',
      'Laat iemand de stang aangeven of til hem vanuit een laag rek boven je borst.',
    ],
    stappen: [
      'Laat de stang zakken tot je bovenarmen de vloer raken.',
      'Houd kort stil met je armen ontspannen op de vloer.',
      'Druk de stang recht omhoog tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Ellebogen stuiten op de vloer', beter: 'Leg je armen zacht neer en wacht een tel voordat je drukt.' },
      { fout: 'Ellebogen wijd opzij', beter: 'Houd je ellebogen schuin naast je romp, niet in een rechte lijn met je schouders.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en adem uit tijdens het drukken.',
    tempo: '2 tellen omlaag, 1 tel stil, 1 tel omhoog.',
    makkelijker: 'Kies de floor press met dumbbells.',
    zwaarder: 'Houd onderin 2 tellen stil op de vloer.',
  },
  'JM press': {
    kernpunten: [
      { punt: 'Smalle greep', uitleg: 'Je handen staan ongeveer op schouderbreedte. Zo gaat het werk naar je triceps.' },
      { punt: 'Ellebogen schuiven naar voren', uitleg: 'Tijdens het zakken gaan je ellebogen richting je voeten. De stang zakt naar je kin.' },
      { punt: 'Licht en rustig', uitleg: 'Dit is zwaar voor je ellebogen. Kies een gewicht waarmee je elke herhaling rustig blijft.' },
    ],
    opstelling: [
      'Lig op een vlakke bank met je voeten plat op de vloer.',
      'Houd de stang boven je borst met je handen op schouderbreedte.',
    ],
    stappen: [
      'Laat de stang zakken richting je kin terwijl je ellebogen naar voren schuiven.',
      'Stop als je onderarmen bijna tegen je bovenarmen komen.',
      'Druk de stang terug omhoog boven je borst.',
    ],
    fouten: [
      { fout: 'Ellebogen wijken opzij', beter: 'Houd je ellebogen onder de stang en wijzend naar je voeten.' },
      { fout: 'Te zwaar gewicht', beter: 'Kies minder gewicht. Je ellebogen moeten zich prettig blijven voelen.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en adem uit tijdens het drukken.',
    tempo: '2 tellen omlaag, 1 tel omhoog.',
    makkelijker: 'Kies het bankdrukken met smalle greep.',
    zwaarder: 'Zak 3 tellen en houd onderin een tel stil.',
  },
  'Drag curl met barbell': {
    kernpunten: [
      { punt: 'Stang tegen je lichaam', uitleg: 'De stang schuift langs je buik omhoog. Hij komt nooit van je lichaam af.' },
      { punt: 'Ellebogen naar achteren', uitleg: 'Je ellebogen gaan naar achteren terwijl je curlt. Zo blijft de spanning op je biceps.' },
      { punt: 'Rustig omlaag', uitleg: 'Laat de stang langs dezelfde weg rustig zakken.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten op heupbreedte.',
      'Pak de stang onderhands op schouderbreedte, de stang tegen je bovenbenen.',
    ],
    stappen: [
      'Trek de stang langs je lichaam omhoog terwijl je ellebogen naar achteren gaan.',
      'Stop als de stang op borsthoogte is en span kort aan.',
      'Laat de stang langs je lichaam rustig zakken.',
    ],
    fouten: [
      { fout: 'Stang komt los van je lichaam', beter: 'Houd hem tegen je buik. Gaat hij naar voren, dan is het een gewone curl.' },
      { fout: 'Schouders trekken omhoog', beter: 'Schouders laag. Alleen je ellebogen gaan naar achteren.' },
    ],
    ademhaling: 'Adem uit tijdens het omhoog trekken en adem in tijdens het zakken.',
    tempo: '1 tel omhoog, 2 tellen omlaag.',
    makkelijker: 'Kies een lege stang of een EZ-stang.',
    zwaarder: 'Houd bovenin 2 tellen vast.',
  },
  'Reverse curl met EZ-stang': {
    kernpunten: [
      { punt: 'Bovenhandse greep', uitleg: 'Je handpalmen wijzen naar beneden. Zo werken je onderarmen extra mee.' },
      { punt: 'Polsen recht', uitleg: 'Je polsen blijven in lijn met je onderarmen. Laat ze niet knikken.' },
      { punt: 'Ellebogen tegen je zij', uitleg: 'Alleen je onderarmen bewegen. Je ellebogen blijven op hun plek.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten op heupbreedte.',
      'Pak de EZ-stang bovenhands op schouderbreedte aan de schuine stukken.',
    ],
    stappen: [
      'Curl de stang omhoog tot je onderarmen bijna verticaal staan.',
      'Span kort aan en houd je polsen recht.',
      'Laat de stang rustig zakken tot je armen bijna gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Polsen knikken naar achteren', beter: 'Houd je knokkels in lijn met je onderarm. Kies minder gewicht.' },
      { fout: 'Zwaaien met de romp', beter: 'Blijf stil staan. Het gewicht is lichter dan bij een gewone curl.' },
    ],
    ademhaling: 'Adem uit tijdens het omhoog curlen en adem in tijdens het zakken.',
    tempo: '1 tel omhoog, 2 tellen omlaag.',
    makkelijker: 'Gebruik een lege stang of lichte dumbbells.',
    zwaarder: 'Zak 3 tellen en houd halverwege kort stil.',
  },
  'Polscurl met barbell': {
    kernpunten: [
      { punt: 'Onderarmen blijven liggen', uitleg: 'Je onderarmen liggen op je bovenbenen. Alleen je polsen bewegen.' },
      { punt: 'Volle lengte', uitleg: 'Laat de stang naar je vingers rollen en krul hem helemaal op.' },
      { punt: 'Licht gewicht', uitleg: 'Je onderarmen zijn kleine spieren. Kies een gewicht waarmee je 15 rustige herhalingen haalt.' },
    ],
    opstelling: [
      'Zit op een bank met je voeten plat op de vloer.',
      'Leg je onderarmen op je bovenbenen met je handen onderhands over je knieen.',
    ],
    stappen: [
      'Laat de stang rustig naar je vingers rollen.',
      'Krul de stang met je vingers en polsen zo hoog mogelijk op.',
      'Laat hem weer rustig zakken.',
    ],
    fouten: [
      { fout: 'Onderarmen komen omhoog', beter: 'Houd je onderarmen plat op je benen. Alleen je polsen werken.' },
      { fout: 'Te snel en te klein', beter: 'Gebruik de hele beweging en ga rustig.' },
    ],
    ademhaling: 'Adem rustig door, uit tijdens het opkrullen.',
    tempo: '1 tel omhoog, 2 tellen omlaag.',
    makkelijker: 'Gebruik een lichte dumbbell per hand.',
    zwaarder: 'Houd bovenin 2 tellen vast.',
  },
  'Squeeze press met dumbbells': {
    kernpunten: [
      { punt: 'Druk de dumbbells samen', uitleg: 'Je duwt de dumbbells de hele beweging tegen elkaar. Dat maakt de borst actief.' },
      { punt: 'Ellebogen dicht bij je romp', uitleg: 'Je ellebogen blijven dicht langs je lichaam. Zo blijven je schouders veilig.' },
      { punt: 'Gecontroleerd zakken', uitleg: 'Laat de dumbbells samen naar je borst zakken zonder dat ze uit elkaar gaan.' },
    ],
    opstelling: [
      'Lig op een vlakke bank met je voeten plat op de vloer.',
      'Houd twee dumbbells met je handpalmen naar elkaar tegen elkaar boven je borst.',
    ],
    stappen: [
      'Druk de dumbbells stevig tegen elkaar.',
      'Laat ze samen zakken tot ze je borst bijna raken.',
      'Druk ze weer omhoog zonder de druk los te laten.',
    ],
    fouten: [
      { fout: 'Dumbbells gaan uit elkaar', beter: 'Blijf ze tegen elkaar duwen. Kies lichtere dumbbells als dat niet lukt.' },
      { fout: 'Ellebogen wijd opzij', beter: 'Houd je ellebogen dicht bij je romp.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en adem uit tijdens het drukken.',
    tempo: '2 tellen omlaag, 1 tel omhoog.',
    makkelijker: 'Kies lichtere dumbbells of doe het op de vloer.',
    zwaarder: 'Houd onderin 2 tellen vast met de dumbbells tegen elkaar.',
  },
  'Floor press met dumbbells': {
    kernpunten: [
      { punt: 'Bovenarmen rustig neer', uitleg: 'Je bovenarmen raken onderin de vloer. Leg ze zacht neer, niet laten stuiten.' },
      { punt: 'Ellebogen schuin', uitleg: 'Je ellebogen staan ongeveer 45 graden van je romp.' },
      { punt: 'Polsen boven je ellebogen', uitleg: 'De dumbbells staan recht boven je ellebogen. Zo duw je in een rechte lijn.' },
    ],
    opstelling: [
      'Lig op de vloer met je knieen gebogen en je voeten plat.',
      'Houd een dumbbell in elke hand boven je borst met gestrekte armen.',
    ],
    stappen: [
      'Laat de dumbbells zakken tot je bovenarmen de vloer raken.',
      'Houd kort stil.',
      'Druk de dumbbells weer omhoog tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Ellebogen stuiten op de vloer', beter: 'Leg je armen zacht neer en wacht een tel.' },
      { fout: 'Dumbbells kantelen naar buiten', beter: 'Houd je polsen recht boven je ellebogen.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en adem uit tijdens het drukken.',
    tempo: '2 tellen omlaag, 1 tel stil, 1 tel omhoog.',
    makkelijker: 'Kies lichtere dumbbells.',
    zwaarder: 'Houd onderin 2 tellen stil op de vloer.',
  },
  'Tate press': {
    kernpunten: [
      { punt: 'Bovenarmen stil', uitleg: 'Je bovenarmen blijven op hun plek boven je borst. Alleen je ellebogen buigen.' },
      { punt: 'Ellebogen opzij', uitleg: 'Je ellebogen wijzen naar buiten en de dumbbells kantelen naar binnen naar je borst.' },
      { punt: 'Licht gewicht', uitleg: 'Kies lichte dumbbells. De beweging is klein en gericht op je triceps.' },
    ],
    opstelling: [
      'Lig op een vlakke bank met je voeten plat op de vloer.',
      'Houd twee dumbbells boven je borst met je handpalmen naar je voeten.',
    ],
    stappen: [
      'Buig je ellebogen opzij zodat de dumbbells naar binnen kantelen.',
      'Laat de koppen zacht op je borst komen.',
      'Strek je armen weer tot de dumbbells boven je borst staan.',
    ],
    fouten: [
      { fout: 'Bovenarmen zakken mee', beter: 'Houd je bovenarmen stil. Het is geen bankdrukken.' },
      { fout: 'Dumbbells vallen op je borst', beter: 'Laat ze rustig zakken. Kies lichtere dumbbells.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en adem uit tijdens het strekken.',
    tempo: '2 tellen omlaag, 1 tel omhoog.',
    makkelijker: 'Kies de triceps extension liggend met dumbbell.',
    zwaarder: 'Zak 3 tellen en houd onderin een tel stil.',
  },
  'Zottman curl': {
    kernpunten: [
      { punt: 'Omhoog onderhands', uitleg: 'Je curlt de dumbbells omhoog met je handpalmen naar boven, zoals een gewone curl.' },
      { punt: 'Bovenin omdraaien', uitleg: 'Bovenin draai je je handen om naar bovenhands. Zo zak je naar beneden.' },
      { punt: 'Langzaam omlaag', uitleg: 'De weg omlaag duurt 3 tellen. Dan werken je onderarmen hard.' },
    ],
    opstelling: [
      'Sta rechtop met een dumbbell in elke hand en je armen langs je lichaam.',
      'Houd je ellebogen tegen je zij en je handpalmen naar voren.',
    ],
    stappen: [
      'Curl de dumbbells onderhands omhoog naar je schouders.',
      'Draai je handen bovenin om tot je handpalmen naar beneden wijzen.',
      'Laat de dumbbells langzaam zakken en draai onderin terug.',
    ],
    fouten: [
      { fout: 'Ellebogen gaan naar voren', beter: 'Houd je ellebogen tegen je zij. Alleen je onderarmen bewegen.' },
      { fout: 'Te snel omlaag', beter: 'Tel 3 tellen op de weg omlaag. Kies lichtere dumbbells.' },
    ],
    ademhaling: 'Adem uit tijdens het omhoog curlen en adem in tijdens het zakken.',
    tempo: '1 tel omhoog, omdraaien, 3 tellen omlaag.',
    makkelijker: 'Kies lichtere dumbbells of doe een arm tegelijk.',
    zwaarder: 'Zak 4 tellen en houd onderin een tel stil.',
  },
  'Spider curl': {
    kernpunten: [
      { punt: 'Armen hangen loodrecht', uitleg: 'Je bovenarmen hangen recht naar beneden en blijven stil. Zo kun je niet zwaaien.' },
      { punt: 'Bovenin aanspannen', uitleg: 'Span bovenin kort aan. Daar is de spanning op je biceps het grootst.' },
      { punt: 'Volle lengte', uitleg: 'Laat je armen onderin bijna helemaal strekken voordat je opnieuw curlt.' },
    ],
    opstelling: [
      'Zet een bank schuin en lig met je buik ertegen, je borst net boven de bovenrand.',
      'Laat je armen met een dumbbell in elke hand recht naar beneden hangen.',
    ],
    stappen: [
      'Curl de dumbbells omhoog zonder je ellebogen te bewegen.',
      'Span bovenin kort aan.',
      'Laat de dumbbells rustig zakken tot je armen bijna gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Ellebogen schuiven naar voren', beter: 'Houd je bovenarmen loodrecht. Alleen je onderarmen bewegen.' },
      { fout: 'Romp komt los van de bank', beter: 'Blijf met je borst op de bank liggen.' },
    ],
    ademhaling: 'Adem uit tijdens het omhoog curlen en adem in tijdens het zakken.',
    tempo: '1 tel omhoog, 1 tel vast, 2 tellen omlaag.',
    makkelijker: 'Kies lichtere dumbbells.',
    zwaarder: 'Houd bovenin 2 tellen vast.',
  },
  'Y-raise op een schuine bank': {
    kernpunten: [
      { punt: 'Duimen omhoog', uitleg: 'Je duimen wijzen naar het plafond. Zo heeft je schouder de meeste ruimte.' },
      { punt: 'Schouders laag', uitleg: 'Trek je schouders niet op naar je oren. Het werk zit tussen en onder je schouderbladen.' },
      { punt: 'Heel licht gewicht', uitleg: 'Je werkt met kleine spieren. Begin met de lichtste dumbbells of zonder gewicht.' },
    ],
    opstelling: [
      'Zet een bank schuin en lig met je buik ertegen.',
      'Laat je armen met lichte dumbbells onder je schouders hangen, duimen naar voren.',
    ],
    stappen: [
      'Til je gestrekte armen schuin omhoog in een Y.',
      'Stop als je armen in lijn zijn met je romp en houd kort vast.',
      'Laat je armen rustig zakken.',
    ],
    fouten: [
      { fout: 'Schouders trekken op', beter: 'Duw je schouders omlaag voordat je begint. Kies lichter gewicht.' },
      { fout: 'Zwaaien met de armen', beter: 'Ga langzaam en houd bovenin een tel vast.' },
    ],
    ademhaling: 'Adem uit tijdens het optillen en adem in tijdens het zakken.',
    tempo: '2 tellen omhoog, 1 tel vast, 2 tellen omlaag.',
    makkelijker: 'Doe het zonder gewicht.',
    zwaarder: 'Houd bovenin 3 tellen vast.',
  },
  'Renegade row': {
    kernpunten: [
      { punt: 'Heupen recht', uitleg: 'Je heupen blijven recht naar de vloer gericht. Ze draaien niet open als je trekt.' },
      { punt: 'Voeten breed', uitleg: 'Met je voeten breed sta je stabieler. Hoe dichter bij elkaar, hoe zwaarder.' },
      { punt: 'Elleboog langs je zij', uitleg: 'Trek de dumbbell naar je heup met je elleboog dicht langs je lichaam.' },
    ],
    opstelling: [
      'Zet twee dumbbells op schouderbreedte op de vloer en pak de handvatten.',
      'Sta in een hoge plank met gestrekte armen en je voeten breed.',
    ],
    stappen: [
      'Span je buik en billen aan zodat je lichaam een rechte lijn is.',
      'Trek een dumbbell naar je heup zonder je heupen te draaien.',
      'Zet hem rustig neer en doe hetzelfde met de andere arm.',
    ],
    fouten: [
      { fout: 'Heupen draaien open', beter: 'Zet je voeten breder en kies lichtere dumbbells.' },
      { fout: 'Heupen zakken door', beter: 'Billen aan en buik vast. Je lichaam blijft een plank.' },
    ],
    ademhaling: 'Adem uit tijdens het trekken en adem in als je de dumbbell neerzet.',
    tempo: '1 tel omhoog, 2 tellen omlaag, dan de andere kant.',
    makkelijker: 'Doe het vanaf je knieen of zonder gewicht als plank met schouder tikken.',
    zwaarder: 'Zet je voeten dichter bij elkaar.',
  },
  'Roemeense deadlift op een been met dumbbell': {
    kernpunten: [
      { punt: 'Heupen recht', uitleg: 'Je heupen blijven recht naar de vloer gericht. De heup van je vrije been draait niet open.' },
      { punt: 'Lange lijn', uitleg: 'Je romp en je vrije been vormen samen een rechte lijn, zoals een wip.' },
      { punt: 'Standbeen licht gebogen', uitleg: 'Je standbeen is licht gebogen en blijft in die hoek. Je voelt het achter in je bovenbeen.' },
    ],
    opstelling: [
      'Sta op een been met een dumbbell in de hand aan de andere kant.',
      'Buig je standbeen licht en span je buik aan.',
    ],
    stappen: [
      'Scharnier voorover vanuit je heup terwijl je vrije been gestrekt naar achteren gaat.',
      'Zak tot je romp bijna horizontaal is of je de rek in je hamstring voelt.',
      'Kom terug omhoog door je heup naar voren te duwen.',
    ],
    fouten: [
      { fout: 'Heup draait open', beter: 'Wijs met de tenen van je vrije been naar de vloer. Dan blijven je heupen recht.' },
      { fout: 'Rug wordt bol', beter: 'Borst iets vooruit en zak minder diep.' },
      { fout: 'Wiebelen', beter: 'Kijk naar een vast punt op de vloer en ga langzamer.' },
    ],
    ademhaling: 'Adem in tijdens het voorover gaan en adem uit tijdens het omhoog komen.',
    tempo: '2 tellen omlaag, 1 tel omhoog.',
    makkelijker: 'Houd je vrije hand tegen een muur of doe het zonder gewicht.',
    zwaarder: 'Neem een dumbbell in elke hand of houd onderin 2 tellen stil.',
  },
  'Split squat met voorvoet verhoogd': {
    kernpunten: [
      { punt: 'Recht omlaag', uitleg: 'Je zakt recht naar beneden tussen je voeten. Je romp blijft rechtop.' },
      { punt: 'Knie mag over je tenen', uitleg: 'Je voorste knie gaat naar voren over je tenen. Dat hoort bij deze oefening.' },
      { punt: 'Duw door je voorste voet', uitleg: 'Je voorste been doet het werk. Je achterste voet steunt alleen.' },
    ],
    opstelling: [
      'Zet je voorste voet op een lage verhoging en je achterste voet een grote stap naar achteren.',
      'Houd een dumbbell in elke hand langs je lichaam.',
    ],
    stappen: [
      'Zak recht omlaag tot je achterste knie bijna de vloer raakt.',
      'Duw jezelf door je voorste voet terug omhoog.',
      'Doe alle herhalingen en wissel dan van been.',
    ],
    fouten: [
      { fout: 'Voorste knie zakt naar binnen', beter: 'Houd je knie boven je voet. Kies lichtere dumbbells.' },
      { fout: 'Voorover leunen', beter: 'Romp rechtop en kijk vooruit.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en adem uit tijdens het omhoog komen.',
    tempo: '2 tellen omlaag, 1 tel omhoog.',
    makkelijker: 'Doe het zonder dumbbells of zonder verhoging.',
    zwaarder: 'Houd onderin 2 tellen stil.',
  },
  'Dumbbell snatch': {
    kernpunten: [
      { punt: 'Kracht uit je heupen', uitleg: 'Je heupen strekken explosief en geven de dumbbell zijn vaart. Je arm stuurt alleen.' },
      { punt: 'Dicht langs je lichaam', uitleg: 'De dumbbell gaat in een rechte lijn dicht langs je lichaam omhoog.' },
      { punt: 'Bovenin stil', uitleg: 'Je arm staat bovenin gestrekt en stil boven je schouder voordat je weer zakt.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte en een dumbbell tussen je voeten.',
      'Buig door je heupen en knieen en pak de dumbbell met een hand.',
    ],
    stappen: [
      'Strek je heupen en knieen explosief en trek de dumbbell langs je lichaam omhoog.',
      'Duw hem in een beweging door tot je arm gestrekt boven je hoofd staat.',
      'Laat hem gecontroleerd zakken naar je schouder en dan naar de vloer.',
    ],
    fouten: [
      { fout: 'Alleen met de arm tillen', beter: 'Laat je heupen het werk doen. Je arm volgt de vaart.' },
      { fout: 'Dumbbell zwaait naar voren', beter: 'Houd hem dicht bij je lichaam, alsof je je jas dichtritst.' },
    ],
    ademhaling: 'Adem in voor de trek, houd vast tijdens het omhoog gaan en adem uit bovenin.',
    tempo: 'Explosief omhoog, 2 tellen terug.',
    makkelijker: 'Kies de eenarmige kettlebell swing om de heupbeweging te leren.',
    zwaarder: 'Kies een zwaardere dumbbell met dezelfde nette uitvoering.',
  },
}
