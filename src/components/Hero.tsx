import { useCallback, useEffect, useRef, useState } from 'react'
import { PROFILE } from '../data/profile'
import './Hero.css'

type SpriteSheet = {
  file: string
  startFrame: number
  frameCount: number
  width: number
  height: number
}

type SpriteMetadata = {
  frameCount: number
  holdFrame: number
  fps: number
  duration: number
  frameWidth: number
  frameHeight: number
  framesPerSheet: number
  sheets: SpriteSheet[]
}

type Zone = 'left' | 'center' | 'right' | 'away'
type Reaction = 'working' | 'left' | 'right' | 'center'

const FRAMES = {
  idle: 0,
  /**
   * He types at the laptop through frame 44, but the loop stops at 18 on purpose:
   * sheets hold 20 frames, so staying inside sheet 0 means the idle animation
   * never swaps its 16000px background image. Crossing that boundary twice a
   * cycle is what made the hero blink. No frame here returns to frame 0
   * either, so the loop ping-pongs rather than wrapping.
   */
  idleLoopEnd: 18,
  centerStart: 144,
  waveStart: 196,
  /** He points down at the laptop from here; the hold frame (224) sits inside it. */
  pointStart: 216,
} as const

/**
 * Each reaction is a forward-only stretch of the video: it starts on a frame
 * where he still faces the laptop and plays to its pose, then holds. Playback
 * never runs backwards, so switching from the wave to a side glance cuts
 * (with a short dissolve) to that glance's start instead of rewinding through
 * everything in between. `to: null` means the metadata hold frame.
 */
const SEGMENTS: Record<Exclude<Reaction, 'working'>, { from: number; to: number | null }> = {
  left: { from: 44, to: 62 },
  right: { from: 92, to: 110 },
  center: { from: FRAMES.centerStart, to: null },
}

const METADATA_URL = '/hero-frames/metadata.json'
/** Reactions play a touch faster than the source so they answer the cursor promptly. */
const PLAY_SPEED = 1.35
const ZONE_HYSTERESIS = 0.04
/** Matches the .hero__ghost opacity transition in Hero.css. */
const DISSOLVE_MS = 260
/**
 * The bottom of the frame is bare desk: the laptop ends well above it.
 * Cropping 5% top-anchored keeps a sliver of desk under the laptop.
 */
const BOTTOM_CROP = 0.05
/** Depth parallax on the sprite. Horizontal only — vertical has no slack. */
const PARALLAX_X = 18

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

function resolveZone(x: number, previous: Zone): Exclude<Zone, 'away'> {
  const low = 1 / 3
  const high = 2 / 3
  const h = ZONE_HYSTERESIS

  if (previous === 'left') return x > low + h ? (x > high + h ? 'right' : 'center') : 'left'
  if (previous === 'right') return x < high - h ? (x < low - h ? 'left' : 'center') : 'right'
  if (x < low - h) return 'left'
  if (x > high + h) return 'right'
  return 'center'
}

