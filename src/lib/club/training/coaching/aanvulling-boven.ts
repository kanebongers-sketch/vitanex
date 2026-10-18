import type { CoachingBoek } from './typen'

// Uitbreiding van migratie 444, bovenlichaam: push-up en bankdrukvarianten,
// dips, rows, pulldowns, armen en schouders.
export const COACHING_AANVULLING_BOVEN: CoachingBoek = {
  'Push-up met handen verhoogd': {
    kernpunten: [
      { punt: 'Lichaam een plank', uitleg: 'Van je hoofd tot je hielen een rechte lijn. Buik en billen aan, heupen zakken niet.' },
      { punt: 'Handen onder je schouders', uitleg: 'Iets breder dan schouderbreedte op de rand, vingers naar voren.' },
      { punt: 'Ellebogen schuin naar achteren', uitleg: 'Ongeveer 45 graden van je lichaam, niet wijd naar buiten. Dat houdt je schouders rustig.' },
      { punt: 'Borst naar de rand', uitleg: 'Zak tot je borst bijna de bank raakt en duw de bank daarna van je af.' },
    ],
    opstelling: [
      'Zet je handen op een bank, box of rek in de smith machine en loop met je voeten naar achteren.',
      'Hoe hoger je handen, hoe lichter. Kies een hoogte waarop je alle herhalingen netjes haalt.',
    ],
    stappen: [
      'Span je buik en billen aan.',
      'Zak gecontroleerd tot je borst bijna de rand raakt.',
      'Duw jezelf terug tot je armen gestrekt zijn, lichaam nog steeds recht.',
    ],
    fouten: [
      { fout: 'Heupen zakken door', beter: 'Span je billen harder aan en trek je navel in. Kies een hogere steun als het blijft zakken.' },
      { fout: 'Ellebogen wijd naar buiten', beter: 'Draai je ellebogen schuin naar achteren, richting je heupen.' },
      { fout: 'Hoofd zakt naar voren', beter: 'Kijk schuin naar beneden voor je handen. Je borst raakt eerst de rand, niet je kin.' },
    ],
    ademhaling: 'Adem in als je zakt, adem uit als je jezelf terug duwt.',
    tempo: '2 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Zet je handen hoger, bijvoorbeeld tegen een muur.',
    zwaarder: 'Zet je handen lager tot je de gewone push-up op de grond haalt.',
  },

  'Schuin bankdrukken in de smith machine': {
    kernpunten: [
      { punt: 'Stang boven bovenste borst', uitleg: 'Zet de bank zo neer dat de stang net onder je sleutelbeen uitkomt. Dan werkt vooral je bovenste borst.' },
      { punt: 'Schouderbladen in de bank', uitleg: 'Trek ze naar achteren en omlaag. Zo heb je een stevige basis en blijven je schouders rustig.' },
      { punt: 'Ellebogen onder de stang', uitleg: 'Je onderarmen staan verticaal, ellebogen iets onder schouderhoogte.' },
      { punt: 'Gecontroleerd zakken', uitleg: 'Laat de stang rustig tot je borst zakken en druk hem daarna weer omhoog.' },
    ],
    opstelling: [
      'Zet een bank op 30 tot 45 graden onder de stang en ga zitten met je rug en hoofd tegen de leuning.',
      'Pak de stang iets breder dan schouderbreedte en zet je voeten plat op de grond.',
    ],
    stappen: [
      'Draai de stang los uit de haken en houd hem met gestrekte armen boven je borst.',
      'Laat hem zakken tot hij je bovenste borst bijna raakt.',
      'Druk de stang omhoog tot je armen gestrekt zijn en draai hem na de laatste herhaling terug in de haken.',
    ],
    fouten: [
      { fout: 'Stang zakt naar je nek', beter: 'Schuif de bank op tot de stang boven je bovenste borst uitkomt.' },
      { fout: 'Schouders schuiven naar voren', beter: 'Houd je schouderbladen naar achteren getrokken, ook bovenin.' },
      { fout: 'Billen komen van de bank', beter: 'Houd je billen op de bank en je voeten plat. Neem minder gewicht als het niet lukt.' },
    ],
    ademhaling: 'Adem in en zet je buik vast voor je laat zakken, adem uit terwijl je drukt.',
    tempo: '2 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Neem minder gewicht of zet de bank minder schuin.',
    zwaarder: 'Houd onderin een tel stil net boven je borst.',
  },

  'Arnold press': {
    kernpunten: [
      { punt: 'Draai tijdens het drukken', uitleg: 'Je handpalmen draaien van naar je toe naar voren terwijl de dumbbells omhoog gaan.' },
      { punt: 'Rug tegen de leuning', uitleg: 'Je bovenrug en billen blijven tegen de bank. Zo duw je met je schouders en niet met je rug.' },
      { punt: 'Ribben laag', uitleg: 'Span je buik aan zodat je geen holle rug trekt als je armen boven je hoofd gaan.' },
      { punt: 'Licht beginnen', uitleg: 'Door de draai is dit zwaarder dan een gewone press. Kies een gewicht dat je netjes beheerst.' },
    ],
    opstelling: [
      'Zet de leuning bijna rechtop en ga zitten met je voeten plat op de grond.',
      'Houd de dumbbells voor je schouders met je handpalmen naar je toe, ellebogen voor je lichaam.',
    ],
    stappen: [
      'Druk de dumbbells omhoog en draai tegelijk je handpalmen naar voren.',
      'Eindig met gestrekte armen boven je schouders.',
      'Laat de dumbbells zakken en draai je handen terug naar de beginstand.',
    ],
    fouten: [
      { fout: 'Holle rug', beter: 'Druk je rug tegen de leuning en ribben omlaag. Zet de leuning meer rechtop of neem minder gewicht.' },
      { fout: 'Eerst draaien, dan drukken', beter: 'Maak er een vloeiende beweging van: draaien en drukken gebeuren tegelijk.' },
      { fout: 'Dumbbells tikken bovenin', beter: 'Stop met de dumbbells boven je schouders, op een kleine afstand van elkaar.' },
    ],
    ademhaling: 'Adem uit terwijl je drukt, adem in als je de dumbbells laat zakken.',
    tempo: '1 tel omhoog, kort stil, 2 tellen omlaag.',
    makkelijker: 'Doe een gewone dumbbell shoulder press zonder draai.',
    zwaarder: 'Laat de dumbbells in 3 tellen zakken.',
  },

  'Assisted dips': {
    kernpunten: [
      { punt: 'Meer gewicht is meer hulp', uitleg: 'Op dit toestel helpt het gewicht je omhoog. Hoe sterker je wordt, hoe minder gewicht je instelt.' },
      { punt: 'Schouders laag', uitleg: 'Duw je schouders weg van je oren. Ze zakken niet in als je onderin bent.' },
      { punt: 'Tot rechte hoek zakken', uitleg: 'Zak tot je bovenarmen ongeveer horizontaal zijn. Dieper hoeft niet.' },
      { punt: 'Borst licht voorover', uitleg: 'Een kleine voorover hoek laat je borst meewerken, rechtop leg je meer nadruk op je triceps.' },
    ],
    opstelling: [
      'Kies het gewicht en kniel op het kussen terwijl je de handvatten vastpakt.',
      'Duw jezelf omhoog tot je armen bijna gestrekt zijn, schouders laag.',
    ],
    stappen: [
      'Zak gecontroleerd tot je bovenarmen ongeveer horizontaal zijn.',
      'Duw jezelf omhoog tot je armen bijna gestrekt zijn.',
      'Stap na de laatste herhaling rustig van het kussen.',
    ],
    fouten: [
      { fout: 'Schouders schieten naar je oren', beter: 'Zak minder diep en duw je schouders bewust omlaag voor je weer omhoog drukt.' },
      { fout: 'Ellebogen wijd naar buiten', beter: 'Houd je ellebogen naar achteren gericht, dicht langs je lichaam.' },
      { fout: 'Te diep zakken', beter: 'Stop als je bovenarmen horizontaal zijn. Dieper legt veel druk op de voorkant van je schouder.' },
    ],
    ademhaling: 'Adem in als je zakt, adem uit als je omhoog duwt.',
    tempo: '2 tellen omlaag, kort stil, 1 tel omhoog.',
    makkelijker: 'Stel meer gewicht in zodat je meer hulp krijgt.',
    zwaarder: 'Stel minder gewicht in tot je dips zonder hulp haalt.',
  },

  'Dips machine': {
    kernpunten: [
      { punt: 'Ellebogen naar achteren', uitleg: 'Je ellebogen wijzen naar achteren en blijven dicht bij je lichaam. Dan doen je triceps het werk.' },
      { punt: 'Schouders laag', uitleg: 'Trek je schouders niet op. Ze blijven weg van je oren tijdens de hele beweging.' },
      { punt: 'Helemaal strekken', uitleg: 'Duw de handvatten omlaag tot je armen gestrekt zijn en knijp je triceps kort aan.' },
      { punt: 'Rustig terug', uitleg: 'Laat de handvatten gecontroleerd terugkomen tot ongeveer een rechte hoek in je ellebogen.' },
    ],
    opstelling: [
      'Stel de zitting zo in dat de handvatten in de beginstand ongeveer op borsthoogte zitten.',
      'Zit met je rug tegen de leuning en pak de handvatten naast je.',
    ],
    stappen: [
      'Duw de handvatten omlaag tot je armen gestrekt zijn.',
      'Houd kort vast met je triceps aangespannen.',
      'Laat de handvatten rustig terugkomen tot ongeveer een rechte hoek.',
    ],
    fouten: [
      { fout: 'Ellebogen wijd naar buiten', beter: 'Houd je ellebogen dicht langs je lichaam en naar achteren gericht.' },
      { fout: 'Voorover leunen om te duwen', beter: 'Blijf met je rug tegen de leuning. Neem minder gewicht als je moet meehangen.' },
      { fout: 'Gewicht valt terug', beter: 'Laat de handvatten in 2 tellen terugkomen en tik de schijven niet aan.' },
    ],
    ademhaling: 'Adem uit terwijl je omlaag duwt, adem in als de handvatten terugkomen.',
    tempo: '1 tel omlaag duwen, kort vast, 2 tellen terug.',
    makkelijker: 'Neem minder gewicht en maak de beweging iets kleiner.',
    zwaarder: 'Houd onderin 2 tellen vast met je armen gestrekt.',
  },

  'Triceps extension boven het hoofd aan de kabel': {
    kernpunten: [
      { punt: 'Ellebogen blijven staan', uitleg: 'Je bovenarmen staan stil naast je hoofd. Alleen je onderarmen bewegen.' },
      { punt: 'Ellebogen naar voren', uitleg: 'Je ellebogen wijzen vooruit en niet wijd naar buiten.' },
      { punt: 'Buik aan', uitleg: 'Je ribben blijven laag, zodat je geen holle rug trekt als je de armen strekt.' },
      { punt: 'Diep laten zakken', uitleg: 'Laat het touw ver achter je hoofd zakken. Daar voel je je triceps rekken, en dat is juist het nuttige deel.' },
    ],
    opstelling: [
      'Zet de kabel laag met een touw en pak de uiteinden vast.',
      'Draai je rug naar het toestel, zet een voet naar voren en breng het touw achter je hoofd, ellebogen naast je oren.',
    ],
    stappen: [
      'Strek je armen schuin omhoog tot ze gestrekt zijn.',
      'Laat het touw gecontroleerd achter je hoofd zakken tot je een rek in je triceps voelt.',
      'Strek opnieuw zonder je ellebogen te verplaatsen.',
    ],
    fouten: [
      { fout: 'Ellebogen wijken naar buiten', beter: 'Breng ze terug naast je hoofd. Neem minder gewicht als het steeds gebeurt.' },
      { fout: 'Holle rug', beter: 'Span je buik aan en zet je voeten in spreidstand voor balans.' },
      { fout: 'Bovenarmen bewegen mee', beter: 'Houd je ellebogen op een vaste plek. De beweging zit alleen in je ellebogen.' },
    ],
    ademhaling: 'Adem uit terwijl je strekt, adem in als je het touw laat zakken.',
    tempo: '1 tel strekken, kort vast, 2 tellen terug.',
    makkelijker: 'Neem minder gewicht of doe de oefening met een dumbbell zittend.',
    zwaarder: 'Laat het touw in 3 tellen zakken en houd onderin een tel de rek vast.',
  },

  'Voorovergebogen row met dumbbells': {
    kernpunten: [
      { punt: 'Heupen naar achteren', uitleg: 'Buig voorover vanuit je heupen tot je romp ongeveer 45 graden staat. Knieen licht gebogen.' },
      { punt: 'Rug recht en stil', uitleg: 'Je romp beweegt niet mee. Komt hij omhoog, dan is het gewicht te zwaar.' },
      { punt: 'Ellebogen naar je heupen', uitleg: 'Trek de dumbbells langs je lichaam naar je heupen, niet recht omhoog naar je borst.' },
      { punt: 'Schouderbladen naar elkaar', uitleg: 'Knijp bovenin je schouderbladen samen en laat ze onderin weer los.' },
    ],
    opstelling: [
      'Pak een dumbbell in elke hand en sta met je voeten op heupbreedte.',
      'Buig voorover vanuit je heupen met een rechte rug, de dumbbells hangen onder je schouders.',
    ],
    stappen: [
      'Trek de dumbbells naar je heupen, ellebogen langs je lichaam.',
      'Houd kort vast met je schouderbladen naar elkaar.',
      'Laat de dumbbells gecontroleerd zakken tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Omhoog komen met je romp', beter: 'Houd je romp op dezelfde hoek. Neem minder gewicht als je moet zwaaien.' },
      { fout: 'Ronde rug', beter: 'Borst naar voren en buik aan. Buig minder ver voorover als je rug rond wordt.' },
      { fout: 'Schouders trekken op', beter: 'Denk aan je ellebogen naar achteren brengen, niet aan je handen optillen.' },
    ],
    ademhaling: 'Adem uit terwijl je trekt, adem in als je de dumbbells laat zakken.',
    tempo: '1 tel trekken, kort vast, 2 tellen omlaag.',
    makkelijker: 'Doe de row op een schuine bank, dan steunt je borst.',
    zwaarder: 'Houd bovenin 2 tellen vast of neem zwaardere dumbbells.',
  },

  'TRX row': {
    kernpunten: [
      { punt: 'Lichaam een plank', uitleg: 'Van je hoofd tot je hielen een rechte lijn. Je heupen zakken niet door.' },
      { punt: 'Borst naar de handvatten', uitleg: 'Trek jezelf omhoog met je borst vooruit, niet met je kin.' },
      { punt: 'Ellebogen langs je lichaam', uitleg: 'Je ellebogen gaan naar achteren, dicht langs je zij.' },
      { punt: 'Rustig terugzakken', uitleg: 'Laat jezelf gecontroleerd terugzakken tot je armen gestrekt zijn.' },
    ],
    opstelling: [
      'Stel de banden in op middellengte en pak de handvatten met je handpalmen naar elkaar.',
      'Loop met je voeten naar voren en leun achterover tot je armen gestrekt zijn en je lichaam recht is.',
    ],
    stappen: [
      'Span je buik en billen aan.',
      'Trek je borst naar de handvatten tot je handen naast je ribben zijn.',
      'Laat jezelf rustig terugzakken tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Heupen zakken door', beter: 'Span je billen aan en houd je lichaam recht. Zet je voeten iets terug als het niet lukt.' },
      { fout: 'Trekken met je nek', beter: 'Houd je hoofd in het verlengde van je romp en leid de beweging met je borst.' },
      { fout: 'Terugvallen in de banden', beter: 'Rem de weg terug af in 2 tellen. Ploffen kost je de helft van de oefening.' },
    ],
    ademhaling: 'Adem uit terwijl je trekt, adem in als je terugzakt.',
    tempo: '1 tel omhoog, kort vast, 2 tellen terug.',
    makkelijker: 'Stap met je voeten naar achteren, zodat je meer rechtop staat.',
    zwaarder: 'Stap met je voeten verder naar voren of houd bovenin 2 tellen vast.',
  },

  'Negatieve pull-up': {
    kernpunten: [
      { punt: 'Begin bovenin', uitleg: 'Stap of spring naar de bovenstand, je kin boven de stang. Je trekt jezelf niet op.' },
      { punt: 'Zo langzaam mogelijk', uitleg: 'Het werk zit in het zakken. Probeer 3 tot 5 tellen te remmen, de hele weg omlaag.' },
      { punt: 'Schouders laag', uitleg: 'Houd je schouders weg van je oren, ook bovenin. Dan blijft je rug actief.' },
      { punt: 'Lichaam stil', uitleg: 'Benen licht naar voren en buik aan, zodat je niet gaat schommelen.' },
    ],
    opstelling: [
      'Zet een bank of box onder de stang, zodat je bovenin kunt beginnen.',
      'Pak de stang iets breder dan schouderbreedte met je handpalmen van je af.',
    ],
    stappen: [
      'Stap omhoog tot je kin boven de stang is en til je voeten op.',
      'Laat jezelf zo langzaam mogelijk zakken tot je armen gestrekt zijn.',
      'Stap terug op de bank en begin opnieuw bovenin.',
    ],
    fouten: [
      { fout: 'Te snel zakken', beter: 'Tel hardop mee. Lukt 3 tellen niet, gebruik dan eerst de assisted pull-up.' },
      { fout: 'Onderin loslaten met een schok', beter: 'Rem tot je armen gestrekt zijn en zet daarna rustig je voeten neer.' },
      { fout: 'Schouders schieten omhoog', beter: 'Trek je schouders omlaag en houd je borst richting de stang.' },
    ],
    ademhaling: 'Adem rustig uit tijdens het zakken, adem in terwijl je terug omhoog stapt.',
    tempo: '3 tot 5 tellen omlaag, rustig terug naar de bovenstand.',
    makkelijker: 'Doe een negatieve met een elastiek om de stang onder je voeten of knieen.',
    zwaarder: 'Zak in 6 tot 8 tellen of houd halverwege 2 tellen stil.',
  },

  'Eenarmige lat pulldown': {
    kernpunten: [
      { punt: 'Elleboog naar je zij', uitleg: 'Trek je elleboog omlaag naar je heup, alsof je hem in je achterzak stopt.' },
      { punt: 'Romp blijft recht', uitleg: 'Draai niet weg en leun niet opzij. Je romp blijft recht onder de kabel.' },
      { punt: 'Bovenin helemaal strekken', uitleg: 'Laat je arm bovenin lang worden. Daar voel je je brede rugspier rekken.' },
      { punt: 'Schouder eerst omlaag', uitleg: 'Begin elke herhaling met je schouder omlaag trekken, dan pas je elleboog.' },
    ],
    opstelling: [
      'Zet een losse handgreep aan de kabel en klem je bovenbenen onder de rollen.',
      'Pak de handgreep met een hand, arm gestrekt boven je.',
    ],
    stappen: [
      'Trek je schouder omlaag en daarna je elleboog naar je zij.',
      'Houd kort vast als je hand bij je schouder is.',
      'Laat het handvat gecontroleerd terug omhoog gaan tot je arm gestrekt is.',
    ],
    fouten: [
      { fout: 'Wegdraaien met je romp', beter: 'Houd je borst naar voren gericht. Neem minder gewicht als je moet draaien.' },
      { fout: 'Trekken met je biceps', beter: 'Denk aan je elleboog omlaag brengen, niet aan je hand naar beneden trekken.' },
      { fout: 'Bovenin niet uitstrekken', beter: 'Laat je arm helemaal lang worden voor je opnieuw trekt.' },
    ],
    ademhaling: 'Adem uit terwijl je trekt, adem in als het handvat terug omhoog gaat.',
    tempo: '1 tel omlaag, kort vast, 2 tellen terug.',
    makkelijker: 'Neem minder gewicht of doe de gewone lat pulldown met twee handen.',
    zwaarder: 'Houd onderin 2 tellen vast en laat het handvat in 3 tellen terug.',
  },

  'Seated cable row met brede greep': {
    kernpunten: [
      { punt: 'Romp stil en rechtop', uitleg: 'Je romp blijft rechtop. Leun niet achterover om het gewicht te halen.' },
      { punt: 'Ellebogen naar buiten', uitleg: 'Met de brede greep gaan je ellebogen schuin naar buiten. Dat legt de nadruk op je bovenrug.' },
      { punt: 'Naar je onderste borst', uitleg: 'Trek de stang naar je onderste borst, niet naar je buik of je nek.' },
      { punt: 'Schouderbladen samen', uitleg: 'Knijp je schouderbladen aan het eind samen en laat ze onderin weer los.' },
    ],
    opstelling: [
      'Zet een brede stang aan de kabel, ga zitten met je voeten tegen de steun en je knieen licht gebogen.',
      'Pak de stang breed vast en zit rechtop met gestrekte armen.',
    ],
    stappen: [
      'Trek de stang naar je onderste borst met je ellebogen schuin naar buiten.',
      'Houd kort vast met je schouderbladen samen.',
      'Laat de stang gecontroleerd terugkomen tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Achterover leunen', beter: 'Blijf rechtop zitten. Neem minder gewicht als je moet meehangen.' },
      { fout: 'Schouders trekken op', beter: 'Houd je schouders laag en trek met je ellebogen, niet met je handen.' },
      { fout: 'Voorover vallen bij terugkomen', beter: 'Laat de stang terugkomen terwijl je romp rechtop blijft.' },
    ],
    ademhaling: 'Adem uit terwijl je trekt, adem in als de stang terugkomt.',
    tempo: '1 tel trekken, kort vast, 2 tellen terug.',
    makkelijker: 'Neem minder gewicht of gebruik de gewone smalle greep.',
    zwaarder: 'Houd de stang 2 tellen vast tegen je borst.',
  },

  'Biceps curl machine': {
    kernpunten: [
      { punt: 'Ellebogen op het kussen', uitleg: 'Je bovenarmen liggen plat op het kussen en blijven daar. Zo werkt alleen je biceps.' },
      { punt: 'Zitting goed instellen', uitleg: 'Je oksels liggen tegen de bovenkant van het kussen en je ellebogen op een lijn met het draaipunt.' },
      { punt: 'Onderin bijna strekken', uitleg: 'Laat je armen bijna helemaal strekken, dan werk je over de hele beweging.' },
      { punt: 'Rustig terug', uitleg: 'Laat het gewicht langzaam zakken. De weg omlaag telt net zo goed.' },
    ],
    opstelling: [
      'Stel de zitting zo in dat je bovenarmen plat op het kussen liggen en je ellebogen bij het draaipunt zitten.',
    ],
    stappen: [
      'Pak de handvatten met je handpalmen omhoog.',
      'Buig je armen tot de handvatten bij je schouders zijn en knijp kort aan.',
      'Laat het gewicht gecontroleerd zakken tot je armen bijna gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Ellebogen komen van het kussen', beter: 'Houd je bovenarmen op het kussen. Neem minder gewicht als ze omhoog komen.' },
      { fout: 'Zitting te hoog of te laag', beter: 'Stel de zitting opnieuw in tot je ellebogen in lijn met het draaipunt liggen.' },
      { fout: 'Gewicht valt terug', beter: 'Laat het in 2 tot 3 tellen zakken en tik de schijven niet aan.' },
    ],
    ademhaling: 'Adem uit terwijl je de handvatten naar je toe brengt, adem in als je ze laat zakken.',
    tempo: '1 tel omhoog, kort vast, 2 tellen omlaag.',
    makkelijker: 'Neem minder gewicht en maak de beweging iets kleiner.',
    zwaarder: 'Laat het gewicht in 3 tellen zakken of doe de oefening met een arm.',
  },

  'Hammer curl aan de kabel': {
    kernpunten: [
      { punt: 'Duimen omhoog', uitleg: 'Je handpalmen wijzen naar elkaar, zoals bij een hamer. Zo werken ook je onderarmen mee.' },
      { punt: 'Ellebogen naast je lichaam', uitleg: 'Je ellebogen blijven op dezelfde plek naast je zij en schuiven niet naar voren.' },
      { punt: 'Niet zwaaien', uitleg: 'Je romp staat stil. Zwaai je mee, dan is het gewicht te zwaar.' },
      { punt: 'Rustig zakken', uitleg: 'De kabel trekt de hele beweging. Laat het touw gecontroleerd terugkomen.' },
    ],
    opstelling: [
      'Zet de kabel helemaal laag met een touw en sta rechtop dicht bij het toestel.',
      'Pak de uiteinden van het touw met je duimen omhoog, armen gestrekt.',
    ],
    stappen: [
      'Buig je armen tot je handen bij je schouders zijn.',
      'Houd kort vast met je biceps aangespannen.',
      'Laat het touw gecontroleerd zakken tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Ellebogen schuiven naar voren', beter: 'Houd je ellebogen tegen je zij. Neem minder gewicht als ze meegaan.' },
      { fout: 'Meezwaaien met je rug', beter: 'Sta stevig met je knieen licht gebogen en houd je romp stil.' },
      { fout: 'Polsen knikken', beter: 'Houd je polsen recht in het verlengde van je onderarmen.' },
    ],
    ademhaling: 'Adem uit terwijl je buigt, adem in als je het touw laat zakken.',
    tempo: '1 tel omhoog, kort vast, 2 tellen omlaag.',
    makkelijker: 'Neem minder gewicht of doe de hammer curl met dumbbells.',
    zwaarder: 'Laat het touw in 3 tellen zakken of houd halverwege 2 tellen stil.',
  },

  'Reverse fly machine': {
    kernpunten: [
      { punt: 'Borst tegen het kussen', uitleg: 'Je borst blijft tegen het kussen, zodat je niet met je rug meehelpt.' },
      { punt: 'Armen licht gebogen', uitleg: 'Een kleine buiging in je ellebogen die de hele beweging gelijk blijft.' },
      { punt: 'Schouders laag', uitleg: 'Trek je schouders niet op naar je oren. Dan werkt de achterkant van je schouder.' },
      { punt: 'Licht en rustig', uitleg: 'Een kleine spier: kies een licht gewicht en werk met controle.' },
    ],
    opstelling: [
      'Zet de armen van het toestel naar achteren voor de reverse fly en stel de zitting zo in dat de handvatten op schouderhoogte zitten.',
      'Zit met je borst tegen het kussen en pak de handvatten met je handpalmen naar elkaar of naar beneden.',
    ],
    stappen: [
      'Breng je armen in een wijde boog naar achteren tot ze in lijn met je lichaam zijn.',
      'Houd kort vast.',
      'Laat de handvatten gecontroleerd terugkomen tot vlak voor je.',
    ],
    fouten: [
      { fout: 'Schouders trekken op', beter: 'Duw je schouders omlaag voor je begint en neem minder gewicht.' },
      { fout: 'Borst komt los van het kussen', beter: 'Blijf tegen het kussen en maak de beweging kleiner.' },
      { fout: 'Ellebogen buigen steeds meer', beter: 'Houd dezelfde lichte buiging, anders wordt het een row.' },
    ],
    ademhaling: 'Adem uit terwijl je de armen naar achteren brengt, adem in als ze terugkomen.',
    tempo: '1 tel naar achteren, kort vast, 2 tellen terug.',
    makkelijker: 'Neem minder gewicht en maak de boog iets kleiner.',
    zwaarder: 'Houd de eindstand 2 tellen vast of doe meer herhalingen.',
  },

  'Exorotatie aan de kabel': {
    kernpunten: [
      { punt: 'Elleboog tegen je zij', uitleg: 'Je elleboog blijft tegen je zij en op een rechte hoek. Een opgerolde handdoek ertussen helpt.' },
      { punt: 'Alleen je onderarm draait', uitleg: 'Je onderarm draait als een deur naar buiten. Je romp draait niet mee.' },
      { punt: 'Licht gewicht', uitleg: 'De spieren die je schouder naar buiten draaien zijn klein. Een licht gewicht is genoeg.' },
      { punt: 'Rustig terug', uitleg: 'Laat de kabel gecontroleerd terugkomen tot je hand voor je buik is.' },
    ],
    opstelling: [
      'Zet de kabel op ellebooghoogte met een losse handgreep en sta er zijwaarts naast.',
      'Pak de handgreep met de hand die het verst van het toestel is, elleboog in een rechte hoek tegen je zij.',
    ],
    stappen: [
      'Draai je onderarm naar buiten, weg van het toestel, zo ver als lukt zonder dat je elleboog loskomt.',
      'Houd kort vast.',
      'Laat je hand rustig terugkomen tot voor je buik en wissel na de set van kant.',
    ],
    fouten: [
      { fout: 'Elleboog komt los van je zij', beter: 'Klem een handdoek tussen je elleboog en je zij en houd die vast.' },
      { fout: 'Romp draait mee', beter: 'Houd je borst naar voren gericht. Maak de beweging kleiner.' },
      { fout: 'Te zwaar gewicht', beter: 'Neem de lichtste stand die er is. Je moet de beweging rustig kunnen sturen.' },
    ],
    ademhaling: 'Adem rustig door, uit tijdens het draaien naar buiten.',
    tempo: '2 tellen naar buiten, kort vast, 2 tellen terug.',
    makkelijker: 'Gebruik een licht elastiek in plaats van de kabel.',
    zwaarder: 'Houd de eindstand 2 tellen vast of doe meer herhalingen.',
  },

  'Schouders ophalen met barbell': {
    kernpunten: [
      { punt: 'Recht omhoog', uitleg: 'Trek je schouders recht omhoog naar je oren. Niet rollen, dat voegt niets toe.' },
      { punt: 'Armen blijven gestrekt', uitleg: 'Je armen zijn haken. Je buigt je ellebogen niet om te helpen.' },
      { punt: 'Bovenin kort vast', uitleg: 'Houd de bovenstand een tel vast voor je de stang laat zakken.' },
      { punt: 'Hoofd in dezelfde stand', uitleg: 'Je kin blijft neutraal. Niet naar voren steken of naar je borst trekken.' },
    ],
    opstelling: [
      'Pak de stang op schouderbreedte uit een rek of van de grond met een rechte rug.',
      'Sta rechtop met de stang aan gestrekte armen voor je bovenbenen.',
    ],
    stappen: [
      'Trek je schouders recht omhoog naar je oren.',
      'Houd een tel vast.',
      'Laat je schouders rustig zakken tot je armen helemaal hangen.',
    ],
    fouten: [
      { fout: 'Schouders rollen', beter: 'Beweeg alleen recht op en neer, met je schouders richting je oren.' },
      { fout: 'Ellebogen buigen', beter: 'Laat je armen gestrekt hangen. Neem minder gewicht als je moet meetrekken.' },
      { fout: 'Te kleine beweging', beter: 'Neem minder gewicht en maak de beweging volledig, van helemaal laag tot helemaal hoog.' },
    ],
    ademhaling: 'Adem uit terwijl je de schouders optrekt, adem in als je ze laat zakken.',
    tempo: '1 tel omhoog, 1 tel vast, 2 tellen omlaag.',
    makkelijker: 'Doe de oefening met dumbbells naast je lichaam.',
    zwaarder: 'Houd bovenin 2 tot 3 tellen vast.',
  },
}
