'use client'

export const dynamic = 'force-dynamic'

import CategoriePagina from '@/components/layout/CategoriePagina'
import { CATEGORIEEN } from '@/lib/navigatie/categorie-nav'

export default function ProfielPage() {
  return <CategoriePagina categorie={CATEGORIEEN.profiel} />
}
