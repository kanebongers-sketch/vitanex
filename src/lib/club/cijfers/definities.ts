// ─── Fit Factory Club: wat elk cijfer betekent (PUUR) ───────────────────────
// Virtuagym-reviews klagen over vage cijfers. Hier staat per cijfer in gewone
// taal hoe we tellen; de pagina toont het onder elk blok.

export const DEFINITIES = {
  actief: 'Actief = status actief, of opgezegd met een einddatum die nog moet komen. Proefleden en gepauzeerde leden tellen apart.',
  ledenbestand:
    'Ledenbestand per week = leden met een lid sinds voor het eind van die week en geen einddatum, of een einddatum daarna. Proefleden tellen niet mee. Pauzes in het verleden kennen we niet, die tellen als lid.',
  stroom: 'Instroom = nieuwe leden met lid sinds in die week (geen proefleden). Uitstroom = leden met een einddatum in die week, tot en met vandaag.',
  bezoek: 'Een bezoek = een check-in (balie, QR, bandje of les). De lopende week is nog niet compleet.',
  drukte: 'Drukte = aantal check-ins per weekdag en uur, opgeteld over de hele periode. Donkerder amber = drukker.',
  bezetting:
    'Bezetting = geboekte plekken (geboekt, aanwezig of no-show) gedeeld door de capaciteit, voor lessen in de periode die al geweest zijn. Geannuleerde lessen tellen niet mee.',
  noShow: 'No-show = reserveringen met status no-show gedeeld door aanwezig plus no-show, voor lessen die al geweest zijn.',
  wachtlijst: 'Wachtlijstdruk = lessen in de komende 14 dagen die vol zijn of een wachtlijst hebben, en hoeveel mensen er wachten.',
  leads: 'Conversie = leads die lid werden gedeeld door alle leads uit die bron die in de periode binnenkwamen. Proefles = leads met een geplande of gehouden proefles. Open = nog niet lid en niet verloren.',
  demografie: 'Leeftijd en geslacht van de actieve leden (zie de definitie van actief). Leeftijd op vandaag.',
  vergelijking:
    'Per vestiging over dezelfde periode. Bezoek per lid = bezoeken per week gedeeld door het aantal actieve leden nu. Groei = ledenbestand nu min ledenbestand aan het begin van de periode.',
} as const

export type DefinitieSleutel = keyof typeof DEFINITIES
