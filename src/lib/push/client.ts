// ─── Push-client (Capacitor) ─────────────────────────────────────────────────
// Bruggetje naar de native push-plugin. In de browser is alles een nette no-op
// ('onbeschikbaar'), zodat dezelfde code overal draait. Het apparaat-token komt
// via de 'registration'-listener binnen en gaat dan naar /api/push/token.

import { authFetch } from '@/lib/auth/auth-fetch'

export type PushStatus = 'granted' | 'denied' | 'prompt' | 'onbeschikbaar'

type PushPlugin = (typeof import('@capacitor/push-notifications'))['PushNotifications']

interface GeladenPlugin {
  PushNotifications: PushPlugin
  platform: string
}

let listenersOpgezet = false

/** Laadt de plugin alleen op een native platform; anders null (browser). */
async function laadPlugin(): Promise<GeladenPlugin | null> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return null
    const mod = await import('@capacitor/push-notifications')
    return { PushNotifications: mod.PushNotifications, platform: Capacitor.getPlatform() }
  } catch {
    return null
  }
}

async function zetListenersOp(platform: string, pn: PushPlugin): Promise<void> {
  if (listenersOpgezet) return
  listenersOpgezet = true
  await pn.addListener('registration', (token: { value: string }) => {
    authFetch('/api/push/token', {
      method: 'POST',
      body: JSON.stringify({ token: token.value, platform }),
    }).catch(() => { /* offline — volgende keer opnieuw */ })
  })
  await pn.addListener('registrationError', () => { /* stil; UI toont geen valse belofte */ })
  // Tik op een melding: naar het pad dat de server meestuurde (alleen eigen app-paden).
  await pn.addListener('pushNotificationActionPerformed', (actie) => {
    const pad = (actie.notification.data as Record<string, unknown> | undefined)?.pad
    if (isAppPad(pad)) window.location.assign(pad)
  })
}

/** Alleen een relatief pad binnen de app ("/1"), nooit een externe of protocol-relatieve URL. */
export function isAppPad(pad: unknown): pad is string {
  return typeof pad === 'string' && /^\/[A-Za-z0-9/_-]*$/.test(pad) && !pad.startsWith('//')
}

/** Huidige permissie-status, zonder iets te vragen. */
export async function pushStatus(): Promise<PushStatus> {
  const p = await laadPlugin()
  if (!p) return 'onbeschikbaar'
  const perm = await p.PushNotifications.checkPermissions()
  return normaliseer(perm.receive)
}

/** Vraagt (indien nodig) toestemming en registreert het apparaat. */
export async function activeerPush(): Promise<PushStatus> {
  const p = await laadPlugin()
  if (!p) return 'onbeschikbaar'
  const { PushNotifications, platform } = p

  let perm = await PushNotifications.checkPermissions()
  if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
    perm = await PushNotifications.requestPermissions()
  }
  if (perm.receive !== 'granted') return normaliseer(perm.receive)

  await zetListenersOp(platform, PushNotifications)
  await PushNotifications.register()
  return 'granted'
}

/** Registreert stil bij het opstarten, maar alleen als toestemming al gegeven is. */
export async function registreerAlsToegestaan(): Promise<void> {
  const p = await laadPlugin()
  if (!p) return
  const perm = await p.PushNotifications.checkPermissions()
  if (perm.receive !== 'granted') return
  await zetListenersOp(p.platform, p.PushNotifications)
  await p.PushNotifications.register()
}

function normaliseer(receive: string): PushStatus {
  if (receive === 'granted') return 'granted'
  if (receive === 'denied') return 'denied'
  return 'prompt'
}