function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLButtonElement>(null)
  const spriteRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<SpriteMetadata | null>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)

  const currentFrameRef = useRef(0)
  const targetFrameRef = useRef(0)
  const drawnFrameRef = useRef(-1)
  const animationFrameRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const beatRef = useRef('')
  const reactionRef = useRef<Reaction>('working')
  const zoneRef = useRef<Zone>('away')
  const ghostTimerRef = useRef<number | null>(null)
  /** Keeps him typing at the laptop whenever nothing else is happening. */
  const idleLoopRef = useRef(false)
  const idleDirRef = useRef(1)

  const activeSheetRef = useRef(-1)
  const scaleRef = useRef(1)
  const offsetXRef = useRef(0)
  const heroBoxRef = useRef({ left: 0, width: 1 })
  const readyRef = useRef(false)
  const reducedMotionRef = useRef(false)
  const decodedSheetsRef = useRef<HTMLImageElement[]>([])

  const [state, setState] = useState<'loading' | 'ready'>('loading')

  const drawFrame = useCallback((frame: number) => {
    const meta = metaRef.current
    const sprite = spriteRef.current
    if (!meta || !sprite) return

    const clamped = Math.min(Math.max(frame, 0), meta.frameCount - 1)
    const sheetIndex = Math.min(
      Math.floor(clamped / meta.framesPerSheet),
      meta.sheets.length - 1,
    )
    const sheet = meta.sheets[sheetIndex]
    const scale = scaleRef.current

    if (sheetIndex !== activeSheetRef.current) {
      activeSheetRef.current = sheetIndex
      sprite.style.backgroundImage = `url("${sheet.file}")`
      sprite.style.backgroundSize = `${sheet.width * scale}px ${sheet.height * scale}px`
    }

    const localFrame = clamped - sheet.startFrame
    sprite.style.backgroundPositionX = `${offsetXRef.current - localFrame * meta.frameWidth * scale}px`
    drawnFrameRef.current = clamped
  }, [])

  /**
   * Hard cut to another frame, softened by a dissolve: the ghost layer takes a
   * snapshot of what is on screen and fades out over the new frame.
   */
  const cutTo = useCallback(
    (frame: number) => {
      const sprite = spriteRef.current
      const ghost = ghostRef.current
      if (sprite && ghost && drawnFrameRef.current >= 0 && !reducedMotionRef.current) {
        ghost.style.transition = 'none'
        ghost.style.backgroundImage = sprite.style.backgroundImage
        ghost.style.backgroundSize = sprite.style.backgroundSize
        ghost.style.backgroundPosition = `${sprite.style.backgroundPositionX} 0px`
        ghost.style.transform = sprite.style.transform
        ghost.style.opacity = '1'
        // Commit the snapshot before starting the fade.
        void ghost.offsetWidth
        ghost.style.transition = ''
        ghost.style.opacity = '0'
        if (ghostTimerRef.current !== null) window.clearTimeout(ghostTimerRef.current)
        ghostTimerRef.current = window.setTimeout(() => {
          ghost.style.backgroundImage = 'none'
          ghostTimerRef.current = null
        }, DISSOLVE_MS + 40)
      }
      currentFrameRef.current = frame
      drawFrame(frame)
    },
    [drawFrame],
  )

  const setBeat = useCallback((beat: string) => {
    if (beat === beatRef.current) return
    beatRef.current = beat
    if (heroRef.current) heroRef.current.dataset.beat = beat
  }, [])

  const setReaction = useCallback(
    (reaction: Reaction) => {
      reactionRef.current = reaction
      if (heroRef.current) {
        heroRef.current.dataset.zone = reaction === 'working' ? 'away' : reaction
      }
      if (reaction !== 'center') setBeat('')
    },
    [setBeat],
  )

  const layout = useCallback(() => {
    const meta = metaRef.current
    const stage = stageRef.current
    const sprite = spriteRef.current
    const hero = heroRef.current
    if (!meta || !stage || !sprite || !hero) return

    const { width, height } = stage.getBoundingClientRect()
    if (!width || !height) return

    // Scaling against the usable height (minus the table edge) and anchoring to
    // the top means the overflow is spent entirely on the strip below the desk.
    const usableHeight = meta.frameHeight * (1 - BOTTOM_CROP)
    const scale = Math.max(width / meta.frameWidth, height / usableHeight)
    scaleRef.current = scale
    offsetXRef.current = (width - meta.frameWidth * scale) / 2
    sprite.style.backgroundPositionY = '0px'

    const heroBox = hero.getBoundingClientRect()
    heroBoxRef.current = { left: heroBox.left, width: heroBox.width }

    activeSheetRef.current = -1
    drawFrame(drawnFrameRef.current < 0 ? 0 : drawnFrameRef.current)
  }, [drawFrame])

  const tick = useCallback(
    function step(now: number) {
      const meta = metaRef.current
      if (!meta) return

      const dt = Math.min((now - lastTickRef.current) / 1000, 0.05)
      lastTickRef.current = now

      // Idle: he keeps typing. Ping-pong at source speed so the seam is
      // always a direction change rather than a jump back to frame 0.
      if (idleLoopRef.current) {
        let frameNow = currentFrameRef.current + idleDirRef.current * meta.fps * dt
        if (frameNow >= FRAMES.idleLoopEnd) {
          frameNow = FRAMES.idleLoopEnd
          idleDirRef.current = -1
        } else if (frameNow <= FRAMES.idle) {
          frameNow = FRAMES.idle
          idleDirRef.current = 1
        }
        currentFrameRef.current = frameNow

        const idleFrame = Math.round(frameNow)
        if (idleFrame !== drawnFrameRef.current) drawFrame(idleFrame)

        animationFrameRef.current = requestAnimationFrame(step)
        return
      }

      // Reactions only ever play forward toward their pose.
      const target = targetFrameRef.current
      const current = Math.min(target, currentFrameRef.current + meta.fps * PLAY_SPEED * dt)
      currentFrameRef.current = current

      const frame = Math.round(current)
      if (frame !== drawnFrameRef.current) drawFrame(frame)

      if (reactionRef.current === 'center') {
        if (frame >= FRAMES.pointStart) setBeat('point')
        else if (frame >= FRAMES.waveStart) setBeat('wave')
        else if (frame >= FRAMES.centerStart + 6) setBeat('notice')
      }

      if (current < target) {
        animationFrameRef.current = requestAnimationFrame(step)
        return
      }

      // Pose reached: hold it for as long as the cursor stays in that zone.
      animationFrameRef.current = null
    },
    [drawFrame, setBeat],
  )

  const ensureLoop = useCallback(() => {
    if (animationFrameRef.current !== null) return
    lastTickRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(tick)
  }, [tick])

  /** Plays a reaction's stretch of the video, cutting in if he is elsewhere. */
  const react = useCallback(
    (reaction: Reaction) => {
      const meta = metaRef.current
      if (!meta || !readyRef.current || reducedMotionRef.current) return
      if (reaction === reactionRef.current) return

      setReaction(reaction)

      if (reaction === 'working') {
        idleLoopRef.current = true
        idleDirRef.current = 1
        cutTo(FRAMES.idle)
        ensureLoop()
        return
      }

      idleLoopRef.current = false
      const segment = SEGMENTS[reaction]
      const to = segment.to ?? meta.holdFrame
      targetFrameRef.current = to
      // Already partway through this stretch: just keep playing. Anywhere else
      // (including past its pose): cut to the start instead of rewinding.
      const current = currentFrameRef.current
      if (current < segment.from || current > to) cutTo(segment.from)
      ensureLoop()
    },
    [cutTo, ensureLoop, setReaction],
  )

  const playGreeting = useCallback(() => react('center'), [react])

  useEffect(() => {
    let cancelled = false
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    reducedMotionRef.current = prefersReducedMotion

    const preload = async (file: string) => {
      const image = new Image()
      image.src = file
      await image.decode()
      decodedSheetsRef.current.push(image)
    }

    const load = async () => {
      const response = await fetch(METADATA_URL)
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      const meta: SpriteMetadata = await response.json()

      let startFrame: number = FRAMES.idle
      if (prefersReducedMotion) startFrame = meta.holdFrame
      else if (isTouch) startFrame = FRAMES.centerStart
      const firstSheet = Math.floor(startFrame / meta.framesPerSheet)

      await preload(meta.sheets[firstSheet].file)
      if (cancelled) return

      metaRef.current = meta
      currentFrameRef.current = startFrame
      targetFrameRef.current = startFrame
      stageRef.current?.style.setProperty('--frame-aspect', `${meta.frameWidth} / ${meta.frameHeight}`)
      stageRef.current?.style.setProperty('--frame-ratio', `${meta.frameWidth / meta.frameHeight}`)
      layout()
      drawFrame(startFrame)
      setState('ready')

      if (prefersReducedMotion) return

      const rest = meta.sheets.filter(
        (sheet, index) => index !== firstSheet && sheet.startFrame <= meta.holdFrame,
      )
      await Promise.all(rest.map((sheet) => preload(sheet.file)))
      if (cancelled) return

      readyRef.current = true
      if (isTouch) {
        playGreeting()
      } else {
        idleLoopRef.current = true
        idleDirRef.current = 1
        ensureLoop()
      }
    }

    load().catch((error) => {
      console.error('[Hero] sprite sheet unavailable', error)
    })

    return () => {
      cancelled = true
    }
  }, [drawFrame, ensureLoop, layout, playGreeting])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const observer = new ResizeObserver(layout)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [layout])

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (ghostTimerRef.current !== null) window.clearTimeout(ghostTimerRef.current)
    },
    [],
  )

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
    }
    if (spotlightRef.current) {
      spotlightRef.current.style.setProperty('--cursor-x', `${event.clientX}px`)
      spotlightRef.current.style.setProperty('--cursor-y', `${event.clientY}px`)
    }

    if (event.pointerType !== 'mouse' || !readyRef.current || reducedMotionRef.current) return

    // Measured live: the hero scrolls, so a cached box goes stale.
    const box = heroRef.current?.getBoundingClientRect() ?? heroBoxRef.current
    const x = clamp01((event.clientX - box.left) / box.width)

    // Counter-parallax: he drifts against the cursor, which reads as depth.
    // Only the sprite is transformed — layout() measures the stage, so moving
    // the stage instead would feed it a shifted box.
    if (spriteRef.current) {
      spriteRef.current.style.transform = `translate3d(${(0.5 - x) * PARALLAX_X}px, 0, 0)`
    }

    const zone = resolveZone(x, zoneRef.current)
    if (zone === zoneRef.current) return
    zoneRef.current = zone
    react(zone)
  }

  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || !readyRef.current) return
    if (spriteRef.current) spriteRef.current.style.transform = 'translate3d(0, 0, 0)'
    zoneRef.current = 'away'
    react('working')
  }

  const handleStageKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    playGreeting()
  }

  return (
    <section
      className="hero"
      ref={heroRef}
      data-state={state}
      data-zone="away"
      data-beat=""
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="hero__cursor" ref={cursorRef} aria-hidden="true" />
      <div className="hero__spotlight" ref={spotlightRef} aria-hidden="true" />
      <div className="hero__backdrop" aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />

      {/* Floating Cinematic Atmospheric Particles */}
      <div className="hero__particles" aria-hidden="true">
        <span style={{ '--i': 1 } as React.CSSProperties} />
        <span style={{ '--i': 2 } as React.CSSProperties} />
        <span style={{ '--i': 3 } as React.CSSProperties} />
        <span style={{ '--i': 4 } as React.CSSProperties} />
        <span style={{ '--i': 5 } as React.CSSProperties} />
      </div>

      <div className="hero__note hero__note--left">
        <div className="hero__signature-box">
          <h1 className="hero__title">{PROFILE.firstName}<br /><span>{PROFILE.lastName}</span></h1>
          <p className="hero__subtitle">{PROFILE.tagline}</p>
        </div>
        <div className="hero__slot">
          <div className="hero__bubble" data-when="away">
            <svg className="hero__pointer" viewBox="0 0 12 16" aria-hidden="true">
              <path d="M1 1 L1 13.2 L4.3 10.1 L6.5 15 L8.7 14 L6.5 9.2 L10.8 9.2 Z" />
            </svg>
            <span>Move your cursor to catch my eye</span>
          </div>
          <div className="hero__bubble" data-when="left">
            <span>Anyone over on the left?</span>
          </div>
          <div className="hero__bubble" data-when="notice">
            <span>Hey, caught you!</span>
          </div>
          <div className="hero__bubble" data-when="wave">
            <span>Hello, welcome in!</span>
          </div>
        </div>
      </div>

      <div className="hero__note hero__note--right">
        <div className="hero__slot">
          <div className="hero__bubble" data-when="right">
            <span>Someone exploring the right?</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="hero__stage"
        ref={stageRef}
        onKeyDown={handleStageKeyDown}
        onClick={playGreeting}
        aria-label={`${PROFILE.name} at his laptop. Move the cursor across the hero to catch his attention.`}
      >
        <div className="hero__sprite" ref={spriteRef} />
        <div className="hero__sprite hero__ghost" ref={ghostRef} aria-hidden="true" />
      </button>

      <a className="hero__scroll" href="#intro">
        <span className="hero__scroll-text">Explore the work</span>
      </a>
    </section>
  )
}

export default Hero
