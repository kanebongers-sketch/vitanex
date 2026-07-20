// Co-located styling voor de verrijkte CRM-drawer. De gedeelde popup-CSS staat in
// globals.css onder `.os-crm__*` (die raken we niet aan); alle NIEUWE drawer-
// elementen krijgen hier hun stijl onder de eigen prefix `.crm-drawer`. Zo blijft
// navy+cyan (tokens) de enige bron van kleur en botst niets met globals.
//
// Regels: enkel tokens, nooit hex. Transitions alleen op kleur/rand/achtergrond
// (compositor-vriendelijk), 150–300ms met var(--ease). De zichtbare focus-ring
// erft van `.os-crm ...:focus-visible` in globals — hier niets voor nodig.
//
// `href` + `precedence` gebruikt React 19's stylesheet-hoisting: de stijl wordt
// naar <head> gehesen en ge-dedupt (zoals `kaart/ContactActies`), i.p.v. binnen
// de focus-trap van de dialog te blijven hangen.

export function DrawerStijl() {
  return (
    <style href="crm-drawer" precedence="medium">
      {DRAWER_CSS}
    </style>
  )
}

const DRAWER_CSS = `
.crm-drawer__kop-links {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
}
.crm-drawer__monogram {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--brand) 34%, transparent);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.crm-drawer__band {
  display: grid;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}
.crm-drawer__acties {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.crm-drawer__actie {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 13px;
  border-radius: var(--radius-btn);
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--text-2);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 160ms var(--ease), border-color 160ms var(--ease), background 160ms var(--ease);
}
.crm-drawer__actie:hover {
  color: var(--brand);
  border-color: color-mix(in srgb, var(--brand) 45%, transparent);
  background: var(--brand-soft);
}
.crm-drawer__actie-icoon {
  flex-shrink: 0;
  color: var(--brand);
}
.crm-drawer__versheid {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-btn);
  border: 1px solid var(--line);
  background: var(--bg-raised);
}
.crm-drawer__versheid-tekst {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-3);
}
.crm-drawer__versheid-icoon {
  flex-shrink: 0;
  color: var(--text-4);
}
.crm-drawer__versheid-knop {
  margin-left: auto;
}
.crm-drawer__versheid--koud {
  border-color: color-mix(in srgb, var(--status-warning) 34%, transparent);
  background: var(--status-warning-soft);
}
.crm-drawer__versheid--koud .crm-drawer__versheid-tekst,
.crm-drawer__versheid--koud .crm-drawer__versheid-icoon {
  color: var(--status-warning);
}
.crm-drawer__snel {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.crm-drawer__snelknop {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--text-2);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 160ms var(--ease), border-color 160ms var(--ease), background 160ms var(--ease);
}
.crm-drawer__snelknop:hover {
  color: var(--brand);
  border-color: color-mix(in srgb, var(--brand) 45%, transparent);
  background: var(--brand-soft);
}
.crm-drawer__snelknop[aria-pressed="true"] {
  color: var(--brand);
  border-color: var(--brand);
  background: var(--brand-soft);
}
.crm-drawer__voet-info {
  font-size: 12px;
  color: var(--text-4);
}
@media (prefers-reduced-motion: reduce) {
  .crm-drawer__actie,
  .crm-drawer__snelknop {
    transition: none;
  }
}
`
