// Rendert de video: elk beeld is render(t), via een pijp naar ffmpeg. Beeld 0 is de poster.
import { chromium } from 'file:///C:/Users/Kaneb/AppData/Local/Temp/claude/C--Users-Kaneb-vitaal--claude-worktrees-one-person-billion-company-f8c7a3/20b9a956-5f38-45e7-b9d7-9ebd23bccf61/scratchpad/render3d/node_modules/playwright-core/index.mjs'
import { pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
try { os.setPriority(19) } catch {}
const v = process.argv[2] === 'v'
const uit = path.resolve('..', v ? 'brag-vertical.mp4' : 'brag.mp4')
const FPS = 30, N = 600, POSTER = 12.9
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', 'muziek.wav',
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-threads', '2', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', uit], { stdio: ['pipe', 'inherit', 'inherit'] })
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: v ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } })
p.on('pageerror', (e) => console.log('ERR', e))
await p.goto(pathToFileURL(path.resolve('video.html')).href + (v ? '?v=1' : ''))
await p.evaluate(() => window.klaar)
for (let f = 0; f < N; f++) {
  const t = f === 0 ? POSTER : f / FPS
  await p.evaluate((t) => window.render(t), t)
  const buf = await p.screenshot({ type: 'jpeg', quality: 94 })
  if (f === 0) writeFileSync(path.resolve('..', v ? 'work/poster-vertical.jpg' : 'brag.jpg'), buf)
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
  if (f % 100 === 0) console.log(v ? 'v' : 'l', f)
}
await b.close()
ff.stdin.end()
await new Promise((r) => ff.on('close', r))
console.log('klaar', uit)
