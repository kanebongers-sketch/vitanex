'use client'

import { ArrowLeftRight } from 'lucide-react'
import { statussenVoorGroep, type Groep } from '@/lib/lifeos/crm/crm'

// Het toetsenbord-alternatief voor slepen (WCAG 2.1.1). Native drag & drop is
// niet toetsenbord-bedienbaar, dus élke tegel én de popup krijgen deze kiezer:
// een `<select>` waarmee je de status ook zonder muis verzet. De waarde is de
// huidige status; kiezen verplaatst de persoon naar een andere kolom.

interface StatusKiezerProps {
  groep: Groep
  status: string
  naam: string
  onKies: (status: string) => void
}

export function StatusKiezer({ groep, status, naam, onKies }: StatusKiezerProps) {
  const statussen = statussenVoorGroep(groep)

  return (
    <div className="os-crm__verplaats">
      <ArrowLeftRight size={13} strokeWidth={2} aria-hidden="true" className="os-crm__verplaats-icoon" />
      <select
        className="os-crm__select"
        value={status}
        aria-label={`Verplaats ${naam} naar een andere status`}
        onChange={(e) => {
          if (e.target.value !== status) onKies(e.target.value)
        }}
      >
        {statussen.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}
