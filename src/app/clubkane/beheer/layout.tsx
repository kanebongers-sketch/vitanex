import type { ReactNode } from 'react'
import { eisInstellingencentrum } from '@/lib/club/instel-toegang'

// Het instellingencentrum is open voor wie minstens een instel-pagina mag zien.
// Elke pagina hieronder controleert zelf haar eigen recht (meestal Beheer, dus
// alleen Kane en de eigenaar); een clubmanager of medewerker krijgt daar een 404.
export default async function Layout({ children }: { children: ReactNode }) {
  await eisInstellingencentrum()
  return children
}
