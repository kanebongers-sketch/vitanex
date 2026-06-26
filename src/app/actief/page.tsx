'use client'

export const dynamic = 'force-dynamic'

import CategoriePagina from '@/components/layout/CategoriePagina'
import { CATEGORIEEN } from '@/lib/categorie-nav'

export default function ActiefPage() {
  return <CategoriePagina categorie={CATEGORIEEN.actief} />
}
