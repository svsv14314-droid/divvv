/**
 * Cover art for the six work cases, rendered by scripts/renderCovers.ts.
 *
 * These are art-directed title cards built from Divyansh's own 3D figures
 * and plain primitives: they illustrate each discipline, they are not
 * client work. One stage, six set dressings.
 */
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontJson from 'three/examples/fonts/helvetiker_bold.typeface.json'
import { createCounter, createFigure, loadFigureAssets, type Pose, type Shading } from '../../src/three/figure'

const WIDTH = 1600
const HEIGHT = 1200
const BG = new THREE.Color('#0d0a0b')
const WINE = new THREE.Color('#b8344d')
const BLUSH = new THREE.Color('#ff9fae')

export const COVERS = [
  'character-animation',
  '3d-modeling',
  'motion-graphics-video',
  'brand-social-creative',
  'real-estate-campaigns',
  'brand-identity-print',
] as const

type Stage = { scene: THREE.Scene; camera: THREE.PerspectiveCamera }

function stage(): Stage {
  const scene = new THREE.Scene()
  scene.background = BG
  scene.fog = new THREE.Fog(BG, 7, 16)
  const camera = new THREE.PerspectiveCamera(30, WIDTH / HEIGHT, 0.1, 60)

  // Back wall glow.
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 18),
    new THREE.ShaderMaterial({
      depthWrite: false,
      uniforms: { bg: { value: BG } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `
        uniform vec3 bg; varying vec3 vW;
        void main(){
          float d = length((vW.xy - vec2(0.0, 1.8)) * vec2(0.5, 0.75));
          vec3 c = mix(bg, vec3(0.085, 0.014, 0.026), smoothstep(3.4, 0.0, d));
          c += vec3(0.28, 0.07, 0.06) * smoothstep(1.5, 0.0, d) * 0.12;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  )
  glow.position.set(0, 2, -7)
  scene.add(glow)

  // Viewport floor grid.
  const grid = new THREE.GridHelper(30, 60, 0x5a1f2c, 0x2e1419)
  ;(grid.material as THREE.Material).transparent = true
  ;(grid.material as THREE.Material).opacity = 0.7
  scene.add(grid)

  scene.add(new THREE.HemisphereLight('#8a6068', '#0b0708', 1.6))
  const key = new THREE.DirectionalLight('#ffe8de', 2.6)
  key.position.set(-3, 5, 4)
  scene.add(key)
  const rim = new THREE.PointLight(WINE, 18, 12)
  rim.position.set(2.5, 2.5, -2)
  scene.add(rim)
  return { scene, camera }
}

function wireMaterial(opacity = 0.4) {
  return new THREE.LineBasicMaterial({ color: '#e7a28f', transparent: true, opacity })
}

function wire(geometry: THREE.BufferGeometry, opacity = 0.4) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 1), wireMaterial(opacity))
}

async function figure(pose: Pose, shading: Shading, options: { opacity?: number; tint?: THREE.Color } = {}) {
  const assets = await loadFigureAssets(pose)
  const fig = createFigure(assets, { shading, height: 2, relief: 0.13, segments: 200, rimColor: '#ff9d9d', clayColor: '#c9aa98' })
  if (options.opacity !== undefined) {
    fig.material.transparent = true
    fig.material.depthWrite = false
    fig.material.alphaToCoverage = false
    fig.material.uniforms.opacity.value = options.opacity
  }
  if (options.tint) fig.material.uniforms.clayColor.value = options.tint
  const counter = createCounter(pose, shading)
  if (counter) fig.group.add(counter.group)
  return fig.group
}

function ring(radius: number, tube: number, color: THREE.ColorRepresentation) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 160), new THREE.MeshBasicMaterial({ color }))
}

/** Canvas-painted card: rounded, with a gradient and abstract layout blocks. */
function card(width: number, height: number, from: string, to: string, seed: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * 200)
  canvas.height = Math.round(height * 200)
  const ctx = canvas.getContext('2d')!
  const r = 28
  ctx.beginPath()
  ctx.roundRect(0, 0, canvas.width, canvas.height, r)
  ctx.clip()
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, from)
  gradient.addColorStop(1, to)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 0.9
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath()
  ctx.arc(canvas.width * (0.3 + (seed % 3) * 0.2), canvas.height * 0.36, canvas.width * 0.24, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillRect(canvas.width * 0.1, canvas.height * 0.72, canvas.width * 0.62, canvas.height * 0.045)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fillRect(canvas.width * 0.1, canvas.height * 0.8, canvas.width * 0.4, canvas.height * 0.03)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }),
  )
  return mesh
}

const builders: Record<(typeof COVERS)[number], (s: Stage) => Promise<void>> = {
  // Onion-skin trail: the walk pose repeated like animation ghosts, keyframes below.
  async 'character-animation'({ scene, camera }) {
    const ghosts = [-1.5, -1.0, -0.5]
    for (const [i, x] of ghosts.entries()) {
      const g = await figure('walking', 'clay', { opacity: 0.16 + i * 0.12, tint: new THREE.Color('#d0566c') })
      g.position.set(x, 0, -0.4 - (ghosts.length - i) * 0.12)
      g.rotation.y = 0.18
      scene.add(g)
    }
    const hero = await figure('walking', 'render')
    hero.position.x = 0.15
    hero.rotation.y = 0.18
    scene.add(hero)
    // Timeline with keyframe diamonds.
    const line = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: '#5d2632' }))
    line.position.set(-0.4, 0.06, 0.9)
    scene.add(line)
    for (const [i, x] of [-2.4, -1.6, -0.9, -0.3, 0.6, 1.5].entries()) {
      const key = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), new THREE.MeshBasicMaterial({ color: i === 4 ? BLUSH : '#b8344d' }))
      key.position.set(x, 0.07, 0.9)
      scene.add(key)
    }
    camera.position.set(0.9, 1.35, 5.4)
    camera.lookAt(-0.35, 1.0, 0)
  },

  // Topology: the leaning pose in wireframe, surrounded by modelling primitives.
  async '3d-modeling'({ scene, camera }) {
    const g = await figure('leaning', 'wireframe')
    g.rotation.y = -0.35
    scene.add(g)
    const ico = wire(new THREE.IcosahedronGeometry(0.42, 1), 0.55)
    ico.position.set(1.35, 1.65, -0.4)
    const box = wire(new THREE.BoxGeometry(0.6, 0.6, 0.6, 3, 3, 3), 0.45)
    box.position.set(1.5, 0.3, 0.3)
    box.rotation.set(0.3, 0.6, 0)
    const torus = wire(new THREE.TorusKnotGeometry(0.28, 0.08, 64, 8), 0.45)
    torus.position.set(-1.6, 1.9, -0.8)
    scene.add(ico, box, torus)
    camera.position.set(0.3, 1.4, 5)
    camera.lookAt(0, 1.05, 0)
  },

  // Motion: the render pass framed by tilted rings, like a title sequence.
  async 'motion-graphics-video'({ scene, camera }) {
    const g = await figure('walking', 'render')
    scene.add(g)
    const rings = [
      [1.15, 0.012, BLUSH, 0.2, 0],
      [1.45, 0.008, WINE, -0.5, 0.4],
      [1.8, 0.006, '#e7a28f', 0.9, -0.3],
    ] as const
    for (const [radius, tube, color, rx, ry] of rings) {
      const r = ring(radius, tube, color)
      r.position.set(0, 1.35, -0.3)
      r.rotation.set(Math.PI / 2 + rx, ry, 0)
      scene.add(r)
    }
    // Film frames receding behind him.
    for (let i = 0; i < 5; i += 1) {
      const frame = wire(new THREE.PlaneGeometry(1.1, 0.7), 0.35 - i * 0.05)
      frame.position.set(-1.9 + i * 0.25, 2.2 - i * 0.05, -1.5 - i * 0.6)
      scene.add(frame)
    }
    camera.position.set(-0.6, 1.5, 4.6)
    camera.lookAt(0.1, 1.2, 0)
  },

  // Social: a fan of floating post and story cards.
  async 'brand-social-creative'({ scene, camera }) {
    const palette = [
      ['#c93d57', '#5a1424'],
      ['#e7a28f', '#9c4b52'],
      ['#2b1d22', '#6f1f2f'],
      ['#ff9fae', '#c93d57'],
      ['#8e2a3d', '#2a0d14'],
    ]
    const sizes = [
      [0.95, 1.7],
      [1.2, 1.2],
      [0.95, 1.7],
      [1.2, 1.5],
      [1.2, 1.2],
    ]
    for (let i = 0; i < 5; i += 1) {
      const [w, h] = sizes[i]
      const c = card(w, h, palette[i][0], palette[i][1], i)
      const t = i - 2
      c.position.set(t * 0.78, 1.35 + Math.abs(t) * -0.12, -Math.abs(t) * 0.45)
      c.rotation.set(0, -t * 0.32, t * -0.05)
      scene.add(c)
      const outline = wire(new THREE.PlaneGeometry(w, h), 0.25)
      outline.position.copy(c.position)
      outline.rotation.copy(c.rotation)
      outline.translateZ(-0.002)
      scene.add(outline)
    }
    camera.position.set(0, 1.55, 5.6)
    camera.lookAt(0, 1.2, -0.3)
  },

  // Real estate: a low-poly district with one tower lit up.
  async 'real-estate-campaigns'({ scene, camera }) {
    const solid = new THREE.MeshStandardMaterial({ color: '#191315', roughness: 0.6 })
    const hero = new THREE.MeshStandardMaterial({ color: '#8e2a3d', roughness: 0.35, emissive: '#3a0c16' })
    const towers = [
      [0, 0, 0.7, 2.6, true],
      [-1.0, -0.4, 0.6, 1.6, false],
      [1.0, -0.6, 0.55, 1.9, false],
      [-0.5, 0.9, 0.5, 1.1, false],
      [0.7, 0.8, 0.6, 1.3, false],
      [-1.8, 0.5, 0.5, 0.9, false],
      [1.9, 0.3, 0.6, 1.2, false],
      [-1.5, -1.5, 0.7, 2.1, false],
      [1.6, -1.7, 0.6, 1.6, false],
    ] as const
    for (const [x, z, w, h, lit] of towers) {
      const geometry = new THREE.BoxGeometry(w, h, w, 1, Math.round(h * 4), 1)
      const mesh = new THREE.Mesh(geometry, lit ? hero : solid)
      mesh.position.set(x, h / 2, z)
      const edges = wire(geometry, lit ? 0.9 : 0.35)
      edges.position.copy(mesh.position)
      scene.add(mesh, edges)
    }
    camera.position.set(5.4, 4.2, 6.6)
    camera.lookAt(0, 0.85, -0.4)
  },

  // Identity: an extruded DT monogram on a plinth.
  async 'brand-identity-print'({ scene, camera }) {
    const font = new FontLoader().parse(fontJson as never)
    const geometry = new TextGeometry('DT', {
      font,
      size: 1,
      depth: 0.35,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.025,
      bevelSegments: 4,
    })
    geometry.center()
    const mono = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: '#a8344b', roughness: 0.28, metalness: 0.35 }),
    )
    mono.position.set(0, 1.25, 0)
    mono.rotation.y = -0.38
    scene.add(mono)
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.25, 0.5, 64),
      new THREE.MeshStandardMaterial({ color: '#1d1719', roughness: 0.5 }),
    )
    plinth.position.y = 0.25
    scene.add(plinth, wire(new THREE.CylinderGeometry(1.2, 1.25, 0.5, 32), 0.25).translateY(0.25))
    const halo = ring(1.35, 0.01, BLUSH)
    halo.position.set(0, 1.3, -0.9)
    scene.add(halo)
    camera.position.set(0.9, 2.1, 5.8)
    camera.lookAt(0, 1.2, 0)
  },
}

async function setup() {
  const canvas = document.querySelector('canvas')!
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(WIDTH, HEIGHT, false)

  const renderCover = async (slug: (typeof COVERS)[number]) => {
    const s = stage()
    await builders[slug](s)
    s.camera.updateProjectionMatrix()
    renderer.render(s.scene, s.camera)
    return canvas.toDataURL('image/png')
  }
  return { covers: [...COVERS], renderCover }
}

declare global {
  interface Window {
    coverRender: ReturnType<typeof setup>
  }
}

window.coverRender = setup()
