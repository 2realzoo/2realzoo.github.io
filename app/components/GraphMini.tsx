'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Node {
  id: string
  title: string
  tags: string[]
  links: string[]
  x: number
  y: number
  vx: number
  vy: number
}

interface Props {
  currentSlug?: string
  /** Pass posts directly (server-rendered pages can provide this) */
  posts?: { slug: string; title: string; tags: string[]; summary: string }[]
  height?: number
}

const COLORS = ['#2a1aff', '#0a8a3a', '#d8731d', '#8b1da0', '#1d6dcc']

export default function GraphMini({ currentSlug, posts: propPosts, height = 160 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const rafRef = useRef<number | null>(null)
  const nodesRef = useRef<Node[]>([])
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const W = 240, H = height

  useEffect(() => {
    async function init(rawPosts: { slug: string; title: string; tags: string[] }[]) {
      // Simple tag-based linking: posts that share tags are linked
      const nodes: Node[] = rawPosts.map((p, i) => {
        const angle = (i / rawPosts.length) * Math.PI * 2
        const r = Math.min(W, H) * 0.3
        return {
          id: p.slug,
          title: p.title,
          tags: p.tags,
          links: rawPosts
            .filter(q => q.slug !== p.slug && q.tags.some(t => p.tags.includes(t)))
            .map(q => q.slug),
          x: W / 2 + r * Math.cos(angle),
          y: H / 2 + r * Math.sin(angle),
          vx: 0,
          vy: 0,
        }
      })
      nodesRef.current = nodes
      setReady(true)
      simulate()
    }

    if (propPosts) {
      init(propPosts)
    } else {
      fetch('/posts.json')
        .then(r => r.json())
        .then(init)
        .catch(() => setReady(true))
    }

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function simulate() {
    let alpha = 1

    function tick() {
      const nodes = nodesRef.current
      if (!nodes.length) return

      alpha *= 0.96
      const cx = W / 2, cy = H / 2

      for (const n of nodes) {
        // Center gravity
        n.vx += (cx - n.x) * 0.01
        n.vy += (cy - n.y) * 0.01

        // Repulsion
        for (const m of nodes) {
          if (m === n) continue
          const dx = n.x - m.x, dy = n.y - m.y
          const d2 = dx * dx + dy * dy + 1
          const f = 80 / d2
          n.vx += dx * f
          n.vy += dy * f
        }

        // Link attraction
        for (const lid of n.links) {
          const m = nodes.find(x => x.id === lid)
          if (!m) continue
          const dx = m.x - n.x, dy = m.y - n.y
          n.vx += dx * 0.04
          n.vy += dy * 0.04
        }

        n.vx *= 0.7
        n.vy *= 0.7
        n.x = Math.max(12, Math.min(W - 12, n.x + n.vx * alpha))
        n.y = Math.max(12, Math.min(H - 12, n.y + n.vy * alpha))
      }

      render()
      if (alpha > 0.02) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  function render() {
    const svg = svgRef.current
    if (!svg) return
    const nodes = nodesRef.current

    // Clear
    while (svg.firstChild) svg.removeChild(svg.firstChild)

    const ns = 'http://www.w3.org/2000/svg'

    // Edges
    for (const n of nodes) {
      for (const lid of n.links) {
        const m = nodes.find(x => x.id === lid)
        if (!m || m.id < n.id) continue // draw once
        const line = document.createElementNS(ns, 'line')
        line.setAttribute('x1', String(n.x))
        line.setAttribute('y1', String(n.y))
        line.setAttribute('x2', String(m.x))
        line.setAttribute('y2', String(m.y))
        const isCurrent = n.id === currentSlug || m.id === currentSlug
        line.setAttribute('stroke', isCurrent ? 'var(--accent)' : 'var(--line)')
        line.setAttribute('stroke-width', isCurrent ? '1.5' : '1')
        line.setAttribute('opacity', isCurrent ? '0.7' : '0.3')
        svg.appendChild(line)
      }
    }

    // Nodes
    nodes.forEach((n, i) => {
      const isCurrent = n.id === currentSlug
      const color = COLORS[i % COLORS.length]

      const g = document.createElementNS(ns, 'g')
      g.setAttribute('style', 'cursor:pointer')
      g.addEventListener('click', () => router.push(`/post/${n.id}`))

      if (isCurrent) {
        // Halo
        const halo = document.createElementNS(ns, 'circle')
        halo.setAttribute('cx', String(n.x))
        halo.setAttribute('cy', String(n.y))
        halo.setAttribute('r', '9')
        halo.setAttribute('fill', 'none')
        halo.setAttribute('stroke', 'var(--accent)')
        halo.setAttribute('stroke-width', '1.5')
        halo.setAttribute('stroke-dasharray', '3 2')
        g.appendChild(halo)
      }

      const circle = document.createElementNS(ns, 'circle')
      circle.setAttribute('cx', String(n.x))
      circle.setAttribute('cy', String(n.y))
      circle.setAttribute('r', isCurrent ? '6' : '4')
      circle.setAttribute('fill', isCurrent ? 'var(--accent)' : color)
      circle.setAttribute('opacity', isCurrent ? '1' : '0.8')
      g.appendChild(circle)

      // Label (only for current node)
      if (isCurrent) {
        const text = document.createElementNS(ns, 'text')
        text.setAttribute('x', String(n.x))
        text.setAttribute('y', String(n.y - 12))
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('fill', 'var(--ink)')
        text.setAttribute('font-size', '9')
        text.setAttribute('font-family', 'var(--mono)')
        text.textContent = n.title.slice(0, 12) + (n.title.length > 12 ? '…' : '')
        g.appendChild(text)
      }

      svg.appendChild(g)
    })
  }

  return (
    <div style={{ position: 'relative', height, border: '1.5px solid var(--line)', background: 'var(--bg)' }}>
      <svg
        ref={svgRef}
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      />
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-mute)',
        }}>
          loading...
        </div>
      )}
    </div>
  )
}
