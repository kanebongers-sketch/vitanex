'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────

type VraagType = 'schaal' | 'tekst'

interface Vraag {
  code: string
  label: string
  beschrijving?: string
  type: VraagType
  min?: string
  max?: string
  verplicht: boolean
}

interface SectieConfig {
  id: string
  label: string
  kleur: string
  licht: string
}

interface Sectie extends SectieConfig {
  vragen: Vraag[]
}

// ─── Seeded random ─────────────────────────────────────────────────────────

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = ((s * 1664525) + 1013904223) & 0x7fffffff
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ─── Volledige vraagbank ────────────────────────────────────────────────────
// Elke sectie heeft een grote pool van schaal- en tekstvragen.
// Elke week worden er willekeurig een aantal geselecteerd.

const SECTIE_META: SectieConfig[] = [
  { id: 'energie', label: 'Energie & Lichaam',    kleur: '#1D9E75', licht: '#E1F5EE' },
  { id: 'mentaal', label: 'Mentaal welzijn',       kleur: '#378ADD', licht: '#E6F1FB' },
  { id: 'werk',    label: 'Werk & Motivatie',      kleur: '#8B5CF6', licht: '#EEEDFE' },
  { id: 'sociaal', label: 'Team & Samenwerking',   kleur: '#BA7517', licht: '#FAEEDA' },
  { id: 'groei',   label: 'Groei & Ontwikkeling',  kleur: '#059669', licht: '#D1FAE5' },
  { id: 'afsluiting', label: 'Afsluiting',         kleur: '#6b7280', licht: '#F3F4F6' },
]

// Hoeveel vragen per sectie per checkin worden geselecteerd
const SELECTIE: Record<string, { schaal: number; tekst: number }> = {
  energie:    { schaal: 10, tekst: 2 },
  mentaal:    { schaal: 10, tekst: 2 },
  werk:       { schaal: 10, tekst: 2 },
  sociaal:    { schaal: 10, tekst: 2 },
  groei:      { schaal: 10, tekst: 2 },
  afsluiting: { schaal: 3,  tekst: 2 },
}

// ── Energie & Lichaam pool ─────────────────────────────────────────────────

const ENERGIE_SCHAAL: Vraag[] = [
  { code: 'energie',           label: 'Hoe was je energieniveau deze week?',                              type: 'schaal', min: 'Uitgeput',         max: 'Vol energie',     verplicht: true },
  { code: 'slaap',             label: 'Hoe heb je deze week geslapen?',                                   type: 'schaal', min: 'Zeer slecht',       max: 'Uitstekend',      verplicht: true },
  { code: 'slaap_duur',        label: 'Hoeveel uur sliep je gemiddeld per nacht?',                        type: 'schaal', min: 'Minder dan 5 uur',  max: '8 uur of meer',   verplicht: true },
  { code: 'fysiek_pijn',       label: 'Had je last van lichamelijke klachten (pijn, spanning)?',          type: 'schaal', min: 'Veel klachten',     max: 'Geen klachten',   verplicht: true },
  { code: 'fysiek_beweging',   label: 'Hoe actief was je buiten het werk (sport, wandelen)?',             type: 'schaal', min: 'Totaal inactief',   max: 'Zeer actief',     verplicht: true },
  { code: 'voeding',           label: 'Hoe gezond was je eet- en drinkpatroon deze week?',                type: 'schaal', min: 'Ongezond',          max: 'Zeer gezond',     verplicht: true },
  { code: 'herstel',           label: 'Hoe goed kon je herstellen na het werk?',                         type: 'schaal', min: 'Nauwelijks',        max: 'Volledig',        verplicht: true },
  { code: 'hydratatie',        label: 'Dronk je voldoende water en gezonde dranken?',                     type: 'schaal', min: 'Te weinig',         max: 'Voldoende',       verplicht: true },
  { code: 'ochtendenergie',    label: 'Hoe fris en uitgerust voelde je je bij het opstaan?',              type: 'schaal', min: 'Volledig uitgeput', max: 'Fris en alert',   verplicht: true },
  { code: 'middagdip',         label: 'Had je last van een middagdip of energiedaling?',                  type: 'schaal', min: 'Ernstige dip',      max: 'Geen dip',        verplicht: true },
  { code: 'spierspanning',     label: 'Had je last van spierspanning, stijfheid of vermoeidheid?',        type: 'schaal', min: 'Veel last',         max: 'Geen last',       verplicht: true },
  { code: 'ademhaling',        label: 'Hoe rustig en diep was je ademhaling overdag?',                   type: 'schaal', min: 'Oppervlakkig',      max: 'Diep en rustig',  verplicht: true },
  { code: 'buitenlucht',       label: 'Heb je voldoende frisse buitenlucht en daglicht opgezocht?',       type: 'schaal', min: 'Bijna niet',        max: 'Dagelijks',       verplicht: true },
  { code: 'schermmoeheid',     label: 'Had je last van vermoeidheid door schermen (ogen, hoofd)?',        type: 'schaal', min: 'Ernstig',           max: 'Geen last',       verplicht: true },
  { code: 'lichaamshouding',   label: 'Was je werkhouding (ergonomie) goed gedurende de week?',           type: 'schaal', min: 'Slecht',            max: 'Uitstekend',      verplicht: true },
  { code: 'algehele_gezondheid',label: 'Hoe tevreden ben je over je algehele lichamelijke gezondheid?',  type: 'schaal', min: 'Ontevreden',        max: 'Zeer tevreden',   verplicht: true },
  { code: 'ontspanning',       label: 'Lukte het je om te ontspannen en los te laten buiten werktijd?',   type: 'schaal', min: 'Nauwelijks',        max: 'Volledig',        verplicht: true },
  { code: 'immuunsysteem',     label: 'Hoe robuust voelde je je lichaam (weinig kwaaltjes)?',             type: 'schaal', min: 'Kwetsbaar',         max: 'Sterk',           verplicht: true },
]

