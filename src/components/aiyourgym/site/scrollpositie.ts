// Waar de bezoeker op de pagina is. De site staat in de body van de app, en die
// body scrolt zelf (html heeft overflow: hidden, zie globals.css). Dan blijft
// window.scrollY altijd 0 en komt het scroll-event niet bij window aan. Deze
// helpers kijken daarom naar het element dat echt scrolt, en luisteren met
// capture, zodat ook het scroll-event van de body binnenkomt.

export interface ScrollPositie {
  /** Hoe ver er gescrold is, in pixels. */
  y: number
  /** Hoeveel pagina er nog onder het scherm zit, in pixels. */
  rest: number
  /** Hoogte van het zichtbare deel. */
  scherm: number
}

function scroller(): HTMLElement {
  const html = document.documentElement
  const body = document.body
  if (body.scrollTop > 0) return body
  return getComputedStyle(html).overflowY === 'hidden' ? body : html
}

export function scrollPositie(): ScrollPositie {
  const el = scroller()
  const y = Math.max(window.scrollY, el.scrollTop)
  const scherm = el === document.body ? el.clientHeight : window.innerHeight
  return { y, scherm, rest: Math.max(0, el.scrollHeight - (y + scherm)) }
}

/** Roept terug bij scrollen van de pagina (body of venster) en bij een andere schermmaat, hooguit een keer per frame. */
export function volgScroll(terug: () => void): () => void {
  let frame = 0
  const plan = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      terug()
    })
  }
  const opScroll = (e: Event) => {
    const doel = e.target
    if (doel === document || doel === document.body || doel === document.documentElement) plan()
  }
  const opties = { passive: true, capture: true } as const
  window.addEventListener('scroll', opScroll, opties)
  window.addEventListener('resize', plan)
  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('scroll', opScroll, opties)
    window.removeEventListener('resize', plan)
  }
}
