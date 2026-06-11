import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Afbeeldingen komen van externe bronnen (Open Food Facts, ExerciseDB,
      // Supabase Storage) en de Capacitor-build draait sowieso unoptimized —
      // next/image-optimalisatie levert hier niets op.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code tooling — geen app-code
    ".claude/**",
  ]),
]);

export default eslintConfig;