const ENERGIE_TEKST: Vraag[] = [
  { code: 'energie_tekst',     label: 'Is er iets over je lichamelijke gezondheid of energie dat je wil toelichten?',     type: 'tekst', verplicht: false, beschrijving: 'Optioneel — denk aan pijnklachten, slaapproblemen, vermoeidheid.' },
  { code: 'energie_verbeter',  label: 'Wat zou je kunnen veranderen om je de komende week fysiek beter te voelen?',       type: 'tekst', verplicht: false },
  { code: 'energie_highlight', label: 'Wat deed je goed voor je lichaam of gezondheid deze week?',                        type: 'tekst', verplicht: false },
  { code: 'energie_blokkade',  label: 'Wat belemmerde je om gezonder te leven of te bewegen deze week?',                  type: 'tekst', verplicht: false },
  { code: 'energie_moment',    label: 'Wanneer voelde je je het meest energiek deze week, en waardoor?',                  type: 'tekst', verplicht: false },
]

// ── Mentaal welzijn pool ───────────────────────────────────────────────────

const MENTAAL_SCHAAL: Vraag[] = [
  { code: 'mentaal_stress',      label: 'Hoe stressvrij voelde je je deze week?',                              type: 'schaal', min: 'Extreem gestrest',    max: 'Volledig ontspannen', verplicht: true },
  { code: 'mentaal_focus',       label: 'Hoe goed kon je je concentreren en focussen op je werk?',             type: 'schaal', min: 'Totaal niet',          max: 'Uitstekend',          verplicht: true },
  { code: 'mentaal_balans',      label: 'Ervaarde je een goede balans tussen werk en privéleven?',             type: 'schaal', min: 'Helemaal niet',        max: 'Perfecte balans',     verplicht: true },
  { code: 'piekeren',            label: 'In welke mate piekerde je over je werk (ook buiten werktijden)?',     type: 'schaal', min: 'Voortdurend',          max: 'Helemaal niet',       verplicht: true },
  { code: 'emotioneel_uitgeput', label: 'Hoe emotioneel uitgeput voelde je je aan het einde van de werkdag?', type: 'schaal', min: 'Volledig leeg',        max: 'Fris en uitgerust',   verplicht: true },
  { code: 'controle',            label: 'Had je het gevoel controle te hebben over je werk en planning?',      type: 'schaal', min: 'Geen controle',        max: 'Volledig in controle',verplicht: true },
  { code: 'stemming',            label: 'Hoe stabiel en positief was je stemming gedurende de week?',          type: 'schaal', min: 'Wisselvallig',         max: 'Stabiel en positief', verplicht: true },
  { code: 'angst_bezorgdheid',   label: 'Hoe vrij was je van angst, onrust of bezorgdheid?',                  type: 'schaal', min: 'Sterk aanwezig',       max: 'Helemaal geen',       verplicht: true },
  { code: 'creativiteit',        label: 'Voelde je je creatief en geïnspireerd in je werk?',                  type: 'schaal', min: 'Helemaal niet',        max: 'Volledig',            verplicht: true },
  { code: 'mentale_helderheid',  label: 'Hoe helder was je hoofd — kon je snel beslissingen nemen?',          type: 'schaal', min: 'Wazig en traag',       max: 'Scherp en helder',    verplicht: true },
  { code: 'aanwezig_zijn',       label: 'In welke mate was je echt aanwezig en niet afgeleid?',               type: 'schaal', min: 'Continu afgeleid',     max: 'Volledig aanwezig',   verplicht: true },
  { code: 'emotieregulatie',     label: 'Hoe goed kon je omgaan met frustraties en tegenslagen?',             type: 'schaal', min: 'Slecht',               max: 'Uitstekend',          verplicht: true },
  { code: 'overspoeld',          label: 'Voelde je je overspoeld of overweldigd door alles wat op je afkwam?',type: 'schaal', min: 'Ja, constant',         max: 'Nee, helemaal niet',  verplicht: true },
  { code: 'mentale_ruimte',      label: 'Had je mentale ruimte voor creativiteit, rust en nieuwe ideeën?',    type: 'schaal', min: 'Geen ruimte',          max: 'Veel ruimte',         verplicht: true },
  { code: 'innerlijke_rust',     label: 'Ervaar je innerlijke rust en kalmte buiten werktijden?',             type: 'schaal', min: 'Nauwelijks',           max: 'Volledig',            verplicht: true },
  { code: 'zelfvertrouwen',      label: 'Hoe sterk was je zelfvertrouwen op het werk deze week?',             type: 'schaal', min: 'Laag zelfvertrouwen',  max: 'Sterk zelfvertrouwen',verplicht: true },
  { code: 'grensenstellen',      label: 'Hoe goed kon je grenzen stellen en "nee" zeggen?',                  type: 'schaal', min: 'Nauwelijks',           max: 'Uitstekend',          verplicht: true },
  { code: 'veerkracht',          label: 'Hoe veerkrachtig voelde je je bij tegenslagen of fouten?',           type: 'schaal', min: 'Snel ondersteboven',   max: 'Sterk en veerkrachtig',verplicht: true },
]

