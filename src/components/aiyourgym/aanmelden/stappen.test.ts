import { describe, expect, it } from 'vitest'
import { eersteStapMetFout, foutenVanStap, isStripeCheckout } from './stappen'

describe('stappen', () => {
  it('fouten per stap', () => {
    const fouten = { pakket: 'a', slug: 'b', akkoord: 'c' }
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
