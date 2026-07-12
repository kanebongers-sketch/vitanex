import React from 'react'
import type { WellbeingCat } from './weekdoelen'

export const CAT: Record<WellbeingCat, {
  label: string; kleur: string; bg: string; licht: string
  icon: React.ReactNode
}> = {
  slaap: {
    label: 'Slaap', kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', licht: 'color-mix(in srgb, var(--mf-purple) 8%, transparent)',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  },
  stress: {
    label: 'Stress', kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)', licht: 'color-mix(in srgb, var(--mf-red) 8%, transparent)',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  energie: {
    label: 'Energie', kleur: 'var(--mf-amber)', bg: 'var(--mf-amber-light)', licht: 'color-mix(in srgb, var(--mf-amber) 8%, transparent)',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  },
  focus: {
    label: 'Focus', kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)', licht: 'color-mix(in srgb, var(--mf-green) 8%, transparent)',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  },
  balans: {
    label: 'Werk-privé', kleur: 'var(--mf-blue)', bg: 'var(--mf-blue-light)', licht: 'color-mix(in srgb, var(--mf-blue) 8%, transparent)',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12L2 7M12 12l10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  },
  motivatie: {
    label: 'Motivatie', kleur: 'var(--mf-rose)', bg: 'var(--mf-rose-light)', licht: 'color-mix(in srgb, var(--mf-rose) 8%, transparent)',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
}

export const DOELKEUZE_OPTIES: Record<WellbeingCat, Array<{ titel: string; beschrijving: string }>> = {
  slaap: [
    { titel: 'Elke nacht voor 23:00 in bed', beschrijving: 'Vaste bedtijden geven je lichaam een ritme en verbeteren je slaapkwaliteit structureel.' },
    { titel: 'Geen schermen 1 uur voor het slapen', beschrijving: 'Blauw licht vermindert de aanmaak van melatonine en houdt je langer wakker.' },
    { titel: 'Ontspanningsroutine voor het slapen', beschrijving: '10 minuten lezen, ademen of stretchen voor een betere overgang naar slaap.' },
  ],
  stress: [
    { titel: 'Dagelijks 10 minuten ademhalingsoefening', beschrijving: 'Bewuste ademhaling activeert je parasympatisch zenuwstelsel en verlaagt spanning direct.' },
    { titel: 'Dagelijks een wandeling van 20 minuten', beschrijving: 'Beweging buiten verlaagt cortisol aantoonbaar en verbetert je stemming.' },
    { titel: 'Eén uur per dag volledig offline', beschrijving: 'Afgeschermd van meldingen geeft je hoofd rust en verlaagt mentale belasting.' },
  ],
  energie: [
    { titel: '3× per week 30 minuten bewegen', beschrijving: 'Regelmatige beweging verhoogt je energieniveau structureel — ook op niet-sport dagen.' },
    { titel: 'Elke dag een gezonde lunch plannen', beschrijving: 'Voeding heeft directe invloed op je energieniveau en concentratie na de lunch.' },
    { titel: 'Elke middag een korte pauze van 10 minuten', beschrijving: 'Even weglopen van je scherm laadt je batterij op voor de tweede helft van de dag.' },
  ],
  focus: [
    { titel: 'Werk in focusblokken van 45 minuten', beschrijving: 'Gefocust werken met vaste pauzes verhoogt productiviteit en vermindert mentale vermoeidheid.' },
    { titel: "'s Ochtends de 3 belangrijkste taken bepalen", beschrijving: 'Duidelijke prioriteiten stellen voorkomt mentale ruis en besluiteloosheid gedurende de dag.' },
    { titel: 'Telefoon op stil tijdens focustijd', beschrijving: 'Minder afleidingen leidt tot diepere concentratie en méér gedaan in minder tijd.' },
  ],
  balans: [
    { titel: 'Elke dag op vaste tijd stoppen met werken', beschrijving: 'Bewust stoppen beschermt je privétijd en geeft je brein de rust die het nodig heeft.' },
    { titel: 'Eén avond per week volledig offline', beschrijving: 'Digitale detox helpt je hoofd resetten en bevordert dieper herstel.' },
    { titel: 'Lunch altijd buiten het bureau innemen', beschrijving: 'Even weglopen van je werkplek schept mentale ruimte en verhoogt je focus na de pauze.' },
  ],
  motivatie: [
    { titel: 'Wekelijks één energiegever bewust inplannen', beschrijving: 'Tijd maken voor wat je energie geeft houdt je gemotiveerd en veerkrachtig.' },
    { titel: 'Dagelijks 3 dingen opschrijven waar je dankbaar voor bent', beschrijving: 'Dankbaarheidspraktijk verhoogt aantoonbaar geluk, motivatie en veerkracht.' },
    { titel: 'Wekelijks je successen terugblikken', beschrijving: 'Reflectie op je voortgang geeft inzicht in groei en verhoogt je zelfvertrouwen.' },
  ],
}
