'use client'

import { useCallback, useEffect, useState } from 'react'
import { isIos } from '@/lib/club/ledenapp-pwa/installeren'
import { pushStand, sleutelNaarBytes, type PushStand } from '@/lib/club/push/toestel'
import { SW_PAD, SW_SCOPE } from './RegistreerSw'

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

export function usePush(sleutel: string | null): PushStaat {
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
      // Stil bijwerken: zo staat dit toestel zeker bij het ingelogde lid.
      if (isAan && abonnement) void stuur('POST', abonnement.toJSON())
    })()
    return () => {
      weg = true
    }
  }, [sleutel])

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
      } else {
        await abonnement.unsubscribe().catch(() => false)
        zetFout('Meldingen aanzetten lukte niet. Probeer het straks opnieuw.')
      }
    } catch (err) {
      console.error('[club-app] meldingen aanzetten mislukt', err instanceof Error ? err.name : err)
      zetFout('Meldingen aanzetten lukte niet op dit toestel.')
    } finally {
      zetBezig(false)
    }
  }, [sleutel, bezig])

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
      zetAan(false)
      if (!gelukt) zetFout('Uitgezet op dit toestel. De sportschool kon het nog niet bijwerken; dat gebeurt vanzelf.')
    } catch (err) {
      console.error('[club-app] meldingen uitzetten mislukt', err instanceof Error ? err.name : err)
      zetFout('Meldingen uitzetten lukte niet. Probeer het opnieuw.')
    } finally {
      zetBezig(false)
    }
  }, [bezig])

  return { stand, aan, bezig, fout, toestemming, aanzetten, uitzetten }
}