const MENTAAL_TEKST: Vraag[] = [
  { code: 'mentaal_tekst',     label: 'Wat houdt je mentaal het meest bezig op het werk?',                                 type: 'tekst', verplicht: false, beschrijving: 'Optioneel — volledig anoniem.' },
  { code: 'burnout_signaal',   label: 'Heb je tekenen van overbelasting bij jezelf gemerkt deze week?',                    type: 'tekst', verplicht: false, beschrijving: 'Denk aan: altijd moe, snel geïrriteerd, niets kunnen afronden. Optioneel.' },
  { code: 'mentaal_positief',  label: 'Wat hielp je om mentaal sterk te blijven deze week?',                               type: 'tekst', verplicht: false },
  { code: 'mentaal_advies',    label: 'Wat zou je jezelf adviseren voor de komende week om mentaal beter voor jezelf te zorgen?', type: 'tekst', verplicht: false },
  { code: 'gedachte_moment',   label: 'Beschrijf een moment waarop je écht tot rust kon komen deze week.',                type: 'tekst', verplicht: false },
]

// ── Werk & Motivatie pool ─────────────────────────────────────────────────

const WERK_SCHAAL: Vraag[] = [
  { code: 'werkdruk',           label: 'Hoe ervaarde je de werkdruk deze week?',                                   type: 'schaal', min: 'Veel te hoog',       max: 'Prima behapbaar',    verplicht: true },
  { code: 'motivatie',          label: 'Hoe gemotiveerd was je om je werk goed te doen?',                          type: 'schaal', min: 'Helemaal niet',      max: 'Zeer gemotiveerd',   verplicht: true },
  { code: 'zingeving',          label: 'In welke mate vond je je werk zinvol en betekenisvol?',                    type: 'schaal', min: 'Zinloos',            max: 'Zeer zinvol',        verplicht: true },
  { code: 'autonomie',          label: 'Had je voldoende vrijheid om je werk zelf in te richten?',                 type: 'schaal', min: 'Geen vrijheid',      max: 'Volledige vrijheid', verplicht: true },
  { code: 'waardering',         label: 'Voelde je je gewaardeerd voor je inzet en bijdrage?',                      type: 'schaal', min: 'Helemaal niet',      max: 'Volledig',           verplicht: true },
  { code: 'duidelijkheid',      label: 'Was het duidelijk wat er van je verwacht werd?',                           type: 'schaal', min: 'Onduidelijk',        max: 'Volkomen duidelijk', verplicht: true },
  { code: 'werk_uitdaging',     label: 'Vond je je werk voldoende uitdagend?',                                     type: 'schaal', min: 'Te saai / te zwaar', max: 'Perfect uitdagend',  verplicht: true },
  { code: 'taakafronding',      label: 'Hoe tevreden was je over wat je hebt afgerond en bereikt?',                type: 'schaal', min: 'Ontevreden',         max: 'Zeer tevreden',      verplicht: true },
  { code: 'flow',               label: 'Had je momenten van "flow" — volledig opgaan in je werk?',                 type: 'schaal', min: 'Geen enkele keer',   max: 'Veelvuldig',         verplicht: true },
  { code: 'werklust',           label: 'Hoe enthousiast en energiek ging je deze week naar je werk?',              type: 'schaal', min: 'Met tegenzin',       max: 'Erg enthousiast',    verplicht: true },
  { code: 'baantevredenheid',   label: 'Hoe tevreden ben je in het algemeen met je huidige functie?',              type: 'schaal', min: 'Ontevreden',         max: 'Zeer tevreden',      verplicht: true },
  { code: 'prioriteiten',       label: 'Hoe goed lukte het om je prioriteiten te beheren en te focussen?',         type: 'schaal', min: 'Slecht',             max: 'Uitstekend',         verplicht: true },
  { code: 'vergaderen',         label: 'Waren vergaderingen en overleggen zinvol en effectief?',                   type: 'schaal', min: 'Tijdverspilling',    max: 'Zeer waardevol',     verplicht: true },
  { code: 'administratie',      label: 'Ervaarde je de administratieve last als acceptabel?',                      type: 'schaal', min: 'Veel te hoog',       max: 'Prima in orde',      verplicht: true },
  { code: 'rolvervulling',      label: 'In welke mate kon je je rol volledig invullen zoals jij dat wil?',         type: 'schaal', min: 'Helemaal niet',      max: 'Volledig',           verplicht: true },
  { code: 'werk_plezier',       label: 'Hoeveel plezier haalde je uit je dagelijkse werkzaamheden?',               type: 'schaal', min: 'Geen plezier',       max: 'Veel plezier',       verplicht: true },
  { code: 'besluitvorming',     label: 'Kon je zelf voldoende beslissingen nemen zonder te hoeven wachten?',       type: 'schaal', min: 'Geblokkeerd',        max: 'Volledig empowered', verplicht: true },
  { code: 'werk_impact',        label: 'Zag je deze week de impact van je werk op je collega\'s of klanten?',     type: 'schaal', min: 'Helemaal niet',      max: 'Duidelijk zichtbaar',verplicht: true },
]

