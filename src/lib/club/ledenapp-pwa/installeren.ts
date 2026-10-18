// ─── Club ledenapp: welke installeerhulp past bij dit toestel (PUUR) ────────
// Android en Chrome geven zelf een installeervraag (beforeinstallprompt); die
// vangt het component op. iPhone en iPad kennen dat niet: daar leggen we uit hoe
// het via de deelknop gaat. Draait de app al vanaf het beginscherm, dan niets.

export type InstalleerOmgeving = 'standalone' | 'ios' | 'anders'

export interface ToestelInfo {
  userAgent: string
  platform: string
  maxTouchPoints: number
  /** display-mode standalone, of navigator.standalone op iOS. */
  standalone: boolean
}

/** iPadOS meldt zich als Mac; met een aanraakscherm is het toch een iPad. */
export function isIos({ userAgent, platform, maxTouchPoints }: ToestelInfo): boolean {
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

export function installeerOmgeving(toestel: ToestelInfo): InstalleerOmgeving {
  if (toestel.standalone) return 'standalone'
  return isIos(toestel) ? 'ios' : 'anders'
}

/** De sleutel in localStorage als het lid de hulp heeft weggeklikt. */
export const WEG_SLEUTEL = 'club-app-installeren-weg'
