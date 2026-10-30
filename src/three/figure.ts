/**
 * Divyansh as a 3D relief mesh: the cut-out photo displaced by its depth map
 * (see scripts/prepareFigure.ts). One builder serves the hero render and the
 * three viewports on the site, each with its own shading pass:
 *
 * - 'render'    the photo, lit with a fresnel rim
 * - 'clay'      sculpt-style matte clay, shaded from the mesh normals
 * - 'wireframe' coarse topology lines over a dark fill
 */
import * as THREE from 'three'

export type Shading = 'render' | 'clay' | 'wireframe'

/** Photo poses, each prepared by scripts/prepareFigure.ts into public/figure/<pose>/. */
export type Pose = 'walking' | 'leaning'

/**
 * Staging per pose, in world units for a figure 2 units tall. The leaning
 * photo rests his elbow on a counter, so the scene rebuilds that counter:
 * `right` is its right face (x) and `top` its height, both measured on the
 * cut-out. `frame` is what the viewport camera keeps in shot.
 */
export const POSES: Record<Pose, { counter?: { right: number; top: number }; frame: { width: number; centerX: number } }> = {
  walking: { frame: { width: 1.1, centerX: 0 } },
  leaning: { counter: { right: -0.14, top: 1.2 }, frame: { width: 1.3, centerX: -0.12 } },
}

export type FigureAssets = {
  color: THREE.Texture
  depth: ImageData
  mask: ImageData
  aspect: number
}

type FigureOptions = {
  /** World-space height of the figure. */
  height?: number
  /** Relief depth as a fraction of height. */
  relief?: number
  /** Grid columns; rows follow the aspect ratio. */
  segments?: number
  shading: Shading
  rimColor?: THREE.ColorRepresentation
  clayColor?: THREE.ColorRepresentation
  wireColor?: THREE.ColorRepresentation
}

const BASE = '/figure/'
/**
 * Grid columns for the relief mesh. The depth map is only ~130px wide, so
 * finer grids add vertices (and build time) without adding visible detail.
 */
