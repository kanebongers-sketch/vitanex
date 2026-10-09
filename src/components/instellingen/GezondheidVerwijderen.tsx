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

export function GezondheidVerwijderen() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [bezig, setBezig] = useState(false)

  async function verwijder() {
    setBezig(true)
    try {
      const res = await authFetch('/api/gezondheid/verwijderen', { method: 'POST', body: JSON.stringify({ bevestig: 'VERWIJDER' }) })
      if (!res.ok) throw new Error()
      try { localStorage.removeItem('mf-health-sync') } catch { /* geen opslag beschikbaar */ }
      setOpen(false)
      toast({ title: 'Je gezondheidsdata is verwijderd.', description: 'Trek ook de toegang in bij Health Connect of Apple Health, anders komt nieuwe data weer binnen.', variant: 'success' })
    } catch {
      toast({ title: 'Verwijderen lukte niet.', description: 'Probeer het opnieuw of mail info@mentaforce.nl.', variant: 'error' })
    } finally {
      setBezig(false)
    }
  }

  return (
    <Card style={{ padding: 24 }}>
      <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Gezondheidsdata wissen</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>
        Verwijdert alles wat je telefoon of horloge aanleverde: stappen, slaap, hartslag, trainingen. Wat je zelf invoerde blijft staan.
      </p>
      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="danger" leftIcon={<Trash2 size={15} aria-hidden />}>Gezondheidsdata wissen</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Gezondheidsdata wissen?</DialogTitle>
          <DialogDescription>
            Alle dagwaarden en trainingen uit Health Connect en Apple Health worden definitief verwijderd. Dit kun je niet ongedaan maken.
            Wil je dat de app ook stopt met ophalen, trek dan daarna de toegang in bij Health Connect of Apple Health.
          </DialogDescription>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
            <DialogClose asChild><Button variant="secondary">Annuleren</Button></DialogClose>
            <Button variant="danger" loading={bezig} onClick={() => void verwijder()}>Definitief wissen</Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </Card>
  )
}
