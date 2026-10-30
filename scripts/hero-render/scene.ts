/**
 * The hero film: Divyansh's relief figure in a dark studio, rendered one
 * deterministic frame at a time by scripts/renderHeroVideo.ts.
 *
 * The 240-frame timeline mirrors the beats Hero.tsx scrubs between:
 *   0–48    idle (Hero loops the first sheet of this)
 *   64      turned toward the left of the screen
 *   112     turned toward the right
 *   148     back to centre — "notice"
 *   196     light sweep — "wave"
 *   220–239 pull back, tilt toward the scroll cue — "point" (hold at 232)
 */
import * as THREE from 'three'
import { createFigure, loadFigureAssets } from '../../src/three/figure'

const WIDTH = 1920
const HEIGHT = 1080
const FRAMES = 240
const BG = new THREE.Color('#0e0809')

type Key = [frame: number, value: number]

const smooth = (t: number) => t * t * (3 - 2 * t)

/** Piecewise ease-in-out between keyframes. */
function track(keys: Key[], frame: number) {
  if (frame <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    const [f1, v1] = keys[i]
    const [f0, v0] = keys[i - 1]
    if (frame <= f1) return v0 + (v1 - v0) * smooth((frame - f0) / (f1 - f0))
  }
  return keys[keys.length - 1][1]
}

const DEG = Math.PI / 180

/** Figure yaw: negative turns him toward the left of the screen. */
const YAW: Key[] = [
  [0, 0], [48, 2 * DEG], [64, -22 * DEG], [84, -23 * DEG], [112, 22 * DEG], [128, 23 * DEG],
  [148, 0], [196, 0], [210, 5 * DEG], [220, 0], [240, 0],
]
/** Camera slides toward the side he turns to, so the set parallaxes. */
const CAM_X: Key[] = [
  [0, 0], [48, 0.04], [64, -0.55], [84, -0.58], [112, 0.55], [128, 0.58], [148, 0], [240, 0],
]
const CAM_DIST: Key[] = [
  [0, 4.5], [48, 4.4], [148, 4.4], [196, 3.4], [220, 3.45], [232, 3.9], [240, 3.9],
]
const TARGET_Y: Key[] = [
  [0, 1.3], [148, 1.3], [196, 1.5], [220, 1.48], [232, 1.34], [240, 1.34],
]
const CAM_Y: Key[] = [
  [0, 1.42], [148, 1.42], [196, 1.6], [220, 1.6], [232, 1.72], [240, 1.72],
]
const RIM: Key[] = [
  [0, 0.28], [148, 0.28], [180, 0.4], [196, 0.4], [204, 0.85], [214, 0.5], [240, 0.42],
]
const HALO: Key[] = [
  [0, 0.75], [148, 0.75], [190, 1.05], [204, 1.35], [220, 1.1], [240, 1.1],
]

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Back wall: a soft wine glow behind the figure, falling to the page colour. */
function backdrop() {
  const material = new THREE.ShaderMaterial({
    uniforms: { intensity: { value: 1 }, bg: { value: BG } },
    vertexShader: `varying vec3 vWorld; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform float intensity; uniform vec3 bg; varying vec3 vWorld;
      void main(){
        // Linear-space values: they are lifted to sRGB on output.
        float d = length((vWorld.xy - vec2(0.0, 2.1)) * vec2(0.55, 0.8));
        vec3 wine = vec3(0.075, 0.012, 0.024);
        vec3 ember = vec3(0.30, 0.07, 0.06);
        vec3 c = mix(bg, wine, smoothstep(3.2, 0.0, d) * intensity);
        c += ember * smoothstep(1.4, 0.0, d) * 0.16 * intensity;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), material)
  mesh.position.set(0, 2.2, -9)
  return { mesh, material }
}

/** Viewport-style floor grid that fades into the dark. */
function floor() {
  const material = new THREE.ShaderMaterial({
    uniforms: { bg: { value: BG } },
    transparent: true,
    depthWrite: false,
    vertexShader: `varying vec3 vWorld; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform vec3 bg; varying vec3 vWorld;
      float grid(vec2 p, float size){
        vec2 g = abs(fract(p / size - 0.5) - 0.5) / fwidth(p / size);
        return 1.0 - min(min(g.x, g.y), 1.0);
      }
      void main(){
        float d = length(vWorld.xz - vec2(0.0, -1.5));
        float fade = smoothstep(9.0, 1.0, d);
        float minor = grid(vWorld.xz, 0.5) * 0.35;
        float major = grid(vWorld.xz, 2.0) * 0.8;
        float axis = (1.0 - min(abs(vWorld.x) / fwidth(vWorld.x), 1.0)) * 0.9;
        vec3 line = vec3(0.55, 0.12, 0.17);
        float a = max(max(minor, major), axis) * fade * 0.7;
        vec3 base = mix(bg, vec3(0.03, 0.008, 0.013), fade);
        gl_FragColor = vec4(mix(base, line, a), fade * 0.95);
        #include <colorspace_fragment>
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), material)
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

/** A studio ring light hung behind him. */
function ringLight() {
  const group = new THREE.Group()
  const tube = new THREE.Mesh(
    new THREE.TorusGeometry(0.74, 0.01, 16, 180),
    new THREE.MeshBasicMaterial({ color: '#ffb7a6' }),
  )
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: { intensity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float intensity; varying vec2 vUv;
      void main(){
        float r = length(vUv - 0.5) * 2.0;
        float ring = exp(-abs(r - 0.7) * 26.0) * 0.32 + exp(-abs(r - 0.7) * 6.0) * 0.08;
        gl_FragColor = vec4(vec3(1.0, 0.42, 0.40) * ring * intensity, 1.0);
      }`,
  })
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 2.12), glowMaterial)
  group.add(glow, tube)
  group.position.set(0, 1.56, -1.4)
  return { group, glowMaterial }
}

/** Wireframe primitives drifting in the dark: a nod to the modelling viewport. */
function primitives() {
  const material = new THREE.LineBasicMaterial({ color: '#e7a28f', transparent: true, opacity: 0.22 })
  const make = (geometry: THREE.BufferGeometry, x: number, y: number, z: number, s: number) => {
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 1), material)
    lines.position.set(x, y, z)
    lines.scale.setScalar(s)
    return lines
  }
  return [
    make(new THREE.IcosahedronGeometry(1, 1), -3.6, 2.6, -5.5, 0.55),
    make(new THREE.TorusGeometry(1, 0.32, 10, 24), 3.9, 2.2, -6, 0.5),
    make(new THREE.BoxGeometry(1, 1, 1, 2, 2, 2), 3.0, 0.55, -3.5, 0.42),
    make(new THREE.OctahedronGeometry(1, 0), -2.7, 0.7, -3.2, 0.32),
  ]
}

function dust(count: number) {
  const random = seeded(7)
  const base = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    base[i * 3] = (random() - 0.5) * 9
    base[i * 3 + 1] = random() * 3.6
    base[i * 3 + 2] = -random() * 6 + 1.2
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = 26.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.78, 0.66) * smoothstep(0.5, 0.0, d) * 0.4, 1.0); }`,
  })
  const points = new THREE.Points(geometry, material)
  const update = (frame: number) => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < count; i += 1) {
      const phase = i * 0.37
      attr.setX(i, base[i * 3] + Math.sin(frame * 0.02 + phase) * 0.08)
      attr.setY(i, (base[i * 3 + 1] + frame * 0.0035) % 3.6)
    }
    attr.needsUpdate = true
  }
  return { points, update }
}

