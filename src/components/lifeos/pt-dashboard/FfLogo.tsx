import Image from 'next/image'

/** Het Fit Factory Personal Training-logo (wit + amber, transparant). */
export function FfLogo({ className = 'ff-logo', prioriteit = false }: { className?: string; prioriteit?: boolean }) {
  return (
    <Image
      src="/fitfactory/logo-pt-400.png"
      alt="Fit Factory Personal Training"
      width={400}
      height={124}
      className={className}
      priority={prioriteit}
    />
  )
}
