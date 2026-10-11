'use client'

// Health Connect op Android: de enige weg naar stappen, slaap en hartslag van
// Samsung Health, Fitbit en Google Fit sinds Google Fit stopt. De kaart
// loopt de echte toestanden af: niet geïnstalleerd → installeren, geen
// toestemming → vragen, wel toestemming → syncen en laten zien hoeveel types.

import { useEffect, useState } from 'react'
import { HeartPulse, ExternalLink, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import {
  HC_LEESTYPES, healthConnectBeschikbaarheid, openHealthConnect, verleendeRechten, vraagPermissies,
  type HcBeschikbaarheid,
} from '@/lib/health/health-connect'
import { syncGezondheidsdata } from '@/lib/health/health-sync'
import { useVertaling } from '@/lib/i18n/TaalProvider'

interface Toestand {
  beschikbaarheid: HcBeschikbaarheid
  rechten: number
}

async function leesToestand(): Promise<Toestand> {
  const beschikbaarheid = await healthConnectBeschikbaarheid()
  const rechten = beschikbaarheid === 'beschikbaar' ? (await verleendeRechten()).length : 0
  return { beschikbaarheid, rechten }
}

const tekst = { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, marginTop: 10 } as const

export function HealthConnectKaart() {
  const { toast } = useToast()
  const { t } = useVertaling()
  const [toestand, setToestand] = useState<Toestand | null>(null)
  const [bezig, setBezig] = useState(false)

  useEffect(() => {
    let actief = true
    void leesToestand().then((nieuw) => { if (actief) setToestand(nieuw) })
    return () => { actief = false }
  }, [])

  async function sync() {
    const uitkomst = await syncGezondheidsdata({ forceer: true })
    if (uitkomst && uitkomst.opgeslagen > 0) {
      toast({ title: t(uitkomst.opgeslagen === 1 ? 'account.healthConnect.syncEen' : 'account.healthConnect.syncMeer', { aantal: uitkomst.opgeslagen }), variant: 'success' })
    } else {
      toast({
        title: t('account.healthConnect.geenGegevens'),
        description: t('account.healthConnect.geenGegevensTekst'),
        variant: 'warning',
      })
    }
  }

  async function koppel() {
    setBezig(true)
    try {
      const ok = await vraagPermissies()
      if (!ok) {
        toast({ title: t('account.healthConnect.geenToestemming'), description: t('account.healthConnect.geenToestemmingTekst'), variant: 'warning' })
        return
      }
      setToestand(await leesToestand())
      await sync()
    } finally {
      setBezig(false)
    }
  }

  async function opnieuwSyncen() {
    setBezig(true)
    try { await sync() } finally { setBezig(false) }
  }

  const gekoppeld = (toestand?.rechten ?? 0) > 0

  return (
    <Card style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span aria-hidden style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--brand)' }}>
            <HeartPulse size={20} />
          </span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Health Connect</p>
            <p style={{ fontSize: 12, color: 'var(--text-4)' }}>Samsung Health · Fitbit · Google Fit</p>
            <div style={{ marginTop: 4 }}>
              <Badge variant={gekoppeld ? 'success' : 'neutral'}><span aria-hidden>{gekoppeld ? '● ' : '○ '}</span>{gekoppeld ? t('account.healthConnect.gekoppeld') : t('account.healthConnect.nietGekoppeld')}</Badge>
            </div>
          </div>
        </div>
        <KaartActie toestand={toestand} bezig={bezig} onKoppel={() => void koppel()} onSync={() => void opnieuwSyncen()} />
      </div>
      <Uitleg toestand={toestand} />
    </Card>
  )
}

interface KaartActieProps {
  toestand: Toestand | null
  bezig: boolean
  onKoppel: () => void
  onSync: () => void
}

function KaartActie({ toestand, bezig, onKoppel, onSync }: KaartActieProps) {
  const { t } = useVertaling()
  if (!toestand) return null
  if (toestand.beschikbaarheid === 'niet_geinstalleerd') {
    return <Button size="sm" rightIcon={<ExternalLink size={14} aria-hidden />} onClick={() => void openHealthConnect(true)}>{t('account.healthConnect.installeren')}</Button>
  }
  if (toestand.beschikbaarheid !== 'beschikbaar') return null
  if (toestand.rechten > 0) {
    return <Button variant="secondary" size="sm" loading={bezig} leftIcon={<RefreshCw size={14} aria-hidden />} onClick={onSync}>{t('account.healthConnect.nuSyncen')}</Button>
  }
  return <Button size="sm" loading={bezig} onClick={onKoppel}>{t('account.healthConnect.koppelen')}</Button>
}

function Uitleg({ toestand }: { toestand: Toestand | null }) {
  const { t } = useVertaling()
  if (!toestand) return <p style={tekst}>{t('account.healthConnect.controleren')}</p>
  switch (toestand.beschikbaarheid) {
    case 'niet_geinstalleerd':
      return <p style={tekst}>{t('account.healthConnect.installeerTekst')}</p>
    case 'niet_ondersteund':
      return <p style={tekst}>{t('account.healthConnect.nietOndersteund')}</p>
    case 'geen_android':
      return null
  }
  if (toestand.rechten === 0) {
    return <p style={tekst}>{t('account.healthConnect.zelfKiezen')}</p>
  }
  return (
    <p style={tekst}>
      {t('account.healthConnect.toegang', { aantal: toestand.rechten, totaal: HC_LEESTYPES.length })}{' '}
      <button type="button" onClick={() => void openHealthConnect(false)} className="mf-vandaag-link" style={{ background: 'none', border: 0, padding: '2px 0', color: 'var(--brand)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>
        {t('account.healthConnect.aanpassen')}
      </button>
    </p>
  )
}
