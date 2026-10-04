import { defineConfig } from 'vitest/config'
import path from 'node:path'

// De servercode rekent "vandaag" in lokale tijd en draait in productie op
// Europe/Amsterdam (zie het start-script). Tests draaien in dezelfde zone, zodat
// ze op een UTC-runner niet anders uitvallen dan op je eigen laptop.
process.env.TZ = 'Europe/Amsterdam'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
