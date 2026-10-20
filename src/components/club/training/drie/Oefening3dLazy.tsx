'use client'

import dynamic from 'next/dynamic'

// three.js en WebGL alleen in de browser en pas als het beeld nodig is.
export const Oefening3dLazy = dynamic(() => import('./Oefening3d').then((m) => m.Oefening3d), {
  ssr: false,
  loading: () => <div className="club-ill club-ill-3d club-ill-3d--laden" aria-hidden />,
})
