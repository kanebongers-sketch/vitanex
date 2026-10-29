import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CLUB_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/club/inloggen'
import { WachtwoordKiezen } from './WachtwoordKiezen'

// Het master account van de platform-eigenaar (Kane) op aiyourgym.com: met de
// startlink een keer een sterk wachtwoord kiezen. Daarna inloggen op /inloggen.

export async function PlatformInlog({ code }: { code: string }) {
  const t = await clubTekst(CLUB_INLOGGEN)
  return (
    <WachtwoordKiezen
      api={`/api/club/inloggen/platform/${encodeURIComponent(code)}/wachtwoord`}
      rol={t.platformEigenaar}
      merk={
        <>
          <AygLogo opDonker className="club-inlog-ayg" />
          <span className="club-inlog-club">{t.platform}</span>
        </>
      }
    />
  )
}
