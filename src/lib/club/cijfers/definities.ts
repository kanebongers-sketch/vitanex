// ─── Fit Factory Club: wat elk cijfer betekent (PUUR) ───────────────────────
// Virtuagym-reviews klagen over vage cijfers. Hier staat per cijfer in gewone
// taal hoe we tellen; de pagina toont het onder elk blok.

export const DEFINITIES = {
  maand:
    'Alles telt per kalendermaand: van de 1e om 00:00 tot en met de laatste dag om 23:59, in Nederlandse tijd (zomer- en wintertijd inbegrepen). Een lopende maand telt tot en met vandaag, en vandaag telt mee tot nu.',
  vergelijking:
    'Loopt de maand nog, dan vergelijken we met hetzelfde aantal dagen van de vorige maand en van dezelfde maand vorig jaar. Een afgesloten maand vergelijken we met de hele andere maand. Begon de data pas na het begin van die maand, dan staat er geen vergelijking: met nul vergelijken zou niet eerlijk zijn.',
  actief: 'Actief = status actief, of opgezegd met een einddatum die nog moet komen. Proefleden en gepauzeerde leden tellen apart.',
  ledenbestand:
    'Ledenbestand = leden met een lid sinds tot en met die dag en geen einddatum, of een einddatum daarna. Dus ook gepauzeerde leden en opgezegde leden tot hun einddatum, daarom is het hoger dan het aantal actieve leden. Proefleden en gestopte leden zonder einddatum tellen niet mee. Begin = het bestand aan het eind van de dag voor de 1e.',
  stroom:
    'Instroom = nieuwe leden met lid sinds in die maand. Uitstroom = leden met een einddatum in die maand, tot en met vandaag. Instroom min uitstroom is precies de groei van het ledenbestand.',
  bezoek: 'Een bezoek = een check-in (balie, QR, bandje of les). De lopende maand is nog niet compleet en staat lichter.',
  bezoekPerLid:
    'Bezoek per lid per week = bezoeken in de maand, omgerekend naar een gemiddelde week (keer 7, gedeeld door het aantal dagen), gedeeld door het gemiddelde ledenbestand van begin en eind van de maand.',
  drukte: 'Drukte = aantal check-ins per weekdag en uur, opgeteld over de gekozen maand. Donkerder amber = drukker.',
  bezetting:
    'Bezetting = geboekte plekken (geboekt, aanwezig of no-show, per les hoogstens de capaciteit) gedeeld door de capaciteit, voor lessen in de maand die al geweest zijn. Geannuleerde lessen tellen niet mee.',
  noShow: 'No-show = reserveringen met status no-show gedeeld door aanwezig plus no-show, voor lessen in de maand die al geweest zijn.',
  wachtlijst: 'Wachtlijstdruk = lessen in de komende 14 dagen vanaf vandaag die vol zijn of een wachtlijst hebben, en hoeveel mensen er wachten. Dit cijfer hangt niet af van de gekozen maand.',
  leads:
    'Leads = aanvragen die in de maand binnenkwamen. Conversie = het deel daarvan dat inmiddels lid is. Proefles = leads met een geplande of gehouden proefles. Open = nog niet lid en niet verloren.',
  demografie: 'Leeftijd en geslacht van de actieve leden van nu (zie de definitie van actief), dus niet van de gekozen maand. Leeftijd op vandaag.',
  vestigingen:
    'Per vestiging over dezelfde maand, met dezelfde regels als hierboven. Groei = ledenbestand aan het eind min ledenbestand aan het begin van de maand.',
} as const

export type DefinitieSleutel = keyof typeof DEFINITIES
