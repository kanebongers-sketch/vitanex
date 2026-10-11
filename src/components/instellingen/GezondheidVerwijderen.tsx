'use client'

// "Wis mijn gezondheidsdata": alles wat telefoon of horloge aanleverde. Met een
// bevestigingsvenster dat precies zegt wat er weg gaat en wat blijft.

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { DialogClose, DialogContent, DialogDescription, DialogRoot, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { authFetch } from '@/lib/auth/auth-fetch'
import { useVertaling } from '@/lib/i18n/TaalProvider'

export function GezondheidVerwijderen() {
  const { toast } = useToast()
  const { t } = useVertaling()
  const [open, setOpen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [gewist, setGewist] = useState(false)

  async function verwijder() {
    setBezig(true)
    try {
      const res = await authFetch('/api/gezondheid/verwijderen', { method: 'POST', body: JSON.stringify({ bevestig: 'VERWIJDER' }) })
      if (!res.ok) throw new Error()
      try { localStorage.removeItem('mf-health-sync') } catch { /* geen opslag beschikbaar */ }
      setOpen(false)
      setGewist(true)
      toast({ title: t('account.gezondheidWissen.gewistTitel'), description: t('account.gezondheidWissen.gewistTekst'), variant: 'success' })
    } catch {
      toast({ title: t('account.gezondheidWissen.foutTitel'), description: t('account.gezondheidWissen.foutTekst'), variant: 'error' })
    } finally {
      setBezig(false)
    }
  }

  return (
    <Card style={{ padding: 24 }}>
      <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{t('account.gezondheidWissen.kop')}</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>
        {t('account.gezondheidWissen.uitleg')}
      </p>
      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="danger" leftIcon={<Trash2 size={15} aria-hidden />}>{t('account.gezondheidWissen.kop')}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{t('account.gezondheidWissen.vraag')}</DialogTitle>
          <DialogDescription>
            {t('account.gezondheidWissen.dialoog')}
          </DialogDescription>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
            <DialogClose asChild><Button variant="secondary">{t('account.gezondheidWissen.annuleren')}</Button></DialogClose>
            <Button variant="danger" loading={bezig} onClick={() => void verwijder()}>{t('account.gezondheidWissen.definitief')}</Button>
          </div>
        </DialogContent>
      </DialogRoot>
      <p role="status" className="text-xs mt-3" style={{ color: 'var(--text-2)' }}>
        {gewist ? t('account.gezondheidWissen.status') : ''}
      </p>
    </Card>
  )
}
