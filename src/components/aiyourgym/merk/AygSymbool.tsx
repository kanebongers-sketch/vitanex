// Het beeldmerk van AI Your Gym: een figuur met de armen omhoog, die ook een Y
// vormt (Your). Inkt met volt; op een donkere ondergrond draait het om.

interface Props {
  /** Op een donkere ondergrond: kalkwit vlak in plaats van inkt. */
  opDonker?: boolean
  className?: string
}

export function AygSymboolPaden({ opDonker = false }: { opDonker?: boolean }) {
  const vlak = opDonker ? 'var(--ayg-inkt-tekst, #f2f0e9)' : 'var(--ayg-inkt, #0f1412)'
  const figuur = opDonker ? 'var(--ayg-inkt, #0f1412)' : 'var(--ayg-accent, #c9f03e)'
  return (
    <>
      <rect width="32" height="32" rx="8.5" fill={vlak} />
      <path d="M8.6 8.4 16 17.2l7.4-8.8M16 17.2v7.6" fill="none" stroke={figuur} strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="8.9" r="2.55" fill={figuur} />
    </>
  )
}

export function AygSymbool({ opDonker = false, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      <AygSymboolPaden opDonker={opDonker} />
    </svg>
  )
}
