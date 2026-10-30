/**
 * Renders the six work-case covers (scripts/cover-render/scene.ts) in a
 * headless browser and writes them to public/covers/<slug>.webp.
 *
 * Uses the installed Chrome or Edge, like renderHeroVideo.ts. Override with
 * CHROME_PATH.
 *
 * Usage: npm run render:covers
 */
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'
import { createServer } from 'vite'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(rootDir, 'public', 'covers')
const PORT = 5198

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

  try {
    const page = await browser.newPage()
    page.on('pageerror', (error) => console.error(`[page error] ${error.message}`))
    await page.goto(`http://localhost:${PORT}/scripts/cover-render/index.html`, { waitUntil: 'networkidle0' })
    const covers = await page.evaluate(async () => (await window.coverRender).covers)
    await mkdir(outputDir, { recursive: true })

    for (const slug of covers) {
      const dataUrl = await page.evaluate(
        async (name) => (await window.coverRender).renderCover(name as never),
        slug,
      )
      await sharp(Buffer.from(dataUrl.split(',')[1], 'base64'))
        .resize({ width: 1200 })
        .webp({ quality: 82, effort: 6 })
        .toFile(path.join(outputDir, `${slug}.webp`))
      console.log(`  ${slug}.webp`)
    }
  } finally {
    await browser.close()
    await server.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
