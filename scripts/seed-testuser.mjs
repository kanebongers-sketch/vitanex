/**
 * Tijdelijk verificatiescript: maakt een testgebruiker met 14 dagen
 * gezondheidsdata aan, of ruimt die weer op met --cleanup.
 * Alleen voor lokale verificatie — niet voor productie-gebruik.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const TEST_EMAIL = 'claude-verificatie@example.com'
const TEST_WACHTWOORD = 'Tijdelijk-Verificatie-2026!'

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function vindTestUser() {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
  return data?.users?.find(u => u.email === TEST_EMAIL) ?? null
}

async function cleanup() {
  const user = await vindTestUser()
  if (!user) { console.log('Geen testgebruiker gevonden — niets op te ruimen.'); return }
  await admin.from('health_native_logs').delete().eq('user_id', user.id)
  await admin.from('mood_logs').delete().eq('user_id', user.id)
  await admin.auth.admin.deleteUser(user.id)
  console.log('Testgebruiker en data verwijderd:', user.id)
}

async function seed() {
  let user = await vindTestUser()
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_WACHTWOORD,
      email_confirm: true,
      user_metadata: { naam: 'Claude Verificatie' },
    })
    if (error) { console.error('createUser:', error.message); process.exit(1) }
    user = data.user
  }
  console.log('Testgebruiker:', user.id)

  const stemmingen = ['moe', 'ok', 'blij', 'energiek', 'ok', 'blij', 'gestrest']
  const logs = []
  const moods = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    logs.push({
      user_id: user.id,
      datum: d,
      stappen: 5500 + Math.round(Math.sin(i / 2) * 2200) + i * 120,
      slaap_minuten: 390 + Math.round(Math.cos(i / 3) * 55),
      hartslag_gemiddeld: 62 + Math.round(Math.sin(i) * 5),
      calorieen: 1900 + Math.round(Math.cos(i / 2) * 280),
    })
    moods.push({ user_id: user.id, datum: d, stemming: stemmingen[i % stemmingen.length] })
  }

  await admin.from('health_native_logs').delete().eq('user_id', user.id)
  const { error: e1 } = await admin.from('health_native_logs').insert(logs)
  if (e1) console.error('health_native_logs:', e1.message)
  await admin.from('mood_logs').delete().eq('user_id', user.id)
  const { error: e2 } = await admin.from('mood_logs').insert(moods)
  if (e2) console.error('mood_logs:', e2.message)
  console.log('Seed klaar:', logs.length, 'health logs,', moods.length, 'moods')
  console.log('Login:', TEST_EMAIL, '/', TEST_WACHTWOORD)
}

if (process.argv.includes('--cleanup')) cleanup()
else seed()