async function setup() {
  const canvas = document.querySelector('canvas')!
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(WIDTH, HEIGHT, false)
  renderer.setClearColor(BG)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(22, WIDTH / HEIGHT, 0.1, 60)

  const back = backdrop()
  const ring = ringLight()
  const particles = dust(150)
  scene.add(back.mesh, floor(), ring.group, particles.points, ...primitives())

  const assets = await loadFigureAssets('walking')
  const figure = createFigure(assets, { shading: 'render', height: 2, relief: 0.13, segments: 260, rimColor: '#ff9d9d' })
  scene.add(figure.group)

  // Soft contact shadow so he stands on the grid.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 48),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.55, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.scale.set(1, 0.45, 1)
  shadow.position.y = 0.003
  scene.add(shadow)

  const prims = scene.children.filter((child): child is THREE.LineSegments => child instanceof THREE.LineSegments)

  const renderFrame = (frame: number) => {
    figure.group.rotation.y = track(YAW, frame)
    figure.material.uniforms.rimStrength.value = track(RIM, frame)
    back.material.uniforms.intensity.value = track(HALO, frame)
    ring.glowMaterial.uniforms.intensity.value = track(HALO, frame)
    ring.group.rotation.z = frame * 0.002

    const dist = track(CAM_DIST, frame)
    camera.position.set(track(CAM_X, frame), track(CAM_Y, frame), dist)
    camera.lookAt(track(CAM_X, frame) * 0.35, track(TARGET_Y, frame), 0)

    prims.forEach((prim, index) => {
      prim.rotation.x = frame * 0.004 * (index + 1)
      prim.rotation.y = frame * 0.006 * (index % 2 ? -1 : 1)
    })
    particles.update(frame)
    renderer.render(scene, camera)
    return canvas.toDataURL('image/png')
  }

  return { frames: FRAMES, width: WIDTH, height: HEIGHT, renderFrame }
}

declare global {
  interface Window {
    heroRender: ReturnType<typeof setup>
  }
}

window.heroRender = setup()
