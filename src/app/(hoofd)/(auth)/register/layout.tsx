import { redirect } from 'next/navigation'
import { SITE_VERBORGEN } from '@/lib/site-modus'

// Tijdelijk verborgen (zie lib/site-modus.ts). De echte 307 zit in next.config.ts;
// dit is het vangnet.
export default function VerborgenLayout({ children }: { children: React.ReactNode }) {
  if (SITE_VERBORGEN) redirect('/login')
  return <>{children}</>
}
