import { COLORS } from '../theme'

// Scoped styles voor de liquid-landing. `--color-white` wordt binnen de scope
// op inkt gezet zodat Tailwinds white-utilities de merk-neutrale inkt renderen.
export default function LiquidStyles() {
  return (
    <style>{`
      [data-mf-liquid] {
        --color-white: ${COLORS.ink};
        background: ${COLORS.navy};
        color: ${COLORS.ink};
      }

      [data-mf-liquid] .liquid-glass {
        background: rgba(255, 255, 255, 0.01);
        background-blend-mode: luminosity;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        border: none;
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
      }

      [data-mf-liquid] .liquid-glass::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1.4px;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.45) 0%,
          rgba(255, 255, 255, 0.15) 20%,
          rgba(255, 255, 255, 0) 40%,
          rgba(255, 255, 255, 0) 60%,
          rgba(255, 255, 255, 0.15) 80%,
          rgba(255, 255, 255, 0.45) 100%
        );
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: exclude;
        pointer-events: none;
      }

      [data-mf-liquid] a:focus-visible,
      [data-mf-liquid] button:focus-visible,
      [data-mf-liquid] input:focus-visible {
        outline: 2px solid ${COLORS.cyan};
        outline-offset: 3px;
      }

      /* Zachte puls-ringen voor de aanpak-visual (alleen transform/opacity). */
      @keyframes lq-ring {
        0%   { transform: scale(0.55); opacity: 0.55; }
        100% { transform: scale(1.25); opacity: 0; }
      }
    `}</style>
  )
}
