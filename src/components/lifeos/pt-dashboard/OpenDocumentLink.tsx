'use client'

import { useSyncExternalStore } from 'react'
import { ExternalLink } from 'lucide-react'

// "Openen" voor één document. In de browser opent het in een nieuw tabblad.
// Staat de app op het beginscherm (standalone), dan juist NIET: op iOS heeft
// zo'n app een eigen cookie-opslag, en een nieuw tabblad gaat naar Safari —
// zonder de pincode-sessie, dus met "je bent uitgelogd". In dezelfde webview
// opent iOS de PDF/Word/PowerPoint in het voorbeeldscherm met een "Gereed"-knop.

type NavigatorMetStandalone = Navigator & { standalone?: boolean }

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as NavigatorMetStandalone).standalone === true
}
const geenAbonnement = () => () => {}

interface Props {
  href: string
  titel: string
}

export function OpenDocumentLink({ href, titel }: Props) {
  const standalone = useSyncExternalStore(geenAbonnement, isStandalone, () => false)
  return (
    <a
      className="ptd-knop ptd-knop--klein ffdoc-open"
      href={href}
      target={standalone ? undefined : '_blank'}
      rel="noopener noreferrer"
      aria-label={standalone ? `${titel} openen` : `${titel} openen (nieuw tabblad)`}
    >
      Openen
      <ExternalLink size={15} aria-hidden="true" />
    </a>
  )
}
