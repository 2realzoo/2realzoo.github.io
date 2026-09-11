'use client'

import { useEffect, useRef } from 'react'
import type * as ThreeNS from 'three'

const SKIN = '#ffffff'   // head sides — matches the avatar's white background
const SHIRT = '#2a1aff'  // --accent
const PANTS = '#16110d'  // --ink
const ALU = '#c9c9ce'    // macbook aluminium
const SCREEN = '#0f1115'
const KEYS = '#8a8a93'
const LAPTOP_SCALE = 26  // Kenney's laptop is ~0.26 units wide; the torso is 8

// Minecraft skins are 64x64; multiples of that are HD skins. At 8x the face
// gets 64x64 real pixels instead of 8x8, so the avatar stays recognisable.
const PX = 8

/**
 * Paint a Minecraft skin texture: flat colours for the body, the GitHub
 * avatar on the front of the head. Regions follow the standard 64x64 layout.
 */
function buildSkin(avatar: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64 * PX
  const g = canvas.getContext('2d')
  if (!g) return null

  // A body part occupies six face rects in the atlas, laid out around its
  // origin as top | bottom on the first row, then right | front | left | back.
  // Faces in atlas order: top, bottom, right, front, left, back. The shade
  // per face fakes the ambient occlusion a flat colour fill has none of.
  const SHADE = [0, 0.3, 0.16, 0, 0.16, 0.08]

  const part = (
    ox: number, oy: number, w: number, h: number, d: number, color: string,
  ) => {
    const faces: [number, number, number, number][] = [
      [ox + d, oy, w, d],
      [ox + d + w, oy, w, d],
      [ox, oy + d, d, h],
      [ox + d, oy + d, w, h],
      [ox + d + w, oy + d, d, h],
      [ox + d + w + d, oy + d, w, h],
    ]
    faces.forEach(([x, y, fw, fh], i) => {
      g.fillStyle = color
      g.fillRect(x * PX, y * PX, fw * PX, fh * PX)
      if (SHADE[i]) {
        g.fillStyle = `rgba(0,0,0,${SHADE[i]})`
        g.fillRect(x * PX, y * PX, fw * PX, fh * PX)
      }
    })
  }

  part(0, 0, 8, 8, 8, SKIN)      // head
  part(16, 16, 8, 12, 4, SHIRT)  // torso
  part(40, 16, 4, 12, 4, SHIRT)  // right arm
  part(32, 48, 4, 12, 4, SHIRT)  // left arm
  part(0, 16, 4, 12, 4, PANTS)   // right leg
  part(16, 48, 4, 12, 4, PANTS)  // left leg

  // Face: front of the head, inset so the edging still frames it.
  g.drawImage(avatar, 8.5 * PX, 8.5 * PX, 7 * PX, 7 * PX)

  return canvas
}

/**
 * A stylised apple drawn on a canvas and mapped onto a small plane, so the
 * lid is not a blank slab. Not Apple's trademark artwork, just an apple.
 */
function appleBadge(THREE: typeof ThreeNS) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  if (!g) return new THREE.Group()

  g.fillStyle = '#ffffff'
  const lobe = (x: number) => {
    g.beginPath()
    g.ellipse(x, 78, 33, 37, 0, 0, Math.PI * 2)
    g.fill()
  }
  lobe(50)
  lobe(78)

  g.globalCompositeOperation = 'destination-out'
  g.beginPath()            // dip between the lobes
  g.ellipse(64, 36, 16, 13, 0, 0, Math.PI * 2)
  g.fill()
  g.beginPath()            // the bite
  g.ellipse(114, 70, 19, 19, 0, 0, Math.PI * 2)
  g.fill()

  g.globalCompositeOperation = 'source-over'
  g.beginPath()            // leaf
  g.ellipse(72, 28, 13, 6, -0.7, 0, Math.PI * 2)
  g.fill()

  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.105, 0.105),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  )
  badge.name = 'apple'
  return badge
}


const SKY = '#8ab9f1'
const BLOCK = 16          // one Minecraft block, in skinview3d units
const GROUND = 320        // platform size; the player never actually leaves it
const FEET_Y = -24        // the model's feet sit here

