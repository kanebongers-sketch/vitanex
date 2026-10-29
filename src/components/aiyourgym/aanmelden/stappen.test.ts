import { describe, expect, it } from 'vitest'
import { eersteStapMetFout, foutenVanStap, isStripeCheckout, isTestbetaalAdres } from './stappen'

describe('stappen', () => {
  it('fouten per stap', () => {
    const fouten = { pakketten: 'a', slug: 'b', akkoord: 'c' }
    expect(foutenVanStap(0, fouten)).toEqual({ pakketten: 'a' })
    expect(foutenVanStap(1, fouten)).toEqual({ slug: 'b' })
    expect(foutenVanStap(2, fouten)).toEqual({})
    expect(eersteStapMetFout(fouten)).toBe(0)
    expect(eersteStapMetFout({ eigenaarEmail: 'x' })).toBe(2)
    expect(eersteStapMetFout({})).toBeNull()
  })
  it('alleen naar de betaalpagina van Stripe', () => {
    expect(isStripeCheckout('https://checkout.stripe.com/c/pay/cs_test_1')).toBe(true)
    expect(isStripeCheckout('https://checkout.stripe.com.evil.nl/x')).toBe(false)
    expect(isStripeCheckout('http://checkout.stripe.com/x')).toBe(false)
    expect(isStripeCheckout('javascript:alert(1)')).toBe(false)
    expect(isStripeCheckout(null)).toBe(false)
  })
})

describe('isTestbetaalAdres', () => {
  it('alleen de eigen testbetaalpagina', () => {
    expect(isTestbetaalAdres('https://aiyourgym.com/testbetaling?sessie=test_x', 'https://aiyourgym.com')).toBe(true)
    expect(isTestbetaalAdres('http://aiyourgym.localhost:3000/testbetaling?sessie=x', 'http://aiyourgym.localhost:3000')).toBe(true)
    expect(isTestbetaalAdres('/aiyourgym/testbetaling?sessie=x', 'https://fitfactorypt.nl')).toBe(true)
    expect(isTestbetaalAdres('https://evil.example/testbetaling', 'https://aiyourgym.com')).toBe(false)
    expect(isTestbetaalAdres('https://aiyourgym.com/welkom', 'https://aiyourgym.com')).toBe(false)
    expect(isTestbetaalAdres(42, 'https://aiyourgym.com')).toBe(false)
  })
})