const WERK_TEKST: Vraag[] = [
  { code: 'werk_motivatie_tekst',label: 'Wat motiveert of demotiveert je het meest in je werk?',                   type: 'tekst', verplicht: false },
  { code: 'verbetervoorstel',    label: 'Heb je een concreet voorstel om de werkbeleving te verbeteren?',          type: 'tekst', verplicht: false, beschrijving: 'Optioneel — jouw input wordt anoniem gedeeld met HR.' },
  { code: 'werk_highlight',      label: 'Wat was je grootste werkprestatie of trots moment deze week?',            type: 'tekst', verplicht: false },
  { code: 'werk_frustratie',     label: 'Wat zorgde voor de meeste frustratie of weerstand op het werk?',         type: 'tekst', verplicht: false },
  { code: 'werk_intentie',       label: 'Wat is jouw belangrijkste werkdoel of focus voor de komende week?',      type: 'tekst', verplicht: false },
]

// ── Team & Samenwerking pool ──────────────────────────────────────────────

const SOCIAAL_SCHAAL: Vraag[] = [
  { code: 'sociaal_team',        label: 'Hoe prettig verliep de samenwerking met je collega\'s?',                 type: 'schaal', min: 'Zeer moeizaam',      max: 'Uitstekend',          verplicht: true },
  { code: 'sociaal_steun',       label: 'Had je het gevoel dat je bij collega\'s of leidinggevende terecht kon?', type: 'schaal', min: 'Helemaal niet',      max: 'Altijd',              verplicht: true },
  { code: 'veiligheid',          label: 'Voelde je je psychologisch veilig om jezelf te zijn op het werk?',       type: 'schaal', min: 'Helemaal niet',      max: 'Volledig',            verplicht: true },
  { code: 'communicatie',        label: 'Hoe verliep de communicatie en informatiedeling in het team?',           type: 'schaal', min: 'Zeer slecht',        max: 'Uitstekend',          verplicht: true },
  { code: 'teamsfeer',           label: 'Hoe was de algemene sfeer en energie in het team?',                      type: 'schaal', min: 'Negatief',           max: 'Positief',            verplicht: true },
  { code: 'leidinggevende',      label: 'Hoe tevreden ben je met de aansturing van je leidinggevende?',           type: 'schaal', min: 'Ontevreden',         max: 'Zeer tevreden',       verplicht: true },
  { code: 'vertrouwen',          label: 'Hoe groot is het onderlinge vertrouwen tussen collega\'s?',              type: 'schaal', min: 'Weinig vertrouwen',  max: 'Volledig vertrouwen', verplicht: true },
  { code: 'inclusie',            label: 'Voelde je je geïncludeerd en gewaardeerd als teamlid?',                  type: 'schaal', min: 'Buitengesloten',     max: 'Volledig erbij',      verplicht: true },
  { code: 'informatiedeling',    label: 'Werd relevante informatie goed en tijdig gedeeld binnen het team?',      type: 'schaal', min: 'Slecht',             max: 'Uitstekend',          verplicht: true },
  { code: 'conflicten',          label: 'Hoe constructief werden conflicten of meningsverschillen opgelost?',     type: 'schaal', min: 'Destructief',        max: 'Constructief',        verplicht: true },
  { code: 'collega_relaties',    label: 'Hoe goed en prettig zijn je persoonlijke relaties met collega\'s?',      type: 'schaal', min: 'Slecht',             max: 'Uitstekend',          verplicht: true },
  { code: 'manager_toegang',     label: 'Hoe toegankelijk was je leidinggevende voor vragen en overleg?',         type: 'schaal', min: 'Onbereikbaar',       max: 'Altijd beschikbaar',  verplicht: true },
  { code: 'teamdoelen',          label: 'Was het duidelijk waar het team naartoe werkt?',                         type: 'schaal', min: 'Volledig onduidelijk',max: 'Kristalhelder',       verplicht: true },
  { code: 'samenwerking_plezier',label: 'Hoeveel plezier haalde je uit de samenwerking met anderen?',            type: 'schaal', min: 'Geen plezier',       max: 'Veel plezier',        verplicht: true },
  { code: 'erkenning_team',      label: 'Erkende je leidinggevende of team jouw inzet en prestaties?',            type: 'schaal', min: 'Helemaal niet',      max: 'Duidelijk en regelmatig', verplicht: true },
]

const SOCIAAL_TEKST: Vraag[] = [
  { code: 'sociaal_tekst',       label: 'Is er iets over de teamdynamiek of samenwerking dat je wil delen?',     type: 'tekst', verplicht: false },
  { code: 'omgeving_tekst',      label: 'Wat kan er verbeteren aan de werkomgeving (kantoor, tools, thuiswerken)?', type: 'tekst', verplicht: false },
  { code: 'sociaal_positief',    label: 'Wat waardeer je het meest aan je team of collega\'s?',                   type: 'tekst', verplicht: false },
  { code: 'sociaal_verbeter',    label: 'Hoe kan de samenwerking of teamcommunicatie worden verbeterd?',          type: 'tekst', verplicht: false },
  { code: 'leiderschap_feedback',label: 'Heb je feedback voor je leidinggevende (anoniem)?',                     type: 'tekst', verplicht: false },
]

// ── Groei & Ontwikkeling pool ─────────────────────────────────────────────

