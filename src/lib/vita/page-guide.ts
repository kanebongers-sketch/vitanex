import type { EmotionState } from '@/lib/vita/emotion-engine'

// ─── Page guide registry ─────────────────────────────────────────────────────
// VITA (de panda) gebruikt dit om per pagina uit te leggen waar je bent, waarom
// het ertoe doet, en wat je hier in één stap kunt doen. Doel: minder muur-van-
// informatie, meer "je gids wijst je de volgende stap" — als een game met levels.

export interface PageGuide {
  /** Korte, herkenbare naam van de pagina. */
  label: string
  /** Eén zin: wat is dit + waarom doet het ertoe (panda-stem, warm en kort). */
  uitleg: string
  /** De concrete volgende stap die je hier kunt zetten. */
  stap?: string
  /** Emotie waarmee de panda deze pagina "binnenkomt". */
  emotion: EmotionState
}

/** Een gids in het register: de teksten staan in vita.paginaGids.<sleutel>. */
interface GidsBron {
  sleutel: string
  emotion: EmotionState
  heeftStap?: boolean
}

// Let op: langste prefix wint (zie getPageGuide). Daarom mogen overlappende
// routes zoals /stemming en /stemming-kalender allebei bestaan.
const GUIDES: Record<string, GidsBron> = {
  '/home': { sleutel: 'home', emotion: 'calm', heeftStap: true },
  '/checkin': { sleutel: 'checkin', emotion: 'curious', heeftStap: true },
  '/stemming-kalender': { sleutel: 'stemmingKalender', emotion: 'curious', heeftStap: true },
  '/stemming': { sleutel: 'stemming', emotion: 'curious', heeftStap: true },
  '/slaap': { sleutel: 'slaap', emotion: 'calm', heeftStap: true },
  '/stress': { sleutel: 'stress', emotion: 'supportive', heeftStap: true },
  '/werkgeluk': { sleutel: 'werkgeluk', emotion: 'curious', heeftStap: true },
  '/psych-veiligheid': { sleutel: 'psychVeiligheid', emotion: 'supportive', heeftStap: true },
  '/inzichten': { sleutel: 'inzichten', emotion: 'focused', heeftStap: true },
  '/patronen': { sleutel: 'patronen', emotion: 'focused', heeftStap: true },
  '/rapport': { sleutel: 'rapport', emotion: 'focused', heeftStap: true },
  '/mijn-rapport': { sleutel: 'mijnRapport', emotion: 'focused', heeftStap: true },
  '/sport': { sleutel: 'sport', emotion: 'motivated', heeftStap: true },
  '/voeding': { sleutel: 'voeding', emotion: 'curious', heeftStap: true },
  '/water': { sleutel: 'water', emotion: 'motivated', heeftStap: true },
  '/gezondheid': { sleutel: 'gezondheid', emotion: 'focused', heeftStap: true },
  '/focus': { sleutel: 'focus', emotion: 'focused', heeftStap: true },
  '/coach': { sleutel: 'coach', emotion: 'supportive', heeftStap: true },
  '/doelen': { sleutel: 'doelen', emotion: 'motivated', heeftStap: true },
  '/journal': { sleutel: 'journal', emotion: 'calm', heeftStap: true },
  '/meditatie': { sleutel: 'meditatie', emotion: 'calm', heeftStap: true },
  '/ademhaling': { sleutel: 'ademhaling', emotion: 'calm', heeftStap: true },
  '/dankbaarheid': { sleutel: 'dankbaarheid', emotion: 'supportive', heeftStap: true },
  '/reflectie': { sleutel: 'reflectie', emotion: 'curious', heeftStap: true },
  '/groeiplan': { sleutel: 'groeiplan', emotion: 'motivated', heeftStap: true },
  '/disc': { sleutel: 'disc', emotion: 'curious', heeftStap: true },
  '/niveau': { sleutel: 'niveau', emotion: 'proud', heeftStap: true },
  '/achievements': { sleutel: 'achievements', emotion: 'proud', heeftStap: true },
  '/voortgang': { sleutel: 'voortgang', emotion: 'motivated', heeftStap: true },
  '/chat': { sleutel: 'chat', emotion: 'supportive', heeftStap: true },
  '/mijn-gesprekken': { sleutel: 'mijnGesprekken', emotion: 'focused', heeftStap: true },
  '/koppelingen': { sleutel: 'koppelingen', emotion: 'focused', heeftStap: true },
  '/stappen': { sleutel: 'stappen', emotion: 'motivated', heeftStap: true },
  '/burnout': { sleutel: 'burnout', emotion: 'supportive', heeftStap: true },
  '/mentale-sterkte': { sleutel: 'mentaleSterkte', emotion: 'focused', heeftStap: true },
  '/doelkeuze': { sleutel: 'doelkeuze', emotion: 'motivated', heeftStap: true },
  '/prestaties': { sleutel: 'prestaties', emotion: 'focused', heeftStap: true },
  '/uitdagingen': { sleutel: 'uitdagingen', emotion: 'motivated', heeftStap: true },
  '/team-uitdagingen': { sleutel: 'teamUitdagingen', emotion: 'motivated', heeftStap: true },
  '/welzijn': { sleutel: 'welzijn', emotion: 'calm', heeftStap: true },
  '/groeien': { sleutel: 'groeien', emotion: 'motivated', heeftStap: true },
  '/actief': { sleutel: 'actief', emotion: 'motivated', heeftStap: true },
  '/nieuws': { sleutel: 'nieuws', emotion: 'curious', heeftStap: true },
  '/bestanden': { sleutel: 'bestanden', emotion: 'focused', heeftStap: true },
  '/protocollen': { sleutel: 'protocollen', emotion: 'focused', heeftStap: true },
  '/profiel': { sleutel: 'profiel', emotion: 'curious', heeftStap: true },
  '/instellingen': { sleutel: 'instellingen', emotion: 'calm', heeftStap: true },
}

// Langste matchende prefix wint, zodat /stemming-kalender niet door /stemming
// wordt opgeslokt.
const SORTED_PREFIXES = Object.keys(GUIDES).sort((a, b) => b.length - a.length)

/** Vertaalt via de meegegeven t (useVertaling in de companion). */
export function getPageGuide(pathname: string, t: (sleutel: string) => string): PageGuide | null {
  for (const prefix of SORTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      const { sleutel, emotion, heeftStap } = GUIDES[prefix]
      const basis = `vita.paginaGids.${sleutel}`
      return {
        label: t(`${basis}.label`),
        uitleg: t(`${basis}.uitleg`),
        stap: heeftStap ? t(`${basis}.stap`) : undefined,
        emotion,
      }
    }
  }
  return null
}
