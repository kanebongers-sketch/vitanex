import type { Metadata } from 'next'
import { PlanEditor } from '@/components/vandaag/PlanEditor'

export const metadata: Metadata = { title: 'Weekplan – MentaForce' }

export default function PlanPagina() {
  return <PlanEditor />
}
