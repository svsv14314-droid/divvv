import { useEffect, useRef, useState } from 'react'
import type * as T from 'three'
import type { Pose, Shading } from '../three/figure'
import { PROFILE } from '../data/profile'
import './Viewport3D.css'

type Props = {
  shading: Shading
  /** Which photo the figure is built from. */
  pose?: Pose
  /** Pipeline stage shown in the toolbar, e.g. "Look-dev". */
  stage: string
  /** Shading mode label, e.g. "Final render". */
  mode: string
  className?: string
}

type Status = 'idle' | 'loading' | 'ready' | 'fallback'

/** Max turn either way, from hover or the idle turntable. */
const MAX_YAW = 0.5
const MAX_PITCH = 0.08

/**
 * A modelling-app viewport holding Divyansh's relief figure in one shading
 * pass. Three.js is fetched only when the viewport nears the screen, renders
 * only while it is on screen, and falls back to the photo without WebGL.
 */
const Viewport3D = ({ shading, pose = 'walking', stage, mode, className = '' }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [tris, setTris] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return

    let disposed = false
    let teardown: (() => void) | null = null

    const start = async () => {
      setStatus('loading')
      try {
        const [THREE, { createCounter, createFigure, loadFigureAssets, POSES }] = await Promise.all([
          import('three'),
          import('../three/figure'),
        ])
        const assets = await loadFigureAssets(pose)
        if (disposed) return

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
        // 1.5× is visually indistinguishable here and renders ~45% fewer pixels than 2×.
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50)

        const palette = {
          render: { rim: '#ff9d9d', grid: 0x7a2c3b, fog: 0x160b0e },
          clay: { rim: '#ffd9c7', grid: 0x5a4640, fog: 0x1b1615 },
          wireframe: { rim: '#ff7d93', grid: 0x5e2633, fog: 0x0f0a0c },
        }[shading]

        scene.fog = new THREE.Fog(palette.fog, 5, 11)
        const grid = new THREE.GridHelper(16, 32, palette.grid, palette.grid)
        ;(grid.material as T.Material).transparent = true
        ;(grid.material as T.Material).opacity = 0.55
        scene.add(grid)

        const figure = createFigure(assets, {
          shading,
          height: 2,
          relief: 0.13,
          rimColor: palette.rim,
          clayColor: '#c9aa98',
          wireColor: '#ff8a9c',
        })
        scene.add(figure.group)
        // The counter turns with him, like a turntable carrying the whole set.
        const counter = createCounter(pose, shading)
        if (counter) figure.group.add(counter.group)
        const { frame: shot } = POSES[pose]

        const index = (figure.group.children[0] as T.Mesh).geometry.index
        setTris(index ? index.count / 3 : 0)

        // Contact shadow.
        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(0.5, 40),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false }),
        )
        shadow.rotation.x = -Math.PI / 2
        shadow.scale.set(1, 0.45, 1)
        shadow.position.y = 0.004
        scene.add(shadow)

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const pointer = { x: 0, y: 0, inside: false }
        const drag = { active: false, startX: 0, startYaw: 0, offset: 0 }
        let yaw = 0
        let pitch = 0
        let visible = false
        let frame: number | null = null
        let last = performance.now()
        let clock = 0

        const resize = () => {
          const { width, height } = canvas.getBoundingClientRect()
          if (!width || !height) return
          renderer.setSize(width, height, false)
          camera.aspect = width / height
          // Keep the full figure in frame on tall and wide viewports alike.
          const fitHeight = 2.35
          const vFov = (camera.fov * Math.PI) / 180
          const distHeight = fitHeight / (2 * Math.tan(vFov / 2))
          const distWidth = (shot.width * 1.15) / (2 * Math.tan(vFov / 2) * camera.aspect)
          camera.position.set(shot.centerX, 1.25, Math.max(distHeight, distWidth))
          camera.lookAt(shot.centerX, 1.02, 0)
          camera.updateProjectionMatrix()
          if (!frame) renderer.render(scene, camera)
        }

        const tick = (now: number) => {
          frame = null
          const dt = Math.min((now - last) / 1000, 0.05)
          last = now
          clock += dt

          let targetYaw: number
          if (drag.active) targetYaw = drag.offset
          else if (pointer.inside) targetYaw = pointer.x * MAX_YAW + drag.offset
          else targetYaw = (reduced ? 0 : Math.sin(clock * 0.45) * MAX_YAW * 0.7) + drag.offset
          const targetPitch = pointer.inside ? pointer.y * MAX_PITCH : 0

          const ease = 1 - Math.pow(0.001, dt)
          yaw += (targetYaw - yaw) * ease
          pitch += (targetPitch - pitch) * ease
          figure.group.rotation.y = yaw
          figure.group.rotation.x = pitch
          renderer.render(scene, camera)

          if (visible) frame = requestAnimationFrame(tick)
        }

        const play = () => {
          if (frame === null && visible) {
            last = performance.now()
            frame = requestAnimationFrame(tick)
          }
        }

        const onMove = (event: PointerEvent) => {
          const rect = canvas.getBoundingClientRect()
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
          pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1
          if (drag.active) {
            drag.offset = drag.startYaw + ((event.clientX - drag.startX) / rect.width) * Math.PI * 0.9
            drag.offset = Math.max(-0.9, Math.min(0.9, drag.offset))
          }
        }
        const onEnter = (event: PointerEvent) => {
          if (event.pointerType === 'mouse') pointer.inside = true
        }
        const onLeave = () => {
          pointer.inside = false
          pointer.x = 0
          pointer.y = 0
        }
        const onDown = (event: PointerEvent) => {
          drag.active = true
          drag.startX = event.clientX
          drag.startYaw = yaw
          canvas.setPointerCapture(event.pointerId)
          root.dataset.dragging = 'true'
        }
        const onUp = (event: PointerEvent) => {
          if (!drag.active) return
          drag.active = false
          // Hover adds its own turn on top, so keep only what the drag added.
          drag.offset -= pointer.inside ? pointer.x * MAX_YAW : 0
          if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
          delete root.dataset.dragging
        }
        const onDoubleClick = () => {
          drag.offset = 0
        }

        canvas.addEventListener('pointermove', onMove)
        canvas.addEventListener('pointerenter', onEnter)
        canvas.addEventListener('pointerleave', onLeave)
        canvas.addEventListener('pointerdown', onDown)
        canvas.addEventListener('pointerup', onUp)
        canvas.addEventListener('pointercancel', onUp)
        canvas.addEventListener('dblclick', onDoubleClick)

        const visibility = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting
          if (visible) play()
        })
        visibility.observe(canvas)
        const sizer = new ResizeObserver(resize)
        sizer.observe(canvas)
        resize()
        setStatus('ready')

        teardown = () => {
          visibility.disconnect()
          sizer.disconnect()
          if (frame !== null) cancelAnimationFrame(frame)
          canvas.removeEventListener('pointermove', onMove)
          canvas.removeEventListener('pointerenter', onEnter)
          canvas.removeEventListener('pointerleave', onLeave)
          canvas.removeEventListener('pointerdown', onDown)
          canvas.removeEventListener('pointerup', onUp)
          canvas.removeEventListener('pointercancel', onUp)
          canvas.removeEventListener('dblclick', onDoubleClick)
          figure.dispose()
          counter?.dispose()
          grid.geometry.dispose()
          ;(grid.material as T.Material).dispose()
          shadow.geometry.dispose()
          shadow.material.dispose()
          renderer.dispose()
          // Free the GL context now; browsers cap live contexts at ~16.
          renderer.forceContextLoss()
        }
      } catch (error) {
        console.error('[Viewport3D] falling back to the photo', error)
        if (!disposed) setStatus('fallback')
      }
    }

    // Start a little before the viewport scrolls in, in idle time, so building
    // the mesh never lands in the middle of a scroll frame.
    let idle: number | null = null
    const nearby = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        nearby.disconnect()
        idle =
          'requestIdleCallback' in window
            ? window.requestIdleCallback(() => start(), { timeout: 600 })
            : globalThis.setTimeout(start, 50)
      },
      { rootMargin: '600px 0px' },
    )
    nearby.observe(root)

    return () => {
      disposed = true
      nearby.disconnect()
      if (idle !== null) {
        if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle)
        else globalThis.clearTimeout(idle)
      }
      teardown?.()
    }
  }, [shading, pose])

  return (
    <div className={`viewport viewport--${shading} ${className}`} ref={rootRef} data-status={status}>
      <div className="viewport__bar" aria-hidden="true">
        <span className="viewport__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="viewport__stage">{stage}</span>
        <span className="viewport__mode">
          persp · <b>{mode}</b>
        </span>
      </div>

      <div className="viewport__screen">
        <canvas
          ref={canvasRef}
          className="viewport__canvas"
          role="img"
          aria-label={`3D ${mode.toLowerCase()} model of ${PROFILE.name}. Drag to orbit.`}
        />
        {status === 'fallback' && (
          <img className="viewport__fallback" src="/figure/figure.webp" alt={`${PROFILE.name}`} />
        )}
        {status !== 'ready' && status !== 'fallback' && <span className="viewport__loading">Loading scene…</span>}

        <svg className="viewport__gizmo" viewBox="0 0 44 44" aria-hidden="true">
          <path d="M14 30 L36 30" className="viewport__axis viewport__axis--x" />
          <path d="M14 30 L14 8" className="viewport__axis viewport__axis--y" />
          <path d="M14 30 L5 38" className="viewport__axis viewport__axis--z" />
          <text x="38" y="33">X</text>
          <text x="11" y="6">Y</text>
        </svg>
        <span className="viewport__stats" aria-hidden="true">
          {tris ? `${tris.toLocaleString('en-US')} tris` : ''}
        </span>
        <span className="viewport__hint" aria-hidden="true">
          Drag to orbit · double-click to reset
        </span>
      </div>
    </div>
  )
}

export default Viewport3D