const DEFAULT_SEGMENTS = 120
/** Columns of the retopology wire: coarse enough to read as quads at viewport size. */
const WIRE_SEGMENTS = 26

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load ${src}`))
    image.src = src
  })
}

function pixels(image: HTMLImageElement, width = image.naturalWidth, height = image.naturalHeight) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(image, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

const assetsCache = new Map<Pose, Promise<FigureAssets>>()

/** Fetched once per pose and shared by every viewport on the page. */
export function loadFigureAssets(pose: Pose = 'walking'): Promise<FigureAssets> {
  const cached = assetsCache.get(pose)
  if (cached) return cached
  const promise = (async () => {
    const [colorImage, depthImage] = await Promise.all([
      loadImage(`${BASE}${pose}/figure.webp`),
      loadImage(`${BASE}${pose}/depth.png`),
    ])
    const color = new THREE.Texture(colorImage)
    color.colorSpace = THREE.SRGBColorSpace
    color.anisotropy = 4
    color.needsUpdate = true
    const depth = pixels(depthImage)
    // The mask is read from the colour alpha at depth resolution.
    const mask = pixels(colorImage, depth.width, depth.height)
    return { color, depth, mask, aspect: colorImage.naturalWidth / colorImage.naturalHeight }
  })()
  assetsCache.set(pose, promise)
  return promise
}

/** The counter from the leaning photo: dark stone for the render, clay for the sculpt. */
export function createCounter(pose: Pose, shading: Shading) {
  const counter = POSES[pose].counter
  if (!counter) return null
  const width = 0.6
  const depth = 0.75
  const geometry = new THREE.BoxGeometry(width, counter.top, depth)
  geometry.translate(counter.right - width / 2, counter.top / 2, -0.06)
  const material =
    shading === 'wireframe'
      ? new THREE.MeshBasicMaterial({ color: '#ff8a9c', wireframe: true, transparent: true, opacity: 0.35 })
      : new THREE.MeshStandardMaterial(
          shading === 'clay'
            ? { color: '#bfa190', roughness: 0.85 }
            : { color: '#3a3133', roughness: 0.28, metalness: 0.15 },
        )
  const mesh = new THREE.Mesh(geometry, material)
  // Catch-light on the edges so the slab reads as stone, not a hole.
  const edgeGeometry = new THREE.EdgesGeometry(geometry)
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: shading === 'clay' ? '#e6cbbb' : '#ff9fae',
    transparent: true,
    opacity: shading === 'wireframe' ? 0 : 0.35,
  })
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
  // Lights for the counter only; the figure shader carries its own lighting.
  const key = new THREE.DirectionalLight('#ffe6dc', 3)
  key.position.set(-1.5, 3, 2.5)
  const fill = new THREE.HemisphereLight('#6b4a52', '#120a0c', 1.4)
  const group = new THREE.Group()
  group.add(mesh, edges, key, fill)
  return {
    group,
    dispose: () => {
      geometry.dispose()
      material.dispose()
      edgeGeometry.dispose()
      edgeMaterial.dispose()
    },
  }
}

function sampleDepth(depth: ImageData, u: number, v: number) {
  const x = Math.min(depth.width - 1, Math.max(0, u * (depth.width - 1)))
  const y = Math.min(depth.height - 1, Math.max(0, v * (depth.height - 1)))
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(depth.width - 1, x0 + 1)
  const y1 = Math.min(depth.height - 1, y0 + 1)
  const fx = x - x0
  const fy = y - y0
  const at = (px: number, py: number) => {
    const i = (py * depth.width + px) * 4
    return (depth.data[i] * 256 + depth.data[i + 1]) / 65535
  }
  const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx
  const bottom = at(x0, y1) * (1 - fx) + at(x1, y1) * fx
  return top * (1 - fy) + bottom * fy
}

function sampleMask(mask: ImageData, u: number, v: number) {
  const x = Math.round(Math.min(1, Math.max(0, u)) * (mask.width - 1))
  const y = Math.round(Math.min(1, Math.max(0, v)) * (mask.height - 1))
  return mask.data[(y * mask.width + x) * 4 + 3] / 255
}

/**
 * Displaced grid, with triangles outside the silhouette dropped: a triangle
 * stays when any corner is inside, and the shader's alpha test trims the edge
 * exactly. `quads` instead returns the grid's horizontal and vertical edges
 * where both ends are inside: retopology-style lines with no diagonals.
 */
const geometryCache = new WeakMap<FigureAssets, Map<string, THREE.BufferGeometry>>()

/**
 * Meshes cost ~100 ms each to build on the main thread, so they are built once
 * per pose and settings and shared by every viewport (and every Toolkit tab
 * switch). Cached geometry lives for the page and is never disposed.
 */
function cachedGeometry(assets: FigureAssets, height: number, relief: number, segments: number, quads = false) {
  let byKey = geometryCache.get(assets)
  if (!byKey) {
    byKey = new Map()
    geometryCache.set(assets, byKey)
  }
  const key = `${height}|${relief}|${segments}|${quads}`
  let geometry = byKey.get(key)
  if (!geometry) {
    geometry = buildGeometry(assets, height, relief, segments, quads)
    byKey.set(key, geometry)
  }
  return geometry
}

function buildGeometry(assets: FigureAssets, height: number, relief: number, segments: number, quads = false) {
  const width = height * assets.aspect
  const cols = segments
  const rows = Math.round(segments / assets.aspect)
  const positions = new Float32Array((cols + 1) * (rows + 1) * 3)
  const uvs = new Float32Array((cols + 1) * (rows + 1) * 2)
  const inside = new Uint8Array((cols + 1) * (rows + 1))

  for (let r = 0; r <= rows; r += 1) {
    for (let c = 0; c <= cols; c += 1) {
      const i = r * (cols + 1) + c
      const u = c / cols
      const v = r / rows
      positions[i * 3] = (u - 0.5) * width
      positions[i * 3 + 1] = (1 - v) * height
      positions[i * 3 + 2] = sampleDepth(assets.depth, u, v) * relief * height
      uvs[i * 2] = u
      uvs[i * 2 + 1] = 1 - v
      inside[i] = sampleMask(assets.mask, u, v) > 0.5 ? 1 : 0
    }
  }

  const indices: number[] = []
  for (let r = 0; r <= rows; r += 1) {
    for (let c = 0; c <= cols; c += 1) {
      const a = r * (cols + 1) + c
      const b = a + 1
      const d = a + cols + 1
      const e = d + 1
      if (quads) {
        if (c < cols && inside[a] && inside[b]) indices.push(a, b)
        if (r < rows && inside[a] && inside[d]) indices.push(a, d)
        continue
      }
      if (r === rows || c === cols) continue
      if (inside[a] || inside[d] || inside[b]) indices.push(a, d, b)
      if (inside[b] || inside[d] || inside[e]) indices.push(b, d, e)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  if (!quads) geometry.computeVertexNormals()
  // Centre the relief on z = 0 so rotation pivots through the body.
  geometry.translate(0, 0, -relief * height * 0.5)
  return geometry
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform int mode;
  uniform vec3 rimColor;
  uniform float rimStrength;
  uniform vec3 clayColor;
  uniform vec3 keyDir;
  uniform float exposure;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec4 tex = texture2D(map, vUv);
    if (tex.a < 0.04) discard;
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(vView);
    float facing = clamp(dot(n, v), 0.0, 1.0);
    float rim = pow(1.0 - facing, 4.5);
    float key = clamp(dot(n, normalize(keyDir)), 0.0, 1.0);

    vec3 color;
    if (mode == 1) {
      // Clay: half-lambert key, sky/ground fill, soft spec and rim.
      float wrap = key * 0.5 + 0.5;
      vec3 fill = mix(vec3(0.20, 0.16, 0.17), vec3(0.42, 0.40, 0.44), n.y * 0.5 + 0.5);
      vec3 h = normalize(normalize(keyDir) + v);
      float spec = pow(clamp(dot(n, h), 0.0, 1.0), 28.0) * 0.18;
      color = clayColor * (wrap * wrap * 1.05) + clayColor * fill * 0.55 + spec + rimColor * rim * rimStrength;
    } else {
      color = tex.rgb * (0.82 + 0.32 * key) + rimColor * rim * rimStrength;
    }
    // Alpha-to-coverage turns this into a soft, MSAA-smoothed silhouette.
    gl_FragColor = vec4(color * exposure, smoothstep(0.45, 0.8, tex.a) * opacity);
    #include <colorspace_fragment>
  }
`

