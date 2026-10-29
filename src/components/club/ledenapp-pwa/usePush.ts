'use client'

import { useCallback, useEffect, useState } from 'react'
import { isIos } from '@/lib/club/ledenapp-pwa/installeren'
import { GEMELD_SLEUTEL, gemeldWaarde, moetStilMelden, pushStand, sleutelNaarBytes, type PushStand } from '@/lib/club/push/toestel'
import { SW_PAD, SW_SCOPE } from './RegistreerSw'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { LID_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/inloggen'

// De stand van push op dit toestel, plus aan- en uitzetten. Toestemming vragen
// gebeurt ALLEEN in `aanzetten`, dus alleen na een tik van het lid.

const API = '/api/club/lid/push'

export interface PushStaat {
  /** null = nog aan het kijken. */
  stand: PushStand | null
  aan: boolean
  bezig: boolean
  fout: string | null
  toestemming: NotificationPermission | null
  aanzetten: () => Promise<void>
  uitzetten: () => Promise<void>
}

function leesStand(): { stand: PushStand; toestemming: NotificationPermission | null } {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  const heeftNotification = 'Notification' in window
  const toestemming = heeftNotification ? Notification.permission : null
  const standalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
  const stand = pushStand({
    heeftServiceWorker: 'serviceWorker' in nav,
    heeftPushManager: 'PushManager' in window,
    heeftNotification,
    ios: isIos({ userAgent: nav.userAgent, platform: nav.platform, maxTouchPoints: nav.maxTouchPoints, standalone }),
    standalone,
    toestemming,
  })
  return { stand, toestemming }
}

async function registratie(): Promise<ServiceWorkerRegistration> {
  const bestaand = await navigator.serviceWorker.getRegistration(SW_SCOPE)
  if (bestaand) return bestaand
  await navigator.serviceWorker.register(SW_PAD, { scope: SW_SCOPE, updateViaCache: 'none' })
  return navigator.serviceWorker.ready
}

async function stuur(methode: 'POST' | 'DELETE', body: unknown): Promise<boolean> {
  try {
    const res = await fetch(API, { method: methode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}

/** Stil nakijken: 'aan', 'uit' (het lid zette push uit) of null bij een storing. */
async function meldStil(abonnement: PushSubscription): Promise<'aan' | 'uit' | null> {
  try {
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...abonnement.toJSON(), stil: true }), cache: 'no-store' })
    if (!res.ok) return null
    const json: unknown = await res.json().catch(() => null)
    return typeof json === 'object' && json !== null && (json as { aan?: unknown }).aan === false ? 'uit' : 'aan'
  } catch {
    return null
  }
}

function leesGemeld(): string | null {
  try {
    return window.localStorage.getItem(GEMELD_SLEUTEL)
  } catch {
    return null
  }
}

function bewaarGemeld(waarde: string | null): void {
  try {
    if (waarde) window.localStorage.setItem(GEMELD_SLEUTEL, waarde)
    else window.localStorage.removeItem(GEMELD_SLEUTEL)
  } catch {
    // Opslag geblokkeerd: dan meldt de app zich bij een volgende keer opnieuw, stil en zonder schade.
  }
}

export function usePush(sleutel: string | null, merk: string | null = null): PushStaat {
  const t = LID_INLOGGEN[useTaal()].pwa
  const [stand, zetStand] = useState<PushStand | null>(null)
  const [toestemming, zetToestemming] = useState<NotificationPermission | null>(null)
  const [aan, zetAan] = useState(false)
  const [bezig, zetBezig] = useState(false)
  const [fout, zetFout] = useState<string | null>(null)

  useEffect(() => {
    if (!sleutel) return
    let weg = false
    const gelezen = leesStand()
    void (async () => {
      let abonnement: PushSubscription | null = null
      if (gelezen.stand === 'kan') {
        const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE).catch(() => undefined)
        abonnement = (await reg?.pushManager.getSubscription().catch(() => null)) ?? null
      }
      if (weg) return
      zetStand(gelezen.stand)
      zetToestemming(gelezen.toestemming)
      const isAan = abonnement !== null && gelezen.toestemming === 'granted'
      zetAan(isAan)
      // Alleen als dit abonnement in deze sessie nog niet gemeld is: stil nakijken.
      // De server zet een uitgezette voorkeur nooit weer aan; dan staat het hier ook uit.
      if (!isAan || !abonnement || !merk || !moetStilMelden(leesGemeld(), merk, abonnement.endpoint)) return
      const uitslag = await meldStil(abonnement)
      if (weg || uitslag === null) return
      if (uitslag === 'uit') zetAan(false)
      bewaarGemeld(gemeldWaarde(merk, abonnement.endpoint))
    })()
    return () => {
      weg = true
    }
  }, [sleutel, merk])

  const aanzetten = useCallback(async () => {
    if (!sleutel || bezig) return
    zetBezig(true)
    zetFout(null)
    try {
      const keuze = await Notification.requestPermission()
      zetToestemming(keuze)
      if (keuze !== 'granted') {
        if (keuze === 'denied') zetStand('geweigerd')
        return
      }
      const reg = await registratie()
      const oud = await reg.pushManager.getSubscription()
      if (oud) await oud.unsubscribe().catch(() => false)
      const abonnement = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: sleutelNaarBytes(sleutel) })
      if (await stuur('POST', abonnement.toJSON())) {
        zetAan(true)
        if (merk) bewaarGemeld(gemeldWaarde(merk, abonnement.endpoint))
      } else {
        await abonnement.unsubscribe().catch(() => false)
        zetFout(t.foutAan)
      }
    } catch (err) {
      console.error('[club-app] meldingen aanzetten mislukt', err instanceof Error ? err.name : err)
      zetFout(t.foutToestel)
    } finally {
      zetBezig(false)
    }
  }, [sleutel, merk, bezig, t])

  const uitzetten = useCallback(async () => {
    if (bezig) return
    zetBezig(true)
    zetFout(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE)
      const abonnement = (await reg?.pushManager.getSubscription()) ?? null
      const gelukt = await stuur('DELETE', { endpoint: abonnement?.endpoint ?? null })
      // Ook als de server even niet antwoordt: op dit toestel gaat hij hoe dan ook uit.
      if (abonnement) await abonnement.unsubscribe().catch(() => false)
      bewaarGemeld(null)
      zetAan(false)
      if (!gelukt) zetFout(t.foutBijwerken)
    } catch (err) {
      console.error('[club-app] meldingen uitzetten mislukt', err instanceof Error ? err.name : err)
      zetFout(t.foutUit)
    } finally {
      zetBezig(false)
    }
  }, [bezig, t])

  return { stand, aan, bezig, fout, toestemming, aanzetten, uitzetten }
}