const GROEI_SCHAAL: Vraag[] = [
  { code: 'feedback_kwaliteit',  label: 'Hoe tevreden ben je met de feedback die je ontvangt op je werk?',       type: 'schaal', min: 'Ontevreden',         max: 'Zeer tevreden',       verplicht: true },
  { code: 'leren',               label: 'Had je voldoende ruimte om bij te leren en te groeien?',                 type: 'schaal', min: 'Geen ruimte',        max: 'Veel ruimte',         verplicht: true },
  { code: 'loopbaan',            label: 'Hoe tevreden ben je met je loopbaanperspectief binnen dit bedrijf?',     type: 'schaal', min: 'Ontevreden',         max: 'Zeer tevreden',       verplicht: true },
  { code: 'erkenning',           label: 'Voel je dat je sterke punten worden herkend en ingezet?',               type: 'schaal', min: 'Helemaal niet',      max: 'Volledig',            verplicht: true },
  { code: 'doelen_voortgang',    label: 'Hoe goed werk je toe naar je persoonlijke of professionele doelen?',    type: 'schaal', min: 'Geen voortgang',     max: 'Goede voortgang',     verplicht: true },
  { code: 'vaardigheidsgroei',   label: 'In welke mate heb je nieuwe vaardigheden of inzichten ontwikkeld?',     type: 'schaal', min: 'Helemaal niets',     max: 'Heel veel',           verplicht: true },
  { code: 'coaching',            label: 'Hoe tevreden ben je met de coaching of begeleiding die je ontvangt?',   type: 'schaal', min: 'Ontevreden',         max: 'Zeer tevreden',       verplicht: true },
  { code: 'innovatieruimte',     label: 'Had je ruimte voor eigen initiatieven, experimenten en vernieuwing?',   type: 'schaal', min: 'Geen ruimte',        max: 'Veel ruimte',         verplicht: true },
  { code: 'kennisdeling',        label: 'Werd kennis en expertise goed gedeeld binnen het team?',                type: 'schaal', min: 'Nauwelijks',         max: 'Actief en goed',      verplicht: true },
  { code: 'ontwikkelplan',       label: 'Hoe concreet en bruikbaar vind je je persoonlijk ontwikkelplan?',       type: 'schaal', min: 'Vaag of ontbrekend', max: 'Concreet en nuttig',  verplicht: true },
  { code: 'uitdaging_groei',     label: 'Strekten je taken je voldoende uit om te leren en te groeien?',         type: 'schaal', min: 'Te routine',         max: 'Continu groei',       verplicht: true },
  { code: 'zelfstandigheid',     label: 'In welke mate kan je zelfstandig en pro-actief handelen?',              type: 'schaal', min: 'Sterk beperkt',      max: 'Volledig autonoom',   verplicht: true },
]

const GROEI_TEKST: Vraag[] = [
  { code: 'groei_doelen',        label: 'Aan welk persoonlijk of professioneel doel werk je momenteel?',         type: 'tekst', verplicht: false },
  { code: 'leermoment',          label: 'Wat was je grootste leermoment of inzicht deze week?',                  type: 'tekst', verplicht: false },
  { code: 'groei_obstakel',      label: 'Wat houdt je het meest tegen in je professionele groei?',               type: 'tekst', verplicht: false },
  { code: 'groei_wens',          label: 'Welke vaardigheid of kennis wil je het meest ontwikkelen?',             type: 'tekst', verplicht: false },
  { code: 'toekomst_visie',      label: 'Hoe zie jij je rol of functie evolueren de komende 6 maanden?',         type: 'tekst', verplicht: false },
]

// ── Afsluiting pool ───────────────────────────────────────────────────────
// De 3 schaalvragen zijn altijd aanwezig (KPIs), tekstvragen wisselen

const AFSLUITING_SCHAAL_VAST: Vraag[] = [
  { code: 'algemeen_welzijn',  label: 'Geef je algeheel welzijn deze week een cijfer.',                          type: 'schaal', min: 'Zeer slecht',    max: 'Uitstekend',     verplicht: true },
  { code: 'intentie_blijven',  label: 'Hoe sterk is je intentie om de komende 12 maanden bij dit bedrijf te blijven?', type: 'schaal', min: 'Zeker vertrekken', max: 'Zeker blijven', verplicht: true },
  { code: 'aanbeveling',       label: 'Zou je dit bedrijf aanbevelen als werkgever aan iemand in je omgeving?',  type: 'schaal', min: 'Nooit',          max: 'Zeker wel',      verplicht: true },
]

const AFSLUITING_TEKST: Vraag[] = [
  { code: 'positief',          label: 'Wat ging er goed of wat ben je dankbaar voor deze week?',                 type: 'tekst', verplicht: false },
  { code: 'aandacht',          label: 'Is er iets dat meer aandacht verdient van je werkgever of leidinggevende?', type: 'tekst', verplicht: false },
  { code: 'toelichting',       label: 'Is er iets anders dat je wil delen?',                                     type: 'tekst', verplicht: false, beschrijving: 'Volledig anoniem en alleen zichtbaar voor HR.' },
  { code: 'weekoverzicht',     label: 'Hoe zou je in één zin je week omschrijven?',                              type: 'tekst', verplicht: false },
  { code: 'volgende_intentie', label: 'Wat is jouw focus of intentie voor de komende week?',                     type: 'tekst', verplicht: false },
  { code: 'energie_boost',     label: 'Wat gaf je de meeste energie of voldoening deze week?',                   type: 'tekst', verplicht: false },
]

// ─── Legacy keys (voor backward compat met HR-dashboard) ──────────────────

const LEGACY_KEYS = [
  'energie', 'slaap', 'fysiek_pijn', 'fysiek_beweging',
  'werkdruk', 'mentaal_focus', 'mentaal_stress', 'mentaal_balans',
  'motivatie', 'sociaal_team', 'sociaal_steun', 'herstel',
]

// ─── Sectie-opbouw op basis van seed ─────────────────────────────────────

