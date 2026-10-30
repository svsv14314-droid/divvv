/**
 * Builds the web assets for the 3D figures (src/three/figure.ts) from the
 * cut-outs and monocular depth maps in "Divyansh Tandon Portfolio/source/",
 * plus the depth-parallax desk photo (src/components/ParallaxPhoto.tsx).
 *
 * Those two inputs come from the photo via transformers.js (BiRefNet_lite for
 * the matte, Depth Anything V2 small for depth); this script only reshapes
 * them, so it runs without any ML dependency.
 *
 * Output, per figure in public/figure/<name>/:
 * - figure.webp   colour + alpha, cropped to the silhouette
 * - depth.png     relief depth, 16-bit packed into R (high) and G (low)
 * - figure.json   aspect ratio, so the mesh is sized before textures decode
 * and public/photos/desk.webp + desk-depth.webp for the parallax photo.
 *
 * Usage: npm run prepare:figure
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(rootDir, 'Divyansh Tandon Portfolio', 'source')
const figureRoot = path.join(rootDir, 'public', 'figure')
const photoDir = path.join(rootDir, 'public', 'photos')
/** Each pose has <name>-cutout.png and <name>-depth.png in the source folder. */
const FIGURES = ['walking', 'leaning']

/** Longest side of the colour texture. */
const COLOR_HEIGHT = 1400
/** Depth is smooth by nature; a small map keeps the download tiny. */
const DEPTH_HEIGHT = 384
/** Share of relief that comes from the silhouette (rounded edges) vs. the depth model. */
const INFLATE_MIX = 0.45
/** Radius of the rounded edge, as a fraction of the figure width. */
const INFLATE_RADIUS = 0.06
/** Pixels the colour matte is pulled in by, to drop background fringe. */
const ERODE_PX = 3

type Gray = { data: Float32Array; width: number; height: number }

async function readChannel(file: string | Buffer, channel: number, width: number, height: number): Promise<Gray> {
  const { data, info } = await sharp(file)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const out = new Float32Array(width * height)
  for (let i = 0; i < out.length; i += 1) out[i] = data[i * info.channels + channel] / 255
  return { data: out, width, height }
}

/**
 * Chamfer distance transform that also records each pixel's nearest inside
 * pixel, so outside values can be filled from the silhouette edge (no seams
 * where the mesh is cut).
 */
function distanceAndNearest(mask: Uint8Array, width: number, height: number) {
  const dist = new Float32Array(width * height).fill(Infinity)
  const near = new Int32Array(width * height).fill(-1)
  const outDist = new Float32Array(width * height).fill(Infinity)

  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) {
      near[i] = i
      outDist[i] = 0
    } else {
      dist[i] = 0
    }
  }

  const passes: [number, number, number][][] = [
    [[-1, 0, 1], [0, -1, 1], [-1, -1, Math.SQRT2], [1, -1, Math.SQRT2]],
    [[1, 0, 1], [0, 1, 1], [1, 1, Math.SQRT2], [-1, 1, Math.SQRT2]],
  ]

  for (const [p, offsets] of passes.entries()) {
    const forward = p === 0
    for (let yy = 0; yy < height; yy += 1) {
      const y = forward ? yy : height - 1 - yy
      for (let xx = 0; xx < width; xx += 1) {
        const x = forward ? xx : width - 1 - xx
        const i = y * width + x
        for (const [dx, dy, cost] of offsets) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const j = ny * width + nx
          if (dist[j] + cost < dist[i]) dist[i] = dist[j] + cost
          if (outDist[j] + cost < outDist[i]) {
            outDist[i] = outDist[j] + cost
            near[i] = near[j]
          }
        }
      }
    }
  }
  return { dist, near }
}

/** Min-filter on the alpha channel, `radius` passes of a 3×3 window. */
function erodeAlpha(rgba: Buffer, width: number, height: number, radius: number) {
  let alpha = new Uint8Array(width * height)
  for (let i = 0; i < alpha.length; i += 1) alpha[i] = rgba[i * 4 + 3]
  for (let pass = 0; pass < radius; pass += 1) {
    const next = new Uint8Array(alpha.length)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let min = 255
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = Math.min(width - 1, Math.max(0, x + dx))
            const ny = Math.min(height - 1, Math.max(0, y + dy))
            min = Math.min(min, alpha[ny * width + nx])
          }
        }
        next[y * width + x] = min
      }
    }
    alpha = next
  }
  const out = Buffer.from(rgba)
  for (let i = 0; i < alpha.length; i += 1) out[i * 4 + 3] = alpha[i]
  return out
}

function boxBlur(src: Float32Array, width: number, height: number, radius: number) {
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  const span = radius * 2 + 1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0
      for (let k = -radius; k <= radius; k += 1) sum += src[y * width + Math.min(width - 1, Math.max(0, x + k))]
      tmp[y * width + x] = sum / span
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0
      for (let k = -radius; k <= radius; k += 1) sum += tmp[Math.min(height - 1, Math.max(0, y + k)) * width + x]
      out[y * width + x] = sum / span
    }
  }
  return out
}

