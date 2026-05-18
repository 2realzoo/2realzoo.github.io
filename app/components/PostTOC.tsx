'use client'

import { useEffect, useRef, useState } from 'react'

export interface Heading {
  level: number
  text: string
  id: string
}

export default function PostTOC({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!headings.length) return

    const ids = headings.map(h => h.id)

    observerRef.current = new IntersectionObserver(
      entries => {
        // Pick the topmost visible heading
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-60px 0px -60% 0px', threshold: 0 }
    )

    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observerRef.current!.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [headings])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Update active immediately on click
    setActiveId(id)
    // Update URL hash without page jump
    history.pushState(null, '', `#${id}`)
  }

  if (!headings.length) return null

  return (
    <ol className="toc-list">
      {headings.map((h, i) => {
        const isActive = activeId === h.id
        return (
          <li
            key={h.id}
            className={isActive ? 'active' : ''}
            style={{
              paddingLeft: h.level === 2 ? 10 : h.level === 3 ? 18 : 10,
            }}
          >
            <a
              onClick={e => { e.preventDefault(); scrollTo(h.id) }}
              href={`#${h.id}`}
              style={{
                fontFamily: 'var(--kr)',
                fontSize: 12,
                color: isActive ? 'var(--ink)' : 'var(--ink-mute)',
                textDecoration: 'none',
                cursor: 'pointer',
                display: 'block',
                padding: '2px 0',
                transition: 'color 0.12s',
                lineHeight: 1.4,
              }}
              onMouseEnter={e => {
                if (!isActive) (e.target as HTMLElement).style.color = 'var(--ink)'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.target as HTMLElement).style.color = 'var(--ink-mute)'
              }}
            >
              {i + 1}. {h.text}
            </a>
          </li>
        )
      })}
    </ol>
  )
}
