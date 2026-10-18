// ─── Club ledenapp: van sportschool naar merk (PUUR) ────────────────────────
// De web-app kent alleen een LedenappMerk (contract). Hier maken we dat uit een
// Organisatie. Het opslagpad van het logo houden we apart: alleen de server
// gebruikt het om het icoon te maken, de browser ziet het nooit in het manifest.

import type { LedenappMerk } from '@/lib/club/ledenlogin/contract'
import { LOGO_FIT_FACTORY, LOGO_PAD, type Organisatie } from '@/lib/club/kern/organisatie'

export interface MerkBron {
  merk: LedenappMerk
  /** Pad in de bucket club-logo als het een PNG of JPG is (dat kan het icoon tonen), anders null. */
  icoonLogoPad: string | null
}

/** Alleen PNG en JPG: ImageResponse (Satori) toont geen WebP, en een SVG van buiten zetten we er niet in. */
const ICOON_LOGO = /\.(png|jpg)$/

export function merkUitOrganisatie(org: Organisatie): MerkBron {
  const eigenLogo = org.logo && org.logo !== LOGO_FIT_FACTORY && LOGO_PAD.test(org.logo) ? org.logo : null
  return {
    merk: {
      organisatieId: org.id,
      naam: org.naam,
      slug: org.slug,
      kleurAccent: org.kleurAccent,
      thema: org.thema,
      logoUrl: eigenLogo ? `/api/club/organisatie/logo?pad=${encodeURIComponent(eigenLogo)}` : null,
    },
    icoonLogoPad: eigenLogo && ICOON_LOGO.test(eigenLogo) ? eigenLogo : null,
  }
}