async function prepareFigure(name: string) {
  const cutoutPath = path.join(sourceDir, `${name}-cutout.png`)
  const depthPath = path.join(sourceDir, `${name}-depth.png`)
  const outputDir = path.join(figureRoot, name)

  // Crop to the silhouette with a small margin.
  const trimmed = await sharp(cutoutPath).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true })
  const meta = await sharp(cutoutPath).metadata()
  const left = -(trimmed.info.trimOffsetLeft ?? 0)
  const top = -(trimmed.info.trimOffsetTop ?? 0)
  const margin = Math.round(trimmed.info.width * 0.04)
  const crop = {
    left: Math.max(0, left - margin),
    top: Math.max(0, top - margin),
    width: 0,
    height: 0,
  }
  crop.width = Math.min(meta.width! - crop.left, trimmed.info.width + margin * 2)
  crop.height = Math.min(meta.height! - crop.top, trimmed.info.height + margin * 2)
  const aspect = crop.width / crop.height
  console.log(`[${name}] silhouette crop ${crop.width}x${crop.height} at ${crop.left},${crop.top}`)

  await mkdir(outputDir, { recursive: true })

  const colorHeight = Math.min(COLOR_HEIGHT, crop.height)
  const { data: rgba, info: colorInfo } = await sharp(cutoutPath)
    .extract(crop)
    .resize({ height: colorHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  // The matte carries a sliver of the restaurant around the hair; pull it in.
  const eroded = erodeAlpha(rgba, colorInfo.width, colorInfo.height, ERODE_PX)
  await sharp(eroded, { raw: { width: colorInfo.width, height: colorInfo.height, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 90, effort: 6 })
    .toFile(path.join(outputDir, 'figure.webp'))

  // Depth work happens at the depth map's own (small) resolution.
  const dh = DEPTH_HEIGHT
  const dw = Math.round(dh * aspect)
  const croppedCutout = await sharp(cutoutPath).extract(crop).png().toBuffer()
  const croppedDepth = await sharp(depthPath).extract(crop).png().toBuffer()
  const alpha = await readChannel(croppedCutout, 3, dw, dh)
  const depth = await readChannel(croppedDepth, 0, dw, dh)

  const mask = new Uint8Array(dw * dh)
  for (let i = 0; i < mask.length; i += 1) mask[i] = alpha.data[i] > 0.5 ? 1 : 0

  // Normalise model depth inside the silhouette (2nd–98th percentile).
  const inside = Array.from(depth.data.filter((_, i) => mask[i])).sort((a, b) => a - b)
  const lo = inside[Math.floor(inside.length * 0.02)]
  const hi = inside[Math.floor(inside.length * 0.98)]

  const { dist, near } = distanceAndNearest(mask, dw, dh)
  const radius = INFLATE_RADIUS * dw
  const relief = new Float32Array(dw * dh)
  for (let i = 0; i < relief.length; i += 1) {
    if (!mask[i]) continue
    const d = Math.min(1, Math.max(0, (depth.data[i] - lo) / (hi - lo || 1)))
    const t = Math.min(1, dist[i] / radius)
    const inflate = Math.sqrt(1 - (1 - t) * (1 - t))
    relief[i] = (1 - INFLATE_MIX) * d + INFLATE_MIX * inflate
  }
  // Outside the silhouette, copy the nearest edge value so cut triangles never stretch.
  for (let i = 0; i < relief.length; i += 1) {
    if (!mask[i] && near[i] >= 0) relief[i] = relief[near[i]]
  }
  const smooth = boxBlur(boxBlur(relief, dw, dh, 2), dw, dh, 1)

  const packed = Buffer.alloc(dw * dh * 3)
  for (let i = 0; i < smooth.length; i += 1) {
    const v = Math.round(Math.min(1, Math.max(0, smooth[i])) * 65535)
    packed[i * 3] = v >> 8
    packed[i * 3 + 1] = v & 0xff
    packed[i * 3 + 2] = mask[i] ? 255 : 0
  }
  await sharp(packed, { raw: { width: dw, height: dh, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'depth.png'))

  await writeFile(
    path.join(outputDir, 'figure.json'),
    `${JSON.stringify({ aspect, depthWidth: dw, depthHeight: dh }, null, 2)}\n`,
  )
  console.log(`[${name}] wrote figure.webp, depth.png (${dw}x${dh}) and figure.json`)
}

/** The desk photo keeps its background; depth only drives a gentle parallax. */
async function preparePhoto() {
  await mkdir(photoDir, { recursive: true })
  await sharp(path.join(rootDir, 'Divyansh Tandon Portfolio', 'divyansh-desk.webp'))
    .resize({ width: 1024 })
    .webp({ quality: 84, effort: 6 })
    .toFile(path.join(photoDir, 'desk.webp'))
  // Blurred so the parallax bends smoothly instead of tearing at depth edges.
  await sharp(path.join(sourceDir, 'desk-depth.png'))
    .resize({ width: 512 })
    .greyscale()
    .blur(4)
    .webp({ quality: 90 })
    .toFile(path.join(photoDir, 'desk-depth.webp'))
  console.log('[desk] wrote public/photos/desk.webp + desk-depth.webp')
}

async function main() {
  for (const name of FIGURES) await prepareFigure(name)
  await preparePhoto()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
