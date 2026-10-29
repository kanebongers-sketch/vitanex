import { Neutraal } from '../neutraal'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CLUB_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/club/inloggen'

// De 404 van Club, de ledenapp, de widget en de inlogpagina's: kaal en zonder
// merknaam. Club is geheim tot de presentatie, dus een 404 mag niets verraden.

export default async function ClubNietGevonden() {
  const t = (await clubTekst(CLUB_INLOGGEN)).nietGevonden
  return <Neutraal titel={t.titel} tekst={t.tekst} />
}
