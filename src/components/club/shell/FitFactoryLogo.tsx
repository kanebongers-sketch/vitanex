import Image from 'next/image'

// Het ingebouwde logo van de sportschool Fit Factory (de eerste klant van AI Your
// Gym), voor als een sportschool dat logo als eigen logo heeft (LOGO_FIT_FACTORY).
// Alleen het beeld; nergens een link naar een andere app.

interface FitFactoryLogoProps {
  className?: string
  prioriteit?: boolean
}

export function FitFactoryLogo({ className = 'ff-logo', prioriteit = false }: FitFactoryLogoProps) {
  return (
    <Image
      src="/fitfactory/logo-pt-400.png"
      alt="Fit Factory"
      width={400}
      height={124}
      className={className}
      priority={prioriteit}
    />
  )
}
