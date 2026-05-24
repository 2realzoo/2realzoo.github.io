'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as d3 from 'd3'
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

/* ── Data model ── */
interface GNode {
  id: string
  title: string
  type: 'note' | 'tag'
  tags: string[]
  slug?: string
  // D3 simulation fields
  x?: number; y?: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null
}

interface GLink {
  source: string | GNode
  target: string | GNode
}

/* Build graph data from posts */
function buildGraph(posts: GraphPost[]) {
  const nodes: GNode[] = []
  const links: GLink[] = []
  const tagSet = new Set<string>()

  // Note nodes
  posts.forEach(p => {
    nodes.push({ id: p.id, title: p.title, type: 'note', tags: p.tags, slug: p.slug })
    p.tags.forEach(t => tagSet.add(t))
  })

  // Tag nodes (diamond)
  tagSet.forEach(t => {
    nodes.push({ id: `tag:${t}`, title: `#${t}`, type: 'tag', tags: [] })
  })

  // Note → tag edges
  posts.forEach(p => {
    p.tags.forEach(t => {
      links.push({ source: p.id, target: `tag:${t}` })
    })
  })

  // Wikilink edges
  posts.forEach(p => {
    p.links.forEach(l => {
      if (posts.some(q => q.id === l)) {
        links.push({ source: p.id, target: l })
      }
    })
  })

  return { nodes, links }
}

/* 2-hop BFS subgraph */
function localSubgraph(
  allNodes: GNode[],
  allLinks: GLink[],
  currentId: string,
  maxNodes = 30,
): { nodes: GNode[]; links: GLink[] } {
  const nodeById = new Map(allNodes.map(n => [n.id, n]))
  const adjMap = new Map<string, Set<string>>()

  allLinks.forEach(l => {
    const s = typeof l.source === 'string' ? l.source : l.source.id
    const t = typeof l.target === 'string' ? l.target : l.target.id
    if (!adjMap.has(s)) adjMap.set(s, new Set())
    if (!adjMap.has(t)) adjMap.set(t, new Set())
    adjMap.get(s)!.add(t)
    adjMap.get(t)!.add(s)
  })

  const visited = new Set<string>()
  const queue: [string, number][] = [[currentId, 0]]
  while (queue.length && visited.size < maxNodes) {
    const [id, depth] = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    if (depth < 2) {
      adjMap.get(id)?.forEach(nb => {
        if (!visited.has(nb)) queue.push([nb, depth + 1])
      })
    }
  }

  const subNodes = [...visited].map(id => nodeById.get(id)!).filter(Boolean)
  const subLinks = allLinks.filter(l => {
    const s = typeof l.source === 'string' ? l.source : l.source.id
    const t = typeof l.target === 'string' ? l.target : l.target.id
    return visited.has(s) && visited.has(t)
  })
  return { nodes: subNodes, links: subLinks }
}

