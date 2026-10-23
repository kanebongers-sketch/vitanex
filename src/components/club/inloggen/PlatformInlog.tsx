import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { WachtwoordKiezen } from './WachtwoordKiezen'

// Het master account van de platform-eigenaar (Kane) op aiyourgym.com: met de
// startlink een keer een sterk wachtwoord kiezen. Daarna inloggen op /inloggen.

export function PlatformInlog({ code }: { code: string }) {
  return (
    <WachtwoordKiezen
      api={`/api/club/inloggen/platform/${encodeURIComponent(code)}/wachtwoord`}
      rol="Platform-eigenaar"
      merk={
        <>
          <AygLogo opDonker className="club-inlog-ayg" />
          <span className="club-inlog-club">Platform</span>
        </>
      }
    />
  )
}