/** 16x16 pixel-art grass/dirt tile, drawn rather than shipped as an asset. */
function blockTexture(THREE: typeof ThreeNS, kind: 'top' | 'side') {
  const c = document.createElement('canvas')
  c.width = c.height = 16
  const g = c.getContext('2d')
  if (g) {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = (Math.random() - 0.5) * 18
        const grass = kind === 'top' || y < 3 || (y === 3 && Math.random() < 0.5)
        const [r, gr, b] = grass ? [124, 189, 107] : [141, 106, 74]
        g.fillStyle = `rgb(${r + n},${gr + n},${b + n})`
        g.fillRect(x, y, 1, 1)
      }
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * A single textured slab standing in for the world. Walking scrolls the
 * texture instead of moving geometry, so the ground is endless and the
 * scene stays at one extra draw call.
 */
function buildGround(THREE: typeof ThreeNS) {
  const reps = GROUND / BLOCK
  const top = blockTexture(THREE, 'top')
  top.repeat.set(reps, reps)
  const side = blockTexture(THREE, 'side')
  side.repeat.set(reps, 0.5)

  const topMat = new THREE.MeshLambertMaterial({ map: top })
  const sideMat = new THREE.MeshLambertMaterial({ map: side })
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(GROUND, BLOCK / 2, GROUND),
    [sideMat, sideMat, topMat, sideMat, sideMat, sideMat],
  )
  mesh.position.y = FEET_Y - BLOCK / 4
  return { mesh, top, dispose: () => {
    mesh.geometry.dispose()
    topMat.dispose(); sideMat.dispose()
    top.dispose(); side.dispose()
  } }
}

/**
 * Minecraft character wearing the GitHub avatar as its face, holding a
 * MacBook. Walks on idle, waves while the cursor is over it.
 *
 * skinview3d owns the player model and the animations; three is only used
 * here for the laptop. Both load lazily so they stay out of the page bundle.
 */
