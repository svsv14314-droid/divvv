import { useEffect, useRef, useState } from 'react'
import './ParallaxPhoto.css'

type Props = {
  src: string
  depth: string
  alt: string
  caption?: string
  className?: string
}

/** UV shift at full tilt; near pixels move this much more than far ones. */
const STRENGTH = 0.022
/** Overscan so shifted edges never reveal the border. */
const ZOOM = 1.06

const vertexSource = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    vUv.y = 1.0 - vUv.y;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fragmentSource = `
  precision mediump float;
  uniform sampler2D image;
  uniform sampler2D depth;
  uniform vec2 tilt;
  uniform vec2 cover;
  varying vec2 vUv;
  void main() {
    vec2 uv = (vUv - 0.5) * cover / ${ZOOM.toFixed(2)} + 0.5;
    float d = texture2D(depth, uv).r;
    // Near (bright) pixels follow the pointer, far ones hold still: a "3D photo".
    vec2 shifted = uv + tilt * (d - 0.35) * ${STRENGTH.toFixed(3)};
    gl_FragColor = texture2D(image, shifted);
  }
`

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load ${src}`))
    image.src = src
  })
}

/**
 * A photo with depth: a tiny WebGL shader shifts pixels by their estimated
 * depth as the pointer moves (and drifts slowly on its own), so the scene
 * reads in 3D. Falls back to the plain photo without WebGL.
 */
const ParallaxPhoto = ({ src, depth, alt, caption, className = '' }: Props) => {
  const rootRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false })
    if (!gl) return

    let disposed = false
    let frame: number | null = null
    let visible = false
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = { x: 0, y: 0, inside: false }
    const tilt = { x: 0, y: 0 }
    let imageAspect = 2 / 3
    let tiltLocation: WebGLUniformLocation | null = null
    let coverLocation: WebGLUniformLocation | null = null
    const cleanups: (() => void)[] = []

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const texture = (image: HTMLImageElement, unit: number) => {
      const tex = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      cleanups.push(() => gl.deleteTexture(tex))
    }

    const draw = () => {
      gl.uniform2f(tiltLocation, tilt.x, tilt.y)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      if (!width || !height) return
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      // object-fit: cover in UV space.
      const boxAspect = width / height
      const cover = boxAspect > imageAspect ? [1, imageAspect / boxAspect] : [boxAspect / imageAspect, 1]
      gl.uniform2f(coverLocation, cover[0], cover[1])
      draw()
    }

    let clock = 0
    let last = performance.now()
    const tick = (now: number) => {
      frame = null
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      clock += dt
      const goalX = target.inside ? target.x : reduced ? 0 : Math.sin(clock * 0.5) * 0.6
      const goalY = target.inside ? target.y : reduced ? 0 : Math.cos(clock * 0.37) * 0.3
      const ease = 1 - Math.pow(0.002, dt)
      tilt.x += (goalX - tilt.x) * ease
      tilt.y += (goalY - tilt.y) * ease
      draw()
      if (visible) frame = requestAnimationFrame(tick)
    }

    const start = async () => {
      const [image, depthImage] = await Promise.all([loadImage(src), loadImage(depth)])
      if (disposed) return
      imageAspect = image.naturalWidth / image.naturalHeight

      const program = gl.createProgram()!
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource))
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link failed')
      gl.useProgram(program)

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
      const position = gl.getAttribLocation(program, 'position')
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

      texture(image, 0)
      texture(depthImage, 1)
      gl.uniform1i(gl.getUniformLocation(program, 'image'), 0)
      gl.uniform1i(gl.getUniformLocation(program, 'depth'), 1)
      tiltLocation = gl.getUniformLocation(program, 'tilt')
      coverLocation = gl.getUniformLocation(program, 'cover')
      cleanups.push(() => {
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
      })

      const sizer = new ResizeObserver(resize)
      sizer.observe(canvas)
      cleanups.push(() => sizer.disconnect())
      resize()
      setReady(true)

      const onMove = (event: PointerEvent) => {
        const rect = root.getBoundingClientRect()
        target.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        target.y = ((event.clientY - rect.top) / rect.height) * 2 - 1
        target.inside = event.pointerType === 'mouse'
      }
      const onLeave = () => {
        target.inside = false
      }
      root.addEventListener('pointermove', onMove)
      root.addEventListener('pointerleave', onLeave)
      cleanups.push(() => {
        root.removeEventListener('pointermove', onMove)
        root.removeEventListener('pointerleave', onLeave)
      })

      const visibility = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible && frame === null) {
          last = performance.now()
          frame = requestAnimationFrame(tick)
        }
      })
      visibility.observe(canvas)
      cleanups.push(() => visibility.disconnect())
    }

    start().catch((error) => console.error('[ParallaxPhoto] showing the flat photo', error))

    return () => {
      disposed = true
      if (frame !== null) cancelAnimationFrame(frame)
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [src, depth])

  return (
    <figure className={`parallax ${className}`} ref={rootRef} data-ready={ready}>
      <img className="parallax__fallback" src={src} alt={alt} loading="lazy" />
      <canvas className="parallax__canvas" ref={canvasRef} aria-hidden="true" />
      {caption && <figcaption className="parallax__caption">{caption}</figcaption>}
    </figure>
  )
}

export default ParallaxPhoto
