'use client'

import { useMemo } from 'react'
import type { Afsluitronde as Ronde, Taak, Takenlijst } from '@/lib/club/taken/typen'
import { takenVanVandaag } from '@/lib/club/taken/voortgang'
import { useAfvinken } from './AfvinkContext'
import { Afsluitronde } from './Afsluitronde'

// Onder de dagtabel: de knop "Afsluitronde klaar" met de stand van de
// afsluittaken. De taken zelf staan al in de tabel, dus hier geen tegels.

interface Props {
  lijsten: Takenlijst[]
  taken: Taak[]
  dagen: string[]
  ronde: Ronde | null
}

export function DagAfsluiten({ lijsten, taken, dagen, ronde }: Props) {
  const { afvinkingen, vandaag } = useAfvinken()
  const items = useMemo(
    () => takenVanVandaag(taken, afvinkingen, dagen, vandaag).filter((i) => i.soort === 'verplicht' && i.taak.moment === 'afsluiten'),
    [taken, afvinkingen, dagen, vandaag],
  )
  const bron = useMemo(() => Object.fromEntries(lijsten.map((l) => [l.id, l.naam])), [lijsten])
  if (items.length === 0) return null
  return <Afsluitronde items={items} bron={bron} begin={ronde} zonderTegels />
}
