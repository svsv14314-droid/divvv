/**
 * Renders scripts/hero-render/ frame by frame in a headless browser and
 * encodes the result to public-hero-video/hero_3d_render.mp4: the 3D alternative
 * to the live-action hero. To use it, run
 * `HERO_VIDEO=hero_3d_render.mp4 HERO_HOLD_FRAME=232 npm run generate:sprite`.
 *
 * Uses the installed Chrome or Edge (puppeteer-core downloads nothing).
 * Override with CHROME_PATH. Preview a single frame: HERO_ONLY=148.
 *
 * Usage: npm run render:hero
 */
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import puppeteer from 'puppeteer-core'
import { createServer } from 'vite'

const run = promisify(execFile)
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputVideo = path.join(rootDir, 'public-hero-video', 'hero_3d_render.mp4')
const PORT = 5199

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter((candidate): candidate is string => Boolean(candidate))

async function main() {
  const executablePath = BROWSERS.find((candidate) => existsSync(candidate))
  if (!executablePath) throw new Error('No Chrome/Edge found — set CHROME_PATH')

  const server = await createServer({ root: rootDir, server: { port: PORT, strictPort: true }, logLevel: 'error' })
  await server.listen()
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
  })
  const workDir = await mkdtemp(path.join(tmpdir(), 'hero-render-'))

  try {
    const page = await browser.newPage()
    page.on('console', (message) => console.log(`[page] ${message.text()}`))
    page.on('pageerror', (error) => console.error(`[page error] ${error.message}`))
    await page.goto(`http://localhost:${PORT}/scripts/hero-render/index.html`, { waitUntil: 'networkidle0' })
    const frames = await page.evaluate(async () => (await window.heroRender).frames)

    const only = process.env.HERO_ONLY
    const list = only ? only.split(',').map(Number) : Array.from({ length: frames }, (_, i) => i)

    for (const frame of list) {
      const dataUrl = await page.evaluate(async (f) => (await window.heroRender).renderFrame(f), frame)
      const file = only
        ? path.join(rootDir, `hero-preview-${frame}.png`)
        : path.join(workDir, `frame_${String(frame).padStart(5, '0')}.png`)
      await writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'))
      if (frame % 24 === 0 || only) console.log(`  frame ${frame}`)
    }
    if (only) return

    await mkdir(path.dirname(outputVideo), { recursive: true })
    await run('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-framerate', '24',
      '-i', path.join(workDir, 'frame_%05d.png'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputVideo,
    ])
    console.log(`Wrote ${path.relative(rootDir, outputVideo)}`)
  } finally {
    await browser.close()
    await server.close()
    await rm(workDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
