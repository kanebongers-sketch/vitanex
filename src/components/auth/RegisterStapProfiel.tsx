'use client'

import { formatteerHrCodeInvoer, type GebruikerType } from './register-helpers'

export interface RegisterStapHrCodeProps {
  hrCode: string
  bedrijfsnaam: string
  bezig: boolean
  fout: string | null
  onHrCodeChange: (waarde: string) => void
  onValideer: () => void
  onTerug: () => void
  onOverslaan: () => void
}

export function RegisterStapHrCode({
  hrCode, bedrijfsnaam, bezig, fout,
  onHrCodeChange, onValideer, onTerug, onOverslaan,
}: RegisterStapHrCodeProps) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--text-1)' }}>HR Code van je werkgever</h1>
      <p className="mb-8" style={{ color: 'var(--text-3)' }}>
        Voer de 7-tekens HR code in die je van je werkgever of HR-afdeling hebt ontvangen.
        Geen code? Je kunt deze stap overslaan en later koppelen via Instellingen.
      </p>

      <div className="mb-6">
        <label htmlFor="reg-hrcode" className="text-xs font-semibold block mb-2" style={{ color: 'var(--text-2)' }}>HR Code</label>
        <input
          id="reg-hrcode"
          type="text"
          aria-describedby={fout ? 'reg-hrcode-fout' : undefined}
          value={hrCode}
          onChange={e => onHrCodeChange(formatteerHrCodeInvoer(e.target.value, hrCode))}
          onKeyDown={e => e.key === 'Enter' && hrCode.length === 7 && onValideer()}
          placeholder="FIT-X2K"
          maxLength={7}
          autoFocus
          className="w-full border-2 rounded-xl px-4 py-4 text-2xl font-mono font-bold text-center tracking-[0.3em] outline-none transition"
          style={{
            borderColor: fout ? 'var(--mf-red)' : hrCode.length === 7 ? 'var(--mf-green)' : 'var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-1)',
          }}
          spellCheck={false}
          autoComplete="off"
        />
        {bedrijfsnaam && !fout && hrCode.length === 7 && (
          <div aria-live="polite" className="mt-3 rounded-xl px-4 py-2.5 text-sm font-medium"
            style={{ background: 'var(--mf-green-light)', border: '1px solid var(--mf-green)', color: 'var(--mf-green-dark)' }}>
            Bedrijf gevonden: <strong>{bedrijfsnaam}</strong>
          </div>
        )}
        {fout && (
          <div id="reg-hrcode-fout" role="alert" aria-live="assertive" className="mt-3 rounded-xl px-4 py-2.5 text-sm"
            style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', color: 'var(--mf-red)' }}>
            {fout}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onTerug}
          className="px-6 py-4 rounded-xl text-sm font-medium transition hover:opacity-80"
          style={{ color: 'var(--text-2)', border: '1px solid var(--border-strong)' }}
        >
          Terug
        </button>
        <button
          onClick={onValideer}
          disabled={bezig || hrCode.length < 7}
          className="flex-1 py-4 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
          style={{
            background: 'var(--mf-green)', color: 'var(--bg-app)',
            boxShadow: '0 4px 16px color-mix(in srgb, var(--mf-green) 30%, transparent)',
          }}
        >
          {bezig ? (
            <>
              <div
                aria-hidden
                className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: 'color-mix(in srgb, var(--bg-app) 30%, transparent)', borderTopColor: 'var(--bg-app)' }}
              />
              Controleren...
            </>
          ) : (
            'Controleer & verder'
          )}
        </button>
      </div>

      <button
        onClick={onOverslaan}
        className="w-full mt-4 text-sm transition underline hover:opacity-80"
        style={{ color: 'var(--text-3)' }}
      >
        Ik heb geen HR code, overslaan
      </button>
    </div>
  )
}

export interface RegisterStapProfielProps {
  type: GebruikerType | null
  naam: string
  organisatie: string
  teamgrootte: string
  functie: string
  telefoon: string
  onNaamChange: (waarde: string) => void
  onOrganisatieChange: (waarde: string) => void
  onTeamgrootteChange: (waarde: string) => void
  onFunctieChange: (waarde: string) => void
  onTelefoonChange: (waarde: string) => void
  onTerug: () => void
  onVerder: () => void
}

export function RegisterStapProfiel({
  type, naam, organisatie, teamgrootte, functie, telefoon,
  onNaamChange, onOrganisatieChange, onTeamgrootteChange, onFunctieChange, onTelefoonChange,
  onTerug, onVerder,
}: RegisterStapProfielProps) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--text-1)' }}>Vertel ons iets over jezelf</h1>
      <p className="mb-8" style={{ color: 'var(--text-3)' }}>Alleen je naam is verplicht. De rest is optioneel.</p>

      <div className="flex flex-col gap-4 mb-8">
        <div>
          <label htmlFor="reg-naam" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-2)' }}>Jouw naam *</label>
          <input
            id="reg-naam"
            type="text"
            value={naam}
            onChange={e => onNaamChange(e.target.value)}
            placeholder="Jan Janssen"
            autoFocus
            autoComplete="name"
            className="mf-input"
          />
        </div>

        {(type === 'hr') && (
          <>
            <div>
              <label htmlFor="reg-organisatie" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-2)' }}>Organisatie</label>
              <input
                id="reg-organisatie"
                type="text"
                value={organisatie}
                onChange={e => onOrganisatieChange(e.target.value)}
                placeholder="Naam van je bedrijf"
                autoComplete="organization"
                className="mf-input"
              />
            </div>
            <div>
              <label htmlFor="reg-teamgrootte" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-2)' }}>Teamgrootte</label>
              <select
                id="reg-teamgrootte"
                value={teamgrootte}
                onChange={e => onTeamgrootteChange(e.target.value)}
                className="mf-input appearance-none"
              >
                <option value="" disabled>Selecteer aantal medewerkers</option>
                <option value="10-24">10 tot 24 medewerkers</option>
                <option value="25-49">25 tot 49 medewerkers</option>
                <option value="50-99">50 tot 99 medewerkers</option>
                <option value="100-249">100 tot 249 medewerkers</option>
                <option value="250+">250 of meer medewerkers</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label htmlFor="reg-functie" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-2)' }}>Functie (optioneel)</label>
          <input
            id="reg-functie"
            type="text"
            value={functie}
            onChange={e => onFunctieChange(e.target.value)}
            placeholder={type === 'hr' ? 'bijv. HR Manager' : 'bijv. Software Developer'}
            className="mf-input"
          />
        </div>

        <div>
          <label htmlFor="reg-telefoon" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-2)' }}>Telefoonnummer (optioneel)</label>
          <input
            id="reg-telefoon"
            type="tel"
            value={telefoon}
            autoComplete="tel"
            onChange={e => onTelefoonChange(e.target.value)}
            placeholder="+32 4xx xx xx xx"
            className="mf-input"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onTerug}
          className="px-6 py-4 rounded-xl text-sm font-medium transition hover:opacity-80"
          style={{ color: 'var(--text-2)', border: '1px solid var(--border-strong)' }}
        >
          Terug
        </button>
        <button
          onClick={onVerder}
          disabled={!naam.trim()}
          className="flex-1 py-4 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-30"
          style={{
            background: 'var(--mf-green)', color: 'var(--bg-app)',
            boxShadow: '0 4px 16px color-mix(in srgb, var(--mf-green) 30%, transparent)',
          }}
        >
          Verder
        </button>
      </div>
    </div>
  )
}
