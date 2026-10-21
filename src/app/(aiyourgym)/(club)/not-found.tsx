import { Neutraal } from '../neutraal'

// De 404 van Club, de ledenapp, de widget en de inlogpagina's: kaal en zonder
// merknaam. Club is geheim tot de presentatie, dus een 404 mag niets verraden.

export default function ClubNietGevonden() {
  return <Neutraal titel="Pagina niet gevonden" tekst="Deze pagina bestaat niet." />
}
