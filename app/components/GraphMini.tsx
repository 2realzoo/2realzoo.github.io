'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as d3 from 'd3'

interface RawPost {
  slug: string
  title: string
  tags: string[]
  summary: string
}

interface GNode {
  id: string
  title: string
  type: 'note' | 'tag'
  slug?: string
  x?: number; y?: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null
}

interface GLink {
  source: string | GNode
  target: string | GNode
}

interface Props {
  currentSlug?: string
  posts?: RawPost[]
  height?: number
}

function buildGraph(posts: RawPost[]) {
  const nodes: GNode[] = posts.map(p => ({ id: p.slug, title: p.title, type: 'note', slug: p.slug }))
  const tagSet = new Set(posts.flatMap(p => p.tags))
  tagSet.forEach(t => nodes.push({ id: `tag:${t}`, title: `#${t}`, type: 'tag' }))

  const links: GLink[] = []
  posts.forEach(p => {
    p.tags.forEach(t => links.push({ source: p.slug, target: `tag:${t}` }))
  })
  return { nodes, links }
}

function bfsSubgraph(allNodes: GNode[], allLinks: GLink[], startId: string, hops = 2, max = 20) {
  const nodeById = new Map(allNodes.map(n => [n.id, n]))
  const adj = new Map<string, Set<string>>()
  allLinks.forEach(l => {
    const s = typeof l.source === 'string' ? l.source : (l.source as GNode).id
    const t = typeof l.target === 'string' ? l.target : (l.target as GNode).id
    if (!adj.has(s)) adj.set(s, new Set())
    if (!adj.has(t)) adj.set(t, new Set())
    adj.get(s)!.add(t)
    adj.get(t)!.add(s)
  })

  const visited = new Set<string>()
  const queue: [string, number][] = [[startId, 0]]
  while (queue.length && visited.size < max) {
    const [id, depth] = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    if (depth < hops) adj.get(id)?.forEach(nb => { if (!visited.has(nb)) queue.push([nb, depth + 1]) })
  }

  return {
    nodes: [...visited].map(id => nodeById.get(id)!).filter(Boolean),
    links: allLinks.filter(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as GNode).id
      const t = typeof l.target === 'string' ? l.target : (l.target as GNode).id
      return visited.has(s) && visited.has(t)
    }),
  }
}

export default function GraphMini({ currentSlug, posts: propPosts, height = 160 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()

  useEffect(() => {
    const draw = (rawPosts: RawPost[]) => {
      const svg = d3.select(svgRef.current!)
      svg.selectAll('*').remove()
      const W = svgRef.current!.clientWidth || 240
      const H = height

      const { nodes: allNodes, links: allLinks } = buildGraph(rawPosts)
      const { nodes, links } = currentSlug
        ? bfsSubgraph(allNodes, allLinks, currentSlug)
        : { nodes: allNodes, links: allLinks }

      if (nodes.length === 0) return

      const g = svg.append('g')
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', e => g.attr('transform', e.transform))
      svg.call(zoom)

      const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
        .force('link', d3.forceLink(links as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[])
          .id((d: d3.SimulationNodeDatum) => (d as GNode).id)
          .distance(30))
        .force('charge', d3.forceManyBody().strength(-40))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide().radius(8))

      const edge = g.append('g').selectAll<SVGPathElement, GLink>('path')
        .data(links)
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', 'var(--line)')
        .attr('stroke-width', 1)
        .attr('opacity', 0.35)

      const node = g.append('g').selectAll<SVGGElement, GNode>('g')
        .data(nodes)
        .join('g')
        .style('cursor', 'pointer')

      // Glow for current
      const defs = svg.append('defs')
      const filt = defs.append('filter').attr('id', 'mini-glow')
      filt.append('feGaussianBlur').attr('stdDeviation', 2).attr('result', 'blur')
      const fm = filt.append('feMerge')
      fm.append('feMergeNode').attr('in', 'blur')
      fm.append('feMergeNode').attr('in', 'SourceGraphic')

      node.each(function(d) {
        const el = d3.select(this)
        const isCurrent = d.id === currentSlug
        if (d.type === 'tag') {
          el.append('rect')
            .attr('width', 8).attr('height', 8)
            .attr('x', -4).attr('y', -4)
            .attr('transform', 'rotate(45)')
            .attr('fill', 'var(--mag)')
            .attr('opacity', 0.8)
        } else {
          el.append('circle')
            .attr('r', isCurrent ? 7 : 4)
            .attr('fill', isCurrent ? 'var(--accent)' : 'var(--ink-mute)')
            .attr('opacity', isCurrent ? 1 : 0.7)
            .attr('filter', isCurrent ? 'url(#mini-glow)' : null)
        }
        if (isCurrent) {
          el.append('text')
            .attr('dy', -10)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--ink)')
            .attr('font-size', 9)
            .attr('font-family', 'var(--mono)')
            .text(d.title.slice(0, 14) + (d.title.length > 14 ? '…' : ''))
        }
      })

      node
        .on('mouseover', function(_, d) {
          const conn = new Set([d.id])
          links.forEach(l => {
            const s = (l.source as GNode).id, t = (l.target as GNode).id
            if (s === d.id) conn.add(t)
            if (t === d.id) conn.add(s)
          })
          node.style('opacity', (n: GNode) => conn.has(n.id) ? 1 : 0.2)
          edge.style('opacity', (l: GLink) => {
            const s = (l.source as GNode).id, t = (l.target as GNode).id
            return conn.has(s) && conn.has(t) ? 0.9 : 0.05
          })
        })
        .on('mouseout', () => {
          node.style('opacity', 1)
          edge.style('opacity', 0.35)
        })
        .on('click', (e, d) => {
          e.stopPropagation()
          if (d.type === 'tag') router.push(`/tags?t=${d.id.replace('tag:', '')}`)
          else if (d.slug) router.push(`/post/${d.slug}`)
        })

      simulation.on('tick', () => {
        edge.attr('d', (l: GLink) => {
          const s = l.source as GNode, t = l.target as GNode
          const mx = ((s.x ?? 0) + (t.x ?? 0)) / 2
          const my = ((s.y ?? 0) + (t.y ?? 0)) / 2
          const dx = (t.x ?? 0) - (s.x ?? 0)
          const dy = (t.y ?? 0) - (s.y ?? 0)
          return `M${s.x},${s.y} Q${mx - dy * 0.1},${my + dx * 0.1} ${t.x},${t.y}`
        })
        node.attr('transform', (d: GNode) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

      return () => simulation.stop()
    }

    if (propPosts) {
      draw(propPosts)
    } else {
      fetch('/posts.json').then(r => r.json()).then(draw).catch(() => {})
    }
  }, [propPosts, currentSlug, height]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', height, border: '1.5px solid var(--line)', background: 'var(--card)', overflow: 'hidden' }}>
      <svg ref={svgRef} width="100%" height={height} style={{ display: 'block' }} />
    </div>
  )
}
