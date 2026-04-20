'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import './graph.css'

export interface GraphPost {
  id: string
  title: string
  cat: string
  tags: string[]
  links: string[]
  summary: string
  slug: string
}

export interface GraphCategory {
  label: string
  color: string
}

interface DetailState {
  post: GraphPost | null
  connected: string[]
}

interface SimPost extends GraphPost {
  x: number
  y: number
  vx: number
  vy: number
  fx?: number
  fy?: number
}

export default function GraphClient({
  posts,
  categories,
}: {
  posts: GraphPost[]
  categories: Record<string, GraphCategory>
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [detail, setDetail] = useState<DetailState>({ post: null, connected: [] })
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [showLabels, setShowLabels] = useState(true)

  // Refs for animation loop (avoids stale closures)
  const selectedIdRef = useRef<string | null>(null)
  const activeTagsRef = useRef<Set<string>>(new Set())
  const showLabelsRef = useRef(true)
  const alphaRef = useRef(1)
  const rafRef = useRef<number | null>(null)
  const updateVisualRef = useRef<(() => void) | null>(null)

  const allTags = [...new Set(posts.flatMap(p => p.tags))]
  const catEntries = Object.entries(categories)

  function toggleTag(tag: string) {
    setActiveTags(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag); else next.add(tag)
      activeTagsRef.current = next
      updateVisualRef.current?.()
      return next
    })
  }

  function toggleLabels(val: boolean) {
    setShowLabels(val)
    showLabelsRef.current = val
    updateVisualRef.current?.()
  }

  function selectPost(id: string) {
    const post = posts.find(p => p.id === id) ?? null
    selectedIdRef.current = id
    setDetail({
      post,
      connected: post?.links.filter(l => posts.some(p => p.id === l)) ?? [],
    })
    updateVisualRef.current?.()
  }

  function clearSelection() {
    selectedIdRef.current = null
    setDetail({ post: null, connected: [] })
    updateVisualRef.current?.()
  }

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || posts.length === 0) return

    const W = 1000, H = 700
    const NS = 'http://www.w3.org/2000/svg'

    // Initialize simulation state (mutable, outside React)
    const byId: Record<string, SimPost> = {}
    const cats = catEntries.map(([k]) => k)

    posts.forEach((p, i) => {
      const ci = Math.max(0, cats.indexOf(p.cat))
      const byCat = posts.filter(x => x.cat === p.cat)
      const idx = byCat.findIndex(x => x.id === p.id)
      const ang = (ci / Math.max(1, cats.length)) * Math.PI * 2 + (idx / Math.max(1, byCat.length)) * 0.9
      const r = 180 + (i % 3) * 40
      byId[p.id] = {
        ...p,
        x: W / 2 + Math.cos(ang) * r,
        y: H / 2 + Math.sin(ang) * r,
        vx: 0,
        vy: 0,
      }
    })

    const postList = Object.values(byId)

    // Build deduplicated edge list
    const edgeKeySet = new Set<string>()
    const edges: { a: string; b: string }[] = []
    postList.forEach(p =>
      p.links.forEach(l => {
        const key = [p.id, l].sort().join('→')
        if (!edgeKeySet.has(key) && byId[l]) {
          edgeKeySet.add(key)
          edges.push({ a: p.id, b: l })
        }
      })
    )

    // Static pre-relaxation (220 iters)
    for (let k = 0; k < 220; k++) {
      postList.forEach(p => { p.fx = 0; p.fy = 0 })
      for (let i = 0; i < postList.length; i++) {
        for (let j = i + 1; j < postList.length; j++) {
          const a = postList[i], b = postList[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d2 = dx * dx + dy * dy + 30
          const d = Math.sqrt(d2)
          const f = 3800 / d2
          a.fx! += (dx / d) * f; a.fy! += (dy / d) * f
          b.fx! -= (dx / d) * f; b.fy! -= (dy / d) * f
        }
      }
      edges.forEach(e => {
        const a = byId[e.a], b = byId[e.b]
        if (!a || !b) return
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy) + 1
        const f = (d - 120) * 0.02
        a.fx! += (dx / d) * f; a.fy! += (dy / d) * f
        b.fx! -= (dx / d) * f; b.fy! -= (dy / d) * f
      })
      postList.forEach(p => {
        p.fx! += (W / 2 - p.x) * 0.005
        p.fy! += (H / 2 - p.y) * 0.005
        p.x += Math.max(-8, Math.min(8, p.fx!))
        p.y += Math.max(-8, Math.min(8, p.fy!))
      })
    }

    // Build persistent SVG elements
    svg.innerHTML = ''
    const gRoot = document.createElementNS(NS, 'g')
    const edgeLayer = document.createElementNS(NS, 'g')
    const nodeLayer = document.createElementNS(NS, 'g')
    gRoot.appendChild(edgeLayer)
    gRoot.appendChild(nodeLayer)
    svg.appendChild(gRoot)

    const edgeEls = new Map<number, { el: SVGLineElement; a: string; b: string }>()
    const nodeEls = new Map<string, { g: SVGGElement; c: SVGCircleElement; t: SVGTextElement; radius: number }>()

    edges.forEach((e, i) => {
      const line = document.createElementNS(NS, 'line') as SVGLineElement
      line.setAttribute('class', 'rg-edge')
      edgeLayer.appendChild(line)
      edgeEls.set(i, { el: line, a: e.a, b: e.b })
    })

    postList.forEach(p => {
      const g = document.createElementNS(NS, 'g') as SVGGElement
      g.setAttribute('class', 'rg-node')
      const radius = 5 + Math.min(11, p.links.length * 1.8)
      const c = document.createElementNS(NS, 'circle') as SVGCircleElement
      c.setAttribute('r', String(radius))
      const color = categories[p.cat]?.color ?? 'oklch(0.55 0.05 265)'
      c.setAttribute('fill', color)
      c.setAttribute('stroke', 'rgba(17,17,20,0.2)')
      c.setAttribute('stroke-width', '0.8')
      g.appendChild(c)
      const t = document.createElementNS(NS, 'text') as SVGTextElement
      t.setAttribute('class', 'rg-node-label')
      t.setAttribute('x', String(radius + 6))
      t.setAttribute('y', '3')
      t.textContent = p.title
      g.appendChild(t)
      nodeLayer.appendChild(g)
      nodeEls.set(p.id, { g, c, t, radius })
    })

    // View state (pan/zoom)
    const view = { x: 0, y: 0, k: 1 }

    function clientToSvg(cx: number, cy: number) {
      const s = svgRef.current!
      const rect = s.getBoundingClientRect()
      const vb = s.viewBox.baseVal
      const x = (cx - rect.left) * (vb.width / rect.width)
      const y = (cy - rect.top) * (vb.height / rect.height)
      return { x: (x - view.x) / view.k, y: (y - view.y) / view.k }
    }

    function updateVisual() {
      gRoot.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${view.k})`)
      const sel = selectedIdRef.current
      const tags = activeTagsRef.current
      const labels = showLabelsRef.current
      const activeSet =
        tags.size === 0
          ? null
          : new Set(postList.filter(p => p.tags.some(t => tags.has(t))).map(p => p.id))
      const visible = (id: string) => activeSet === null || activeSet.has(id)

      edgeEls.forEach(({ el, a, b }) => {
        const na = byId[a], nb = byId[b]
        if (!na || !nb) return
        el.setAttribute('x1', String(na.x)); el.setAttribute('y1', String(na.y))
        el.setAttribute('x2', String(nb.x)); el.setAttribute('y2', String(nb.y))
        const hot = sel && (sel === a || sel === b)
        el.setAttribute('class', 'rg-edge' + (hot ? ' hot' : ''))
        const vis = visible(a) && visible(b) ? (sel && !hot ? '0.35' : '1') : '0.08'
        el.setAttribute('opacity', vis)
      })

      nodeEls.forEach((n, id) => {
        const p = byId[id]
        if (!p) return
        n.g.setAttribute('transform', `translate(${p.x} ${p.y})`)
        const isSel = sel === id
        const isConnected = sel ? (byId[sel]?.links.includes(id) || id === sel) : false
        n.c.setAttribute('stroke', isSel ? '#111114' : 'rgba(17,17,20,0.2)')
        n.c.setAttribute('stroke-width', isSel ? '2' : '0.8')
        const vis = visible(id) ? (sel && !isConnected ? '0.4' : '1') : '0.12'
        n.g.setAttribute('opacity', vis)
        n.t.style.display = labels ? '' : 'none'
      })
    }

    updateVisualRef.current = updateVisual

    // Node drag
    let draggingNode: SimPost | null = null
    let dragOffset = { ox: 0, oy: 0 }
    let mouseDownTime = 0

    postList.forEach(p => {
      const { g, c } = nodeEls.get(p.id)!
      c.addEventListener('mousedown', ev => {
        ev.stopPropagation()
        mouseDownTime = Date.now()
        draggingNode = byId[p.id]
        const pt = clientToSvg(ev.clientX, ev.clientY)
        dragOffset = { ox: pt.x - byId[p.id].x, oy: pt.y - byId[p.id].y }
        alphaRef.current = Math.min(1, alphaRef.current + 0.6)
      })
      g.addEventListener('click', ev => {
        ev.stopPropagation()
        if (Date.now() - mouseDownTime > 220) return
        selectPost(p.id)
      })
    })

    // Canvas pan
    let panDragging = false
    let panStart = { x: 0, y: 0 }
    let panOrigin = { x: 0, y: 0 }

    svg.addEventListener('mousedown', e => {
      if ((e.target as Element).tagName !== 'circle') {
        panDragging = true
        panStart = { x: e.clientX, y: e.clientY }
        panOrigin = { x: view.x, y: view.y }
        svg.classList.add('rg-dragging')
      }
    })

    const handleMouseMove = (e: MouseEvent) => {
      if (draggingNode) {
        const pt = clientToSvg(e.clientX, e.clientY)
        draggingNode.x = pt.x - dragOffset.ox
        draggingNode.y = pt.y - dragOffset.oy
        alphaRef.current = Math.min(1, alphaRef.current + 0.05)
        return
      }
      if (!panDragging) return
      view.x = panOrigin.x + (e.clientX - panStart.x)
      view.y = panOrigin.y + (e.clientY - panStart.y)
      updateVisual()
    }

    const handleMouseUp = () => {
      if (draggingNode) alphaRef.current = Math.min(1, alphaRef.current + 0.4)
      draggingNode = null
      panDragging = false
      svg.classList.remove('rg-dragging')
    }

    svg.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    svg.addEventListener('click', e => {
      if (e.target === svg) clearSelection()
    })

    svg.addEventListener('wheel', e => {
      e.preventDefault()
      view.k = Math.max(0.4, Math.min(2.5, view.k - e.deltaY * 0.001))
      updateVisual()
    }, { passive: false })

    // Zoom buttons (accessed via DOM ids)
    const btnZoomIn = document.getElementById('rg-zoom-in')
    const btnZoomOut = document.getElementById('rg-zoom-out')
    const btnZoomReset = document.getElementById('rg-zoom-reset')
    if (btnZoomIn) btnZoomIn.onclick = () => { view.k = Math.min(2.5, view.k + 0.2); updateVisual() }
    if (btnZoomOut) btnZoomOut.onclick = () => { view.k = Math.max(0.4, view.k - 0.2); updateVisual() }
    if (btnZoomReset) btnZoomReset.onclick = () => {
      view.k = 1; view.x = 0; view.y = 0
      alphaRef.current = Math.min(1, alphaRef.current + 0.8)
      updateVisual()
    }

    // Animation tick
    function tick() {
      const alpha = alphaRef.current
      if (alpha > 0.001) {
        for (let i = 0; i < postList.length; i++) {
          for (let j = i + 1; j < postList.length; j++) {
            const a = postList[i], b = postList[j]
            const dx = a.x - b.x, dy = a.y - b.y
            const d2 = dx * dx + dy * dy + 40
            const d = Math.sqrt(d2)
            const f = 2600 / d2
            a.vx += (dx / d) * f * alpha; a.vy += (dy / d) * f * alpha
            b.vx -= (dx / d) * f * alpha; b.vy -= (dy / d) * f * alpha
          }
        }
        edges.forEach(e => {
          const a = byId[e.a], b = byId[e.b]
          if (!a || !b) return
          const dx = b.x - a.x, dy = b.y - a.y
          const d = Math.sqrt(dx * dx + dy * dy) + 1
          const f = (d - 130) * 0.08 * alpha
          a.vx += (dx / d) * f; a.vy += (dy / d) * f
          b.vx -= (dx / d) * f; b.vy -= (dy / d) * f
        })
        postList.forEach(p => {
          p.vx += (W / 2 - p.x) * 0.006 * alpha
          p.vy += (H / 2 - p.y) * 0.006 * alpha
        })
        postList.forEach(p => {
          if (p === draggingNode) { p.vx = 0; p.vy = 0; return }
          p.vx *= 0.78; p.vy *= 0.78
          p.x += p.vx; p.y += p.vy
        })
        alphaRef.current *= 0.985
        updateVisual()
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    updateVisual()
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { post: selectedPost, connected } = detail

  return (
    <div className="rg-wrap">
      {/* Topbar */}
      <header className="rg-topbar">
        <Link href="/" className="rg-brand">
          real<em>zoojin</em><span className="rg-dot" />
        </Link>
        <div className="rg-crumbs">
          <Link href="/">글</Link>
          <span className="rg-sep">/</span>
          <span className="rg-here">그래프 뷰</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link className="rg-btn" href="/">← 리스트로</Link>
          {posts[0] && (
            <Link className="rg-btn" href={`/post/${posts[0].slug}`}>최신 글 열기</Link>
          )}
        </div>
      </header>

      {/* Shell */}
      <div className="rg-shell">
        {/* Left sidebar */}
        <aside className="rg-side">
          <div className="rg-eyebrow">범례</div>
          <div className="rg-legend">
            {catEntries.map(([k, v]) => (
              <div key={k} className="rg-legend-row">
                <span className="rg-legend-dot" style={{ background: v.color }} />
                <span>{v.label}</span>
                <span className="rg-legend-count">{posts.filter(p => p.cat === k).length}</span>
              </div>
            ))}
          </div>

          <div className="rg-eyebrow" style={{ marginTop: '28px' }}>필터</div>
          <div className="rg-filters">
            <div className="rg-kv">
              <span>Node size</span>
              <span className="rg-kv-val">by links</span>
            </div>
            <div className="rg-kv">
              <span>Labels</span>
              <label className="rg-kv-val" style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={e => toggleLabels(e.target.checked)}
                />{' '}표시
              </label>
            </div>
          </div>

          {allTags.length > 0 && (
            <>
              <div className="rg-eyebrow" style={{ marginTop: '28px' }}>태그 필터</div>
              <div className="rg-tag-list">
                {allTags.map(t => (
                  <span
                    key={t}
                    className={'rg-tag-pill' + (activeTags.has(t) ? ' on' : '')}
                    onClick={() => toggleTag(t)}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* Canvas */}
        <div className="rg-canvas">
          {posts.length === 0 ? (
            <div className="rg-empty">
              <span>글이 없습니다</span>
              <span style={{ fontSize: '10px', color: 'var(--rule)' }}>posts/ 폴더에 .md 파일을 추가하세요</span>
            </div>
          ) : (
            <>
              <svg
                ref={svgRef}
                viewBox="0 0 1000 700"
                preserveAspectRatio="xMidYMid meet"
              />
              <div className="rg-hint">
                노드 드래그 — 자유롭게 배치 · 빈 공간 드래그 — 전체 이동 · 휠 — 줌
              </div>
              <div className="rg-zoom-ctrl">
                <button id="rg-zoom-out">−</button>
                <button id="rg-zoom-reset">◌</button>
                <button id="rg-zoom-in">+</button>
              </div>
            </>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="rg-side rg-side-right">
          <div className="rg-eyebrow">선택</div>
          <div className="rg-detail">
            {selectedPost ? (
              <>
                <h3>{selectedPost.title}</h3>
                <div className="rg-detail-meta">
                  {categories[selectedPost.cat]?.label ?? selectedPost.cat}
                  {' · '}{selectedPost.links.length} links
                  {' · '}{selectedPost.tags.length} tags
                </div>
                {selectedPost.summary && <p>{selectedPost.summary}</p>}

                <div className="rg-linkset">
                  {connected.length > 0 && (
                    <>
                      <div className="rg-eyebrow" style={{ marginTop: '10px' }}>Connected</div>
                      {connected.map(l => {
                        const t = posts.find(p => p.id === l)
                        return t ? (
                          <button
                            key={l}
                            className="rg-link-btn"
                            onClick={() => selectPost(l)}
                          >
                            {'[['}{t.title}{']]'}
                          </button>
                        ) : null
                      })}
                    </>
                  )}

                  {selectedPost.tags.length > 0 && (
                    <>
                      <div className="rg-eyebrow" style={{ marginTop: '16px' }}>Tags</div>
                      <div className="rg-tag-list">
                        {selectedPost.tags.map(t => (
                          <span key={t} className="rg-tag-pill">{t}</span>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="rg-eyebrow" style={{ marginTop: '16px' }}>Open</div>
                  <Link href={`/post/${selectedPost.slug}`} className="rg-open-link">
                    글 페이지로 이동 ↗
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h3>노드를 선택하세요</h3>
                <div className="rg-detail-meta">
                  그래프에서 글을 클릭하면 여기에 요약이 표시됩니다.
                </div>
                <p>
                  realzoojin의 글과 태그는 Obsidian의{' '}
                  <code>{'[[wikilinks]]'}</code>로 연결되어 있습니다.
                  연결된 노드는 선으로 이어지고, 같은 태그를 공유하는 글은 색으로 묶입니다.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
