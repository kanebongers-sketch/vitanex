# UI — MentaForce

Toon: helder, eerlijk, rustig, premium. Referenties: Apple, Linear, Vercel, Stripe,
Neuralink én landonorris.com (editoriaal, twee-tonig, veel ruimte).

## Strikt 2 kleuren

- Deep Navy `#0B1B3A` + Electric Cyan `#00E5FF`. Wit/inkt (`COLORS.ink`) is neutrale tekst, geen "kleur".
- **Nooit hex hardcoden** — altijd tokens uit `src/components/marketing/theme.ts` (`COLORS`, `FONT`, `EASE`, `glassPanel`, `MAXW`).
- Cyan is een accent, geen vlakvuller: gebruik het voor focus, één CTA, dunne lijnen, glow — niet voor hele panelen.
- Het 3D-brein (`BRAIN_COLORS`) is het ENIGE meerkleurige element. Die kleuren komen nergens anders in de UI terug.

## Typografie

- Space Grotesk overal (`FONT.grotesk`). Hiërarchie via schaalcontrast: grote, strakke koppen vs. rustige body. Niet alles even groot/zwaar.
- Royale line-height en letterspacing op display-koppen; lees-comfortabele body.

## Layout & ritme

- Ruime, bewuste spacing — geen uniform padding overal. Editoriale/asymmetrische composities mogen (zoals de info-kaart links naast het brein dat naar rechts schuift).
- Max content-breedte `MAXW` (1200). Diepte via lagen: `glassPanel` (navy-glas + blur), subtiele lijnen (`COLORS.line`), overlap — geen zware slagschaduwen.

## States

- Hover/focus/active voelen ontworpen: subtiele opacity/transform-shift, cyan-rand of -glow op focus. Zichtbare focus-ring altijd (toetsenbord).

## Vermijden

- Goedkope/willekeurige gradients, regenboogkleuren, Material Design-look, grote diffuse schaduwen.
- Emoji als icoon — gebruik `lucide-react`.
- Template-uitstraling (standaard card-grid zonder hiërarchie, stock-hero met centrale kop + gradient-blob).

## Componentcheck

- [ ] Geen hardcoded kleur — alles via tokens?
- [ ] Strikt navy + cyan (brein uitgezonderd)?
- [ ] Hiërarchie via schaal, niet uniforme nadruk?
- [ ] Ontworpen hover/focus/active states?
- [ ] Zou Apple/Stripe/Vercel dit shippen?