export default function MinecraftAvatar({ src }: { src: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let dispose = () => {}
    let alive = true

    Promise.all([
      import('skinview3d'),
      import('three'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
    ]).then(([sv3d, THREE, { GLTFLoader }]) => {
      if (!alive) return

      const loadGLTF = (url: string) =>
        new Promise<{ scene: ThreeNS.Group }>((resolve, reject) =>
          new GLTFLoader().load(url, resolve, undefined, reject))

      const avatar = new Image()
      avatar.crossOrigin = 'anonymous'
      avatar.onload = () => {
        if (!alive) return
        const skin = buildSkin(avatar)
        if (!skin) return

        const viewer = new sv3d.SkinViewer({
          width: host.clientWidth,
          height: host.clientHeight,
          skin,
          zoom: 0.92,
        })
        host.appendChild(viewer.canvas)
        viewer.controls.enableZoom = false
        viewer.controls.enablePan = false
        viewer.background = SKY
        viewer.playerObject.rotation.y = 0.35

        const ground = buildGround(THREE)
        viewer.scene.add(ground.mesh)

        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const walk = new sv3d.WalkingAnimation()
        walk.speed = 0.55
        const wave = new sv3d.WaveAnimation('right')
        const idle = new sv3d.IdleAnimation()
        viewer.animation = still ? idle : walk

        // Laptop by Kenney, CC0 — poly.pizza/m/GnbwSUiVty
        // Parented to the left arm so it travels with the hand. The right arm
        // is the one that waves, so the two never collide.
        loadGLTF('/laptop.glb').then(gltf => {
          if (!alive) return
          const laptop = gltf.scene
          laptop.traverse(obj => {
            if (obj instanceof THREE.Mesh) {
              const mat = obj.material as ThreeNS.MeshStandardMaterial
              if (mat.name === 'metalDark') mat.color.set(ALU)       // shell
              if (mat.name === 'metal') mat.color.set(SCREEN)        // display
              if (mat.name === 'metalMedium') mat.color.set(KEYS)
            }
          })
          laptop.scale.setScalar(LAPTOP_SCALE)
          // Lid facing out, the way you see a MacBook someone is carrying:
          // silver shell and the logo, rather than the back of the screen.
          laptop.position.set(3.4, -9.6, -2)
          const badge = appleBadge(THREE)
          badge.position.set(-0.132, 0.088, 0.233)
          badge.rotation.x = -0.42
          laptop.add(badge)
          viewer.playerObject.skin.leftArm.add(laptop)
        })

        // ── Controls ────────────────────────────────────────────────────
        // Arrow keys only act while the widget is hovered or focused, so the
        // page keeps its normal scrolling everywhere else.
        const MOVE: Record<string, [number, number]> = {
          ArrowUp: [0, -1], ArrowDown: [0, 1],
          ArrowLeft: [-1, 0], ArrowRight: [1, 0],
        }
        const held = new Set<string>()
        const active = () => hoverRef.current || document.activeElement === host

        const onKeyDown = (e: KeyboardEvent) => {
          if (!active() || !(e.key in MOVE)) return
          e.preventDefault()
          held.add(e.key)
        }
        const onKeyUp = (e: KeyboardEvent) => held.delete(e.key)
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)

        const enter = () => { hoverRef.current = true }
        const leave = () => { hoverRef.current = false; held.clear() }
        host.addEventListener('pointerenter', enter)
        host.addEventListener('pointerleave', leave)
        host.addEventListener('blur', () => held.clear())

        // ── Per-frame state ─────────────────────────────────────────────
        // Only property writes here; skinview3d owns the actual render loop.
        const SPEED = 30 / BLOCK  // texture repeats per second
        let facing = 0.35
        let last = performance.now()
        let raf = 0
        let mode = ''

        function step(now: number) {
          raf = requestAnimationFrame(step)
          const dt = Math.min((now - last) / 1000, 0.05)
          last = now

          let dx = 0
          let dz = 0
          for (const k of held) {
            dx += MOVE[k][0]
            dz += MOVE[k][1]
          }
          const moving = dx !== 0 || dz !== 0

          if (moving) {
            const len = Math.hypot(dx, dz)
            // The top face's UV v axis runs along world -Z, so walking
            // toward -Z (ArrowUp) means scrolling the texture the other way.
            ground.top.offset.x += (dx / len) * SPEED * dt
            ground.top.offset.y -= (dz / len) * SPEED * dt
            facing = Math.atan2(dx, dz)
          }

          // Ease the turn so direction changes are not a snap.
          const turn = Math.atan2(
            Math.sin(facing - viewer.playerObject.rotation.y),
            Math.cos(facing - viewer.playerObject.rotation.y),
          )
          viewer.playerObject.rotation.y += turn * Math.min(1, dt * 10)

          const next = moving ? 'walk' : hoverRef.current ? 'wave' : 'idle'
          if (next !== mode) {
            mode = next
            viewer.animation = next === 'walk' ? walk
              : next === 'wave' ? wave
              : still ? null : idle  // reduced motion: stand still until asked
          }
        }
        raf = requestAnimationFrame(step)

        // Stop rendering entirely when the widget is off screen.
        const io = new IntersectionObserver(([entry]) => {
          viewer.renderPaused = !entry.isIntersecting
          if (entry.isIntersecting) {
            last = performance.now()
            if (!raf) raf = requestAnimationFrame(step)
          } else if (raf) {
            cancelAnimationFrame(raf)
            raf = 0
          }
        })
        io.observe(host)

        const onResize = () => viewer.setSize(host.clientWidth, host.clientHeight)
        window.addEventListener('resize', onResize)

        dispose = () => {
          if (raf) cancelAnimationFrame(raf)
          io.disconnect()
          window.removeEventListener('resize', onResize)
          window.removeEventListener('keydown', onKeyDown)
          window.removeEventListener('keyup', onKeyUp)
          host.removeEventListener('pointerenter', enter)
          host.removeEventListener('pointerleave', leave)
          ground.dispose()
          viewer.dispose()
          viewer.canvas.remove()
        }
      }
      avatar.src = src
    })

    return () => { alive = false; dispose() }
  }, [src])

  return (
    <div
      ref={hostRef}
      className="mc-avatar"
      tabIndex={0}
      role="img"
      aria-label="2realzoo 캐릭터. 방향키로 이동, 마우스를 올리면 인사합니다."
    />
  )
}