export default function GraphClient({
  posts,
  categories,
  currentSlug,
  localMode = false,
}: {
  posts: GraphPost[]
  categories: Record<string, GraphCategory>
  currentSlug?: string
  localMode?: boolean
}) {
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [showLabels, setShowLabels] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null)
  const allTags = [...new Set(posts.flatMap(p => p.tags))]

  // Filter posts by active tags
  const filteredPosts = activeTags.size === 0
    ? posts
    : posts.filter(p => p.tags.some(t => activeTags.has(t)))

  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    svg.selectAll('*').remove()

    const el = svgRef.current!
    const W = el.clientWidth || 900
    const H = el.clientHeight || 600

    const { nodes: rawNodes, links: rawLinks } = buildGraph(filteredPosts)
    let nodes: GNode[], links: GLink[]

    if (localMode && currentSlug) {
      const sub = localSubgraph(rawNodes, rawLinks, currentSlug)
      nodes = sub.nodes
      links = sub.links
    } else {
      nodes = rawNodes
      links = rawLinks
    }

    if (nodes.length === 0) return

    // Degree map for node sizing
    const degreeMap = new Map<string, number>()
    links.forEach(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as GNode).id
      const t = typeof l.target === 'string' ? l.target : (l.target as GNode).id
      degreeMap.set(s, (degreeMap.get(s) || 0) + 1)
      degreeMap.set(t, (degreeMap.get(t) || 0) + 1)
    })

    const nodeRadius = (n: GNode) => {
      if (n.id === currentSlug) return 9
      const deg = degreeMap.get(n.id) || 0
      return n.type === 'tag' ? 5 + Math.min(deg, 5) : 4 + Math.min(deg * 0.6, 5)
    }

    // D3 force simulation
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[])
        .id((d: d3.SimulationNodeDatum) => (d as GNode).id)
        .distance(d => {
          const s = (d.source as GNode).type, t = (d.target as GNode).type
          return (s === 'tag' || t === 'tag') ? 60 : 90
        }))
      .force('charge', d3.forceManyBody().strength((d) => {
        const n = d as GNode
        return n.type === 'tag' ? -80 : -50
      }))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius((d) => nodeRadius(d as GNode) + 4))

    // Glow filter for current node
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'blur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Zoom container
    const g = svg.append('g')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', e => g.attr('transform', e.transform))
    svg.call(zoom)
    svg.on('dblclick.zoom', () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2))
    })

    // Edges — quadratic Bézier curves
    const edgeGroup = g.append('g').attr('class', 'rg-edges')
    const edge = edgeGroup.selectAll<SVGPathElement, GLink>('path')
      .data(links)
      .join('path')
      .attr('class', 'rg-edge')
      .attr('fill', 'none')

    // Nodes
    const nodeGroup = g.append('g').attr('class', 'rg-nodes')
    const node = nodeGroup.selectAll<SVGGElement, GNode>('g')
      .data(nodes)
      .join('g')
      .attr('class', 'rg-node')
      .style('cursor', 'pointer')

    // Draw shapes
    node.each(function(d) {
      const el = d3.select(this)
      const r = nodeRadius(d)
      const isCurrent = d.id === currentSlug

      if (d.type === 'tag') {
        // Diamond (rotated square)
        const s = r * 1.4
        el.append('rect')
          .attr('width', s * 2)
          .attr('height', s * 2)
          .attr('x', -s)
          .attr('y', -s)
          .attr('transform', 'rotate(45)')
          .attr('fill', 'var(--mag)')
          .attr('opacity', 0.85)
      } else {
        const catColor = categories[d.tags[0] ?? '']?.color ?? 'var(--accent)'
        el.append('circle')
          .attr('r', r)
          .attr('fill', isCurrent ? 'var(--accent)' : catColor)
          .attr('opacity', isCurrent ? 1 : 0.85)
          .attr('filter', isCurrent ? 'url(#glow)' : null)
          .attr('stroke', isCurrent ? 'var(--ink)' : 'none')
          .attr('stroke-width', isCurrent ? 1.5 : 0)
      }
    })

    // Labels
    const label = node.append('text')
      .attr('class', 'rg-node-label')
      .attr('dy', d => nodeRadius(d) + 12)
      .attr('text-anchor', 'middle')
      .text(d => d.title.slice(0, 18) + (d.title.length > 18 ? '…' : ''))
      .style('display', showLabels ? 'block' : 'none')

    // Hover: highlight connected, dim others
    const linkedSet = (d: GNode) => {
      const ids = new Set([d.id])
      links.forEach(l => {
        const s = (l.source as GNode).id, t = (l.target as GNode).id
        if (s === d.id) ids.add(t)
        if (t === d.id) ids.add(s)
      })
      return ids
    }

    node
      .on('mouseover', function(_, d) {
        const connected = linkedSet(d)
        node.transition().duration(150)
          .style('opacity', (n: GNode) => connected.has(n.id) ? 1 : 0.15)
        edge.transition().duration(150)
          .style('opacity', (l: GLink) => {
            const s = (l.source as GNode).id, t = (l.target as GNode).id
            return connected.has(s) && connected.has(t) ? 1 : 0.05
          })
          .attr('stroke', (l: GLink) => {
            const s = (l.source as GNode).id, t = (l.target as GNode).id
            return (connected.has(s) && connected.has(t)) ? 'var(--accent)' : 'var(--line)'
          })
        label.transition().duration(150)
          .style('opacity', (n: GNode) => connected.has(n.id) ? 1 : 0.1)
      })
      .on('mouseout', function() {
        node.transition().duration(200).style('opacity', 1)
        edge.transition().duration(200).style('opacity', 0.4)
          .attr('stroke', 'var(--line)')
        label.transition().duration(200).style('opacity', 1)
      })
      .on('click', function(e, d) {
        e.stopPropagation()
        if (d.type === 'tag') {
          router.push(`/tags?t=${d.id.replace('tag:', '')}`)
        } else if (d.slug) {
          setSelectedNode(d)
        }
      })

    // Drag
    node.call(
      d3.drag<SVGGElement, GNode>()
        .on('start', (e, d) => {
          if (!e.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
        .on('end', (e, d) => {
          if (!e.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        })
    )

    // Simulation tick
    simulation.on('tick', () => {
      edge.attr('d', (l: GLink) => {
        const s = l.source as GNode, t = l.target as GNode
        const mx = ((s.x ?? 0) + (t.x ?? 0)) / 2
        const my = ((s.y ?? 0) + (t.y ?? 0)) / 2
        const dx = (t.x ?? 0) - (s.x ?? 0)
        const dy = (t.y ?? 0) - (s.y ?? 0)
        const cx = mx - dy * 0.12
        const cy = my + dx * 0.12
        return `M${s.x},${s.y} Q${cx},${cy} ${t.x},${t.y}`
      })

      node.attr('transform', (d: GNode) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    return () => { simulation.stop() }
  }, [filteredPosts, currentSlug, localMode, showLabels]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rg-wrap">
      <div className="rg-shell">
        {/* Left sidebar */}
        <aside className="rg-side">
          <div className="rg-eyebrow">범례</div>
          <div className="rg-legend">
            {Object.entries(categories).map(([k, v]) => (
              <div key={k} className="rg-legend-row">
                <span className="rg-legend-dot" style={{ background: v.color }} />
                <span>{v.label}</span>
                <span className="rg-legend-count">{filteredPosts.filter(p => p.cat === k).length}</span>
              </div>
            ))}
            <div className="rg-legend-row">
              <span className="rg-legend-dot" style={{ background: 'var(--mag)', transform: 'rotate(45deg)', borderRadius: 1 }} />
              <span>태그</span>
              <span className="rg-legend-count">{[...new Set(filteredPosts.flatMap(p => p.tags))].length}</span>
            </div>
          </div>

          <div className="rg-eyebrow" style={{ marginTop: 24 }}>표시 설정</div>
          <div className="rg-filters">
            <div className="rg-kv">
              <span>Labels</span>
              <label className="rg-kv-val">
                <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />{' '}표시
              </label>
            </div>
          </div>

          {allTags.length > 0 && (
            <>
              <div className="rg-eyebrow" style={{ marginTop: 24 }}>태그 필터</div>
              <div className="rg-tag-list">
                {allTags.map(t => (
                  <span
                    key={t}
                    className={'rg-tag-pill' + (activeTags.has(t) ? ' on' : '')}
                    onClick={() => setActiveTags(prev => {
                      const next = new Set(prev)
                      next.has(t) ? next.delete(t) : next.add(t)
                      return next
                    })}
                  >{t}</span>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* Canvas */}
        <div className="rg-canvas">
          <svg ref={svgRef} />
          <div className="rg-hint">드래그 — 노드 이동 · 배경 드래그 — 팬 · 휠 — 줌 · 더블클릭 — 리셋</div>
          <div className="rg-zoom-ctrl">
            <button onClick={() => {
              const svg = d3.select(svgRef.current!)
              svg.transition().duration(300).call(
                (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>).scaleBy, 0.7
              )
            }}>−</button>
            <button onClick={() => {
              const svg = d3.select(svgRef.current!)
              svg.transition().duration(500).call(
                (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>).transform,
                d3.zoomIdentity
              )
            }}>◌</button>
            <button onClick={() => {
              const svg = d3.select(svgRef.current!)
              svg.transition().duration(300).call(
                (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>).scaleBy, 1.4
              )
            }}>+</button>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="rg-side rg-side-right">
          <div className="rg-eyebrow">선택</div>
          <div className="rg-detail">
            {selectedNode ? (
              <>
                <h3>{selectedNode.title}</h3>
                <div className="rg-detail-meta">
                  {selectedNode.tags.join(' · ')}
                </div>
                <div className="rg-linkset">
                  <Link href={`/post/${selectedNode.slug}`} className="rg-open-link">
                    글 페이지로 이동 ↗
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h3>노드를 선택하세요</h3>
                <p style={{ fontSize: 12 }}>
                  노트 노드(●)를 클릭하면 요약이 표시됩니다.<br />
                  태그 노드(◆)를 클릭하면 태그 페이지로 이동합니다.
                </p>
                <p style={{ fontSize: 12, marginTop: 8 }}>
                  전체 {posts.length}개 노트 · {[...new Set(posts.flatMap(p => p.tags))].length}개 태그
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
