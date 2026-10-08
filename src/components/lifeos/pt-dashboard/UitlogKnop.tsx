'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { leesLeeg, ptApi } from './api'

/** Dit toestel uitloggen (bv. een gedeelde telefoon). */
export function UitlogKnop({ code }: { code: string }) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  return (
    <button
      type="button"
      className="ptd-knop ptd-knop--klein"
      disabled={bezig}
      onClick={async () => {
        setBezig(true)
        await ptApi(code, 'uitloggen', 'POST', undefined, leesLeeg)
        router.refresh()
      }}
    >
      <LogOut size={14} aria-hidden /> Uitloggen
    </button>
  )
}
