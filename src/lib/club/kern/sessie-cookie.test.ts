import { describe, expect, it } from 'vitest'
import { NextResponse } from 'next/server'
import { zetClubSessie } from './sessie-cookie'
import { platformCookie } from '@/lib/club/platform-login/platform'
import { beheerderCookie } from '@/lib/club/beheerders/beheerder'
import { medewerkerCookie } from '@/lib/club/medewerker-login/medewerker-login'

const TOT = new Date('2026-11-23T00:00:00Z')

describe('zetClubSessie', () => {
  it('een login als eigenaar wist de sessie van het master account en van een medewerker in deze browser', () => {
    const res = zetClubSessie(NextResponse.json({}), 'beheerder', 'geheim', TOT)
    expect(res.cookies.get(beheerderCookie())).toMatchObject({ value: 'geheim', httpOnly: true, path: '/' })
    expect(res.cookies.get(platformCookie())).toMatchObject({ value: '', maxAge: 0, path: '/' })
    expect(res.cookies.get(medewerkerCookie())).toMatchObject({ value: '', maxAge: 0 })
  })
  it('een login als master account wist de andere twee', () => {
    const res = zetClubSessie(NextResponse.json({}), 'platform', 'p', TOT)
    expect(res.cookies.get(platformCookie())?.value).toBe('p')
    expect(res.cookies.get(beheerderCookie())?.maxAge).toBe(0)
    expect(res.cookies.get(medewerkerCookie())?.maxAge).toBe(0)
  })
})