function bouwSecties(seed: number): Sectie[] {
  const pick = <T,>(arr: T[], n: number, offset: number): T[] =>
    seededShuffle(arr, seed + offset).slice(0, Math.min(n, arr.length))

  return [
    {
      ...SECTIE_META[0],
      vragen: [
        ...pick(ENERGIE_SCHAAL, SELECTIE.energie.schaal, 1),
        ...pick(ENERGIE_TEKST,  SELECTIE.energie.tekst,  2),
      ],
    },
    {
      ...SECTIE_META[1],
      vragen: [
        ...pick(MENTAAL_SCHAAL, SELECTIE.mentaal.schaal, 3),
        ...pick(MENTAAL_TEKST,  SELECTIE.mentaal.tekst,  4),
      ],
    },
    {
      ...SECTIE_META[2],
      vragen: [
        ...pick(WERK_SCHAAL, SELECTIE.werk.schaal, 5),
        ...pick(WERK_TEKST,  SELECTIE.werk.tekst,  6),
      ],
    },
    {
      ...SECTIE_META[3],
      vragen: [
        ...pick(SOCIAAL_SCHAAL, SELECTIE.sociaal.schaal, 7),
        ...pick(SOCIAAL_TEKST,  SELECTIE.sociaal.tekst,  8),
      ],
    },
    {
      ...SECTIE_META[4],
      vragen: [
        ...pick(GROEI_SCHAAL, SELECTIE.groei.schaal, 9),
        ...pick(GROEI_TEKST,  SELECTIE.groei.tekst,  10),
      ],
    },
    {
      ...SECTIE_META[5],
      vragen: [
        ...AFSLUITING_SCHAAL_VAST,
        ...pick(AFSLUITING_TEKST, SELECTIE.afsluiting.tekst, 11),
      ],
    },
  ]
}

// ─── Helper ───────────────────────────────────────────────────────────────

function maandagVanDezeWeek(): string {
  const nu = new Date()
  const dag = nu.getDay() === 0 ? 6 : nu.getDay() - 1
  const maandag = new Date(nu)
  maandag.setDate(nu.getDate() - dag)
  maandag.setHours(0, 0, 0, 0)
  return maandag.toISOString().slice(0, 10)
}

// ─── Component ────────────────────────────────────────────────────────────

