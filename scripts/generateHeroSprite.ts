/**
 * Extracts every frame of the hero video with FFmpeg and packs them into
 * horizontal sprite sheets consumed by src/components/Hero.tsx.
 *
 * Usage: npm run generate:sprite
 */
import { execFile, execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import sharp from 'sharp'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'

const run = promisify(execFile)

/** Prefer a system install, fall back to the bundled static binary. */
function resolveBinary(name: string, fallback: string | null): string {
  try {
    // `where` on Windows: `which` from Git Bash returns /c/... paths Node can't exec.
    const finder = process.platform === 'win32' ? 'where' : 'which'
    return execFileSync(finder, [name], { encoding: 'utf8' }).split(/\r?\n/)[0].trim()
  } catch {
    if (!fallback) throw new Error(`${name} not found — install FFmpeg or the static package`)
    return fallback
  }
}

const FFMPEG = resolveBinary('ffmpeg', ffmpegStatic)
const FFPROBE = resolveBinary('ffprobe', ffprobeStatic.path)

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(rootDir, 'public-hero-video')
const outputDir = path.join(rootDir, 'public', 'hero-frames')
/** The live-action cut of Divyansh at his laptop; hero_3d_render.mp4 is the 3D alternative. */
const SOURCE_VIDEO = process.env.HERO_VIDEO ?? 'new_hero_video.mp4'

/**
 * Per-frame width in the sprite: quality traded against 240 frames of payload
 * and decode memory (each sheet sits in memory as raw RGBA: 1024px frames cost
 * ~560 MB and made the page stutter; 800px costs ~345 MB). 800 packs 20 frames
 * per sheet; Hero.tsx keeps its idle loop inside sheet 0.
 */
const FRAME_WIDTH = Number(process.env.HERO_FRAME_WIDTH ?? 800)
/** WebP tops out at 16383px per axis; stay clear of the limit. */
const MAX_SHEET_WIDTH = 16000
/**
 * Playback freezes here instead of on the true last frame: he points down at
 * the laptop from ~216, and 224 is the clearest frame of that gesture before
 * his hands drop at ~228. Every frame still ships in the sprite.
 */
const HOLD_FRAME = Number(process.env.HERO_HOLD_FRAME ?? 224)
const WEBP_QUALITY = Number(process.env.HERO_WEBP_QUALITY ?? 78)

type VideoInfo = {
  width: number
  height: number
  fps: number
  duration: number
}

async function findSourceVideo(): Promise<string> {
  const preferred = path.join(sourceDir, SOURCE_VIDEO)
  if (existsSync(preferred)) return preferred
  const entries = (await readdir(sourceDir)).sort()
  const video = entries.find((name) => /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(name))
  if (!video) throw new Error(`No video file found in ${sourceDir}`)
  return path.join(sourceDir, video)
}

async function probe(videoPath: string): Promise<VideoInfo> {
  const { stdout } = await run(FFPROBE, [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate,avg_frame_rate,duration,nb_frames:format=duration',
    '-of', 'json',
    videoPath,
  ])
  const data = JSON.parse(stdout)
  const stream = data.streams?.[0]
  if (!stream) throw new Error('No video stream found')

  const parseRate = (rate?: string) => {
    if (!rate) return 0
    const [num, den] = rate.split('/').map(Number)
    return den ? num / den : num
  }

  const fps = parseRate(stream.avg_frame_rate) || parseRate(stream.r_frame_rate)
  const duration = Number(stream.duration ?? data.format?.duration ?? 0)
  if (!fps) throw new Error('Could not determine frame rate')

  return { width: stream.width, height: stream.height, fps, duration }
}

async function extractFrames(videoPath: string, frameWidth: number, workDir: string) {
  // -fps_mode passthrough keeps every decoded frame exactly once: no drops, no dupes.
  await run(FFMPEG, [
    '-hide_banner', '-loglevel', 'error',
    '-i', videoPath,
    '-fps_mode', 'passthrough',
    '-vf', `scale=${frameWidth}:-2:flags=lanczos`,
    path.join(workDir, 'frame_%05d.png'),
  ], { maxBuffer: 1024 * 1024 * 64 })

  const files = (await readdir(workDir))
    .filter((name) => name.endsWith('.png'))
    .sort()
    .map((name) => path.join(workDir, name))

  if (files.length === 0) throw new Error('FFmpeg produced no frames')
  return files
}

async function main() {
  const videoPath = await findSourceVideo()
  console.log(`Source video: ${path.relative(rootDir, videoPath)}`)

  const info = await probe(videoPath)
  console.log(
    `Probed: ${info.width}x${info.height} @ ${info.fps.toFixed(3)}fps, ${info.duration.toFixed(3)}s`,
  )

  const frameWidth = Math.min(FRAME_WIDTH, info.width)
  const workDir = await mkdtemp(path.join(tmpdir(), 'hero-frames-'))

  try {
    console.log('Extracting frames with FFmpeg...')
    const framePaths = await extractFrames(videoPath, frameWidth, workDir)
    const frameCount = framePaths.length

    const first = await sharp(framePaths[0]).metadata()
    const actualFrameWidth = first.width!
    const actualFrameHeight = first.height!
    console.log(
      `Extracted ${frameCount} frames at ${actualFrameWidth}x${actualFrameHeight}`,
    )

    const framesPerSheet = Math.max(1, Math.floor(MAX_SHEET_WIDTH / actualFrameWidth))
    const sheetCount = Math.ceil(frameCount / framesPerSheet)

    if (existsSync(outputDir)) await rm(outputDir, { recursive: true })
    await mkdir(outputDir, { recursive: true })

    const sheets = []
    for (let sheetIndex = 0; sheetIndex < sheetCount; sheetIndex += 1) {
      const startFrame = sheetIndex * framesPerSheet
      const sheetFrames = framePaths.slice(startFrame, startFrame + framesPerSheet)
      const fileName = sheetCount === 1 ? 'hero-sprite.webp' : `hero-sprite-${sheetIndex}.webp`
      const sheetWidth = sheetFrames.length * actualFrameWidth

      await sharp({
        create: {
          width: sheetWidth,
          height: actualFrameHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite(
          sheetFrames.map((input, i) => ({
            input,
            left: i * actualFrameWidth,
            top: 0,
          })),
        )
        .webp({ quality: WEBP_QUALITY, effort: 6 })
        .toFile(path.join(outputDir, fileName))

      sheets.push({
        file: `/hero-frames/${fileName}`,
        startFrame,
        frameCount: sheetFrames.length,
        width: sheetWidth,
        height: actualFrameHeight,
      })
      console.log(`  ${fileName}: ${sheetFrames.length} frames, ${sheetWidth}px wide`)
    }

    const metadata = {
      frameCount,
      holdFrame: Math.min(HOLD_FRAME, frameCount - 1),
      fps: info.fps,
      duration: frameCount / info.fps,
      frameWidth: actualFrameWidth,
      frameHeight: actualFrameHeight,
      sourceWidth: info.width,
      sourceHeight: info.height,
      framesPerSheet,
      sheets,
    }

    await writeFile(
      path.join(outputDir, 'metadata.json'),
      `${JSON.stringify(metadata, null, 2)}\n`,
    )
    console.log(`Wrote ${sheetCount} sheet(s) + metadata.json to public/hero-frames/`)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