export type Figure = {
  group: THREE.Group
  material: THREE.ShaderMaterial
  dispose: () => void
}

export function createFigure(assets: FigureAssets, options: FigureOptions): Figure {
  const height = options.height ?? 2
  const relief = options.relief ?? 0.12
  const group = new THREE.Group()

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: false,
    alphaToCoverage: true,
    uniforms: {
      map: { value: assets.color },
      mode: { value: options.shading === 'render' ? 0 : 1 },
      rimColor: { value: new THREE.Color(options.rimColor ?? '#ff9aa8') },
      rimStrength: { value: options.shading === 'clay' ? 0.5 : 0.3 },
      clayColor: { value: new THREE.Color(options.clayColor ?? '#c7a99a') },
      keyDir: { value: new THREE.Vector3(-0.5, 0.6, 0.8) },
      exposure: { value: 1 },
      opacity: { value: 1 },
    },
  })

  const disposables: { dispose: () => void }[] = [material]

  if (options.shading === 'wireframe') {
    // Dark fill so lines behind the body are hidden, then topology on top.
    const fillGeometry = cachedGeometry(assets, height, relief, options.segments ?? DEFAULT_SEGMENTS)
    material.uniforms.clayColor.value = new THREE.Color('#1c1216')
    material.uniforms.rimStrength.value = 0.9
    material.polygonOffset = true
    material.polygonOffsetFactor = 1
    material.polygonOffsetUnits = 1
    const fill = new THREE.Mesh(fillGeometry, material)

    const wireGeometry = cachedGeometry(assets, height, relief, WIRE_SEGMENTS, true)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: options.wireColor ?? '#ff8fa0',
      transparent: true,
      opacity: 0.8,
    })
    const wire = new THREE.LineSegments(wireGeometry, lineMaterial)
    wire.position.z = 0.002
    group.add(fill, wire)
    disposables.push(lineMaterial)
  } else {
    const geometry = cachedGeometry(assets, height, relief, options.segments ?? DEFAULT_SEGMENTS)
    group.add(new THREE.Mesh(geometry, material))
  }

  return {
    group,
    material,
    dispose: () => disposables.forEach((item) => item.dispose()),
  }
}