export default function CheckIn() {
  const router = useRouter()
  const topRef = useRef<HTMLDivElement>(null)

  const [userId,          setUserId]          = useState<string | null>(null)
  const [bedrijfId,       setBedrijfId]       = useState<string | null>(null)
  const [checkend,        setCheckend]        = useState(true)
  const [alIngevuld,      setAlIngevuld]      = useState(false)
  const [sessieId,        setSessieId]        = useState<string | null>(null)
  const [kanOpnieuw,      setKanOpnieuw]      = useState(false)
  const [volgendeCheckin, setVolgendeCheckin] = useState('')
  const [secties,         setSecties]         = useState<Sectie[]>([])
  const [seed]                                = useState(() => Date.now() % 1000000)

  const [sectieIdx,  setSectieIdx]  = useState(0)
  const [antwoorden, setAntwoorden] = useState<Record<string, number | string>>({})
  const [laden,      setLaden]      = useState(false)
  const [fout,       setFout]       = useState('')

  const weekStart = maandagVanDezeWeek()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

      setSecties(bouwSecties(seed))

      // Controleer of al ingevuld deze week
      const { data: sessie } = await supabase
        .from('checkin_sessies')
        .select('id, aangemaakt_op')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle()

      if (sessie) {
        setAlIngevuld(true)
        setSessieId(sessie.id)
        const uren = (Date.now() - new Date(sessie.aangemaakt_op).getTime()) / 3600000
        setKanOpnieuw(uren < 4)
        const volgende = new Date(weekStart)
        volgende.setDate(volgende.getDate() + 7)
        setVolgendeCheckin(volgende.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' }))
      }

      setCheckend(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, seed])

  async function verwijderSessie() {
    if (!sessieId) return
    setLaden(true)
    await fetch('/api/reset-sessie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessie_id: sessieId, user_id: userId }),
    })
    setAlIngevuld(false)
    setSessieId(null)
    setSectieIdx(0)
    setAntwoorden({})
    setLaden(false)
  }

  const huidigeSectie  = secties[sectieIdx]
  const totaalSecties  = secties.length

  function sectieCompleet(idx: number) {
    if (!secties[idx]) return false
    return secties[idx].vragen
      .filter(v => v.verplicht && v.type === 'schaal')
      .every(v => antwoorden[v.code] !== undefined)
  }

  function stelIn(code: string, waarde: number | string) {
    setAntwoorden(prev => ({ ...prev, [code]: waarde }))
  }

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function volgendeSectie() {
    if (!sectieCompleet(sectieIdx)) return
    setFout('')
    if (sectieIdx < totaalSecties - 1) {
      setSectieIdx(s => s + 1)
      scrollTop()
    } else {
      submit()
    }
  }

  function vorigeSectie() {
    setSectieIdx(s => Math.max(0, s - 1))
    scrollTop()
  }

  function vulAutomatischIn() {
    const auto: Record<string, number | string> = {}
    for (const sectie of secties) {
      for (const vraag of sectie.vragen) {
        if (vraag.type === 'schaal') {
          auto[vraag.code] = Math.ceil(Math.random() * 5)
        }
      }
    }
    setAntwoorden(prev => ({ ...prev, ...auto }))
    setSectieIdx(secties.length - 1)
    scrollTop()
  }

  async function submit() {
    if (!userId) return
    setLaden(true)
    setFout('')

    try {
      // Bouw rijen op voor de API
      const rijen = Object.entries(antwoorden)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([code, waarde]) => {
          const sectieObj = secties.find(s => s.vragen.some(v => v.code === code))
          return {
            vraag_code: code,
            categorie: sectieObj?.id ?? null,
            waarde_schaal: typeof waarde === 'number' ? waarde : null,
            waarde_tekst: typeof waarde === 'string' && waarde.trim() ? waarde.trim() : null,
          }
        })

      // Submit via server-side API (admin client, bypassed RLS)
      const res  = await fetch('/api/submit-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, bedrijf_id: bedrijfId, week_start: weekStart, rijen }),
      })
      const data = await res.json()

      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)

      const sessieId = data.sessie_id

      // Bereken categoriescores voor de bedankt-pagina
      const catTotalen: Record<string, number[]> = {
        energie: [], mentaal: [], werk: [], sociaal: [], groei: [], afsluiting: [],
      }
      for (const sectie of secties) {
        for (const vraag of sectie.vragen) {
          const w = antwoorden[vraag.code]
          if (typeof w === 'number') catTotalen[sectie.id]?.push(w)
        }
      }
      const avg = (arr: number[]) =>
        arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0

      const e = avg(catTotalen.energie)
      const m = avg(catTotalen.mentaal)
      const w = avg(catTotalen.werk)
      const s = avg(catTotalen.sociaal)
      const g = avg(catTotalen.groei)
      const alle = [
        ...catTotalen.energie, ...catTotalen.mentaal, ...catTotalen.werk,
        ...catTotalen.sociaal, ...catTotalen.groei,
      ]
      const t = avg(alle)

      const params = new URLSearchParams({
        e: String(e), m: String(m), w: String(w),
        s: String(s), g: String(g), t: String(t),
        seed: String(hashCode(userId + weekStart) % 1000),
        sessie: sessieId,
      })
      router.push(`/bedankt?${params.toString()}`)
    } catch (err) {
      console.error('[checkin submit]', err)
      setFout(`Opslaan mislukt: ${err instanceof Error ? err.message : String(err)}`)
      setLaden(false)
    }
  }

  // ── Laadscherm ─────────────────────────────────────────────────────────────

  if (checkend || secties.length === 0) return (
    <main className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin"
        style={{ borderTopColor: '#1D9E75' }} />
    </main>
  )

  // ── Al ingevuld ────────────────────────────────────────────────────────────

  if (alIngevuld) return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#E1F5EE' }}>
          <span style={{ color: '#1D9E75', fontSize: 22 }}>✓</span>
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Al ingevuld deze week</h2>
        <p className="text-gray-500 text-sm mb-2 leading-relaxed">Je check-in is ontvangen. Bedankt!</p>
        <p className="text-xs text-gray-400 mb-6">
          Volgende check-in: <span className="font-medium text-gray-600">{volgendeCheckin}</span>
        </p>

        {kanOpnieuw && (
          <div className="rounded-xl p-4 mb-4 text-left"
            style={{ background: '#FAEEDA', borderLeft: '3px solid #BA7517' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#854F0B' }}>
              Wil je je antwoorden aanpassen?
            </p>
            <p className="text-xs mb-3" style={{ color: '#854F0B' }}>
              Je kan je check-in opnieuw invullen binnen 4 uur na het indienen.
            </p>
            <button
              onClick={verwijderSessie}
              disabled={laden}
              className="w-full py-2 rounded-lg text-xs font-medium transition disabled:opacity-40"
              style={{ background: '#854F0B', color: 'white' }}>
              {laden ? 'Bezig...' : 'Opnieuw invullen'}
            </button>
          </div>
        )}

        {/* Tijdelijke testknop — altijd beschikbaar */}
        <div className="rounded-xl p-4 mb-6 text-left"
          style={{ background: '#F3F4F6', borderLeft: '3px solid #9ca3af' }}>
          <p className="text-xs font-medium mb-1 text-gray-500">Testmodus</p>
          <p className="text-xs mb-3 text-gray-400">
            Bypass de wekelijkse limiet en vul de check-in opnieuw in.
          </p>
          <button
            onClick={verwijderSessie}
            disabled={laden}
            className="w-full py-2 rounded-lg text-xs font-medium transition disabled:opacity-40"
            style={{ background: '#6b7280', color: 'white' }}>
            {laden ? 'Bezig...' : 'Opnieuw invullen (test)'}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/portaal"
            className="w-full inline-block text-center text-white rounded-xl py-3 text-sm font-medium"
            style={{ background: '#1D9E75' }}>
            Mijn portaal bekijken
          </Link>
          <Link href="/dashboard"
            className="w-full inline-block text-center border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition">
            Naar HR-dashboard
          </Link>
        </div>
      </div>
    </main>
  )

  // ── Formulier ──────────────────────────────────────────────────────────────

  const beantwoord = secties.slice(0, sectieIdx).reduce(
    (sum, s) => sum + s.vragen.filter(v => v.type === 'schaal').length, 0
  )
  const totaalSchaal = secties.reduce(
    (sum, s) => sum + s.vragen.filter(v => v.type === 'schaal').length, 0
  )
  const voortgangPct = Math.round((beantwoord / totaalSchaal) * 100)

  const aantalTekst  = Object.values(antwoorden).filter(v => typeof v === 'string' && (v as string).trim()).length
  const aantalSchaal = Object.values(antwoorden).filter(v => typeof v === 'number').length

  return (
    <main className="min-h-screen pb-16"
      style={{ background: 'linear-gradient(160deg, #F0FAF6 0%, #EBF4FB 50%, #F5F3FF 100%)' }}>

      {/* Sticky header */}
      <div ref={topRef} className="sticky top-0 z-20 border-b"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderColor: '#e5e7eb' }}>
        <div className="max-w-2xl mx-auto px-5 py-3">

          {/* Sectie pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide mb-2.5">
            {secties.map((s, i) => {
              const klaar  = i < sectieIdx
              const actief = i === sectieIdx
              return (
                <button
                  key={s.id}
                  onClick={() => i < sectieIdx && setSectieIdx(i)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition"
                  style={{
                    background: actief ? s.kleur : klaar ? s.kleur + '20' : '#F3F4F6',
                    color:      actief ? 'white'  : klaar ? s.kleur        : '#9ca3af',
                    cursor:     i < sectieIdx ? 'pointer' : 'default',
                  }}
                >
                  {klaar && <span>✓</span>}
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>

          {/* Voortgangsbalk + auto-invullen */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${voortgangPct}%`, background: huidigeSectie.kleur }} />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{voortgangPct}%</span>
            <button
              onClick={vulAutomatischIn}
              className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium transition"
              style={{ background: '#F3F4F6', color: '#6b7280' }}
              title="Auto-invullen voor test">
              Auto
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-8">

        {/* Sectie header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
              style={{ background: huidigeSectie.licht, color: huidigeSectie.kleur }}>
              {sectieIdx + 1}
            </div>
            <div>
              <p className="text-xs text-gray-400">Sectie {sectieIdx + 1} van {totaalSecties}</p>
              <h1 className="text-lg font-semibold text-gray-900">{huidigeSectie.label}</h1>
            </div>
          </div>
        </div>

        {/* Vragen */}
        <div className="flex flex-col gap-5">
          {huidigeSectie.vragen.map((vraag) => (
            <VraagKaart
              key={vraag.code}
              vraag={vraag}
              waarde={antwoorden[vraag.code]}
              kleur={huidigeSectie.kleur}
              licht={huidigeSectie.licht}
              onChange={(v) => stelIn(vraag.code, v)}
            />
          ))}
        </div>

        {/* Fout */}
        {fout && (
          <div className="mt-5 rounded-xl p-4" style={{ background: '#FCEBEB', borderLeft: '3px solid #E24B4A' }}>
            <p className="text-sm text-red-700">{fout}</p>
          </div>
        )}

        {/* Statistieken */}
        <div className="mt-5 flex gap-3 text-xs text-gray-400">
          <span>{aantalSchaal} schaalvragen ingevuld</span>
          {aantalTekst > 0 && <span>· {aantalTekst} tekstvelden</span>}
        </div>

        {/* Navigatie */}
        <div className="flex gap-3 mt-6">
          {sectieIdx > 0 && (
            <button
              onClick={vorigeSectie}
              className="px-6 py-3.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
              Vorige
            </button>
          )}
          <button
            onClick={volgendeSectie}
            disabled={!sectieCompleet(sectieIdx) || laden}
            className="flex-1 py-3.5 rounded-xl text-white font-semibold text-sm transition disabled:opacity-30 flex items-center justify-center gap-2"
            style={{ background: huidigeSectie.kleur }}
          >
            {laden && (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            {laden
              ? 'Opslaan...'
              : sectieIdx === totaalSecties - 1
                ? 'Afronden en opslaan'
                : 'Volgende sectie'
            }
          </button>
        </div>

        {!sectieCompleet(sectieIdx) && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Beantwoord alle schaalvragen om verder te gaan.
          </p>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          Alle antwoorden zijn anoniem en beveiligd.
        </p>
      </div>
    </main>
  )
}

// ─── VraagKaart component ──────────────────────────────────────────────────

function VraagKaart({
  vraag, waarde, kleur, licht, onChange,
}: {
  vraag:    Vraag
  waarde:   number | string | undefined
  kleur:    string
  licht:    string
  onChange: (v: number | string) => void
}) {
  const geselecteerd = typeof waarde === 'number' ? waarde : null

  if (vraag.type === 'schaal') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5"
        style={{ borderLeft: geselecteerd ? `3px solid ${kleur}` : '3px solid transparent' }}>
        <p className="text-sm font-medium text-gray-900 mb-4 leading-snug">{vraag.label}</p>

        <div className="flex gap-2 mb-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all border"
              style={{
                background:   geselecteerd === n ? kleur : licht + '40',
                borderColor:  geselecteerd === n ? kleur : '#e5e7eb',
                color:        geselecteerd === n ? 'white' : geselecteerd && geselecteerd > n ? kleur : '#9ca3af',
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {(vraag.min || vraag.max) && (
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{vraag.min}</span>
            <span>{vraag.max}</span>
          </div>
        )}
      </div>
    )
  }

  const tekst = typeof waarde === 'string' ? waarde : ''
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start gap-2 mb-3">
        <p className="text-sm font-medium text-gray-900 flex-1 leading-snug">{vraag.label}</p>
        <span className="text-xs text-gray-300 flex-shrink-0 mt-0.5">optioneel</span>
      </div>
      {vraag.beschrijving && (
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{vraag.beschrijving}</p>
      )}
      <textarea
        rows={3}
        value={tekst}
        onChange={e => onChange(e.target.value)}
        placeholder="Schrijf hier je antwoord..."
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none transition"
        onFocus={e => e.target.style.borderColor = kleur}
        onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
      />
      {tekst && (
        <p className="text-xs text-gray-300 text-right mt-1">{tekst.length} tekens</p>
      )}
    </div>
  )
}
