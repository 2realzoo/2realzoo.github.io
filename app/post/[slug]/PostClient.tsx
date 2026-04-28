'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface Heading {
  id: string
  text: string
}

interface Props {
  headings: Heading[]
}

export default function PostClient({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '')
  const [progress, setProgress] = useState(0)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Reading progress
  useEffect(() => {
    function update() {
      const article = document.querySelector('article')
      if (!article) return
      const rect = article.getBoundingClientRect()
      const total = rect.height - window.innerHeight + 200
      const scrolled = Math.max(0, -rect.top)
      const pct = Math.min(100, Math.max(0, (scrolled / total) * 100))
      setProgress(pct)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  // TOC active section via IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-100px 0px -70% 0px' }
    )
    document.querySelectorAll('article h2[id]').forEach(h => io.observe(h))
    return () => io.disconnect()
  }, [headings])

  // Move indicator to active item
  useEffect(() => {
    if (!wrapRef.current || !indicatorRef.current || !activeId) return
    const li = wrapRef.current.querySelector(`li[data-id="${activeId}"]`) as HTMLLIElement | null
    if (!li) return
    const parentRect = wrapRef.current.getBoundingClientRect()
    const liRect = li.getBoundingClientRect()
    const top = liRect.top - parentRect.top + 8
    const height = Math.max(4, liRect.height - 16)
    Object.assign(indicatorRef.current.style, {
      top: `${top}px`,
      height: `${height}px`,
      opacity: '1',
    })
  }, [activeId])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' })
  }

  return (
    <>
      {/* Fixed reading progress bar */}
      <div className="rz-progress" style={{ width: `${progress}%` }} />

      {/* Sticky TOC sidebar — first column of rz-shell grid */}
      <aside className="rz-toc">
        <Link href="/" className="rz-back-home">← 전체 글</Link>
        <div className="rz-eyebrow">목차</div>
        <div className="rz-toc-wrap" ref={wrapRef}>
          <div className="rz-rail" />
          <div className="rz-indicator" ref={indicatorRef} />
          <ol>
            {headings.map((h) => (
              <li key={h.id} data-id={h.id} className={activeId === h.id ? 'active' : ''}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => { e.preventDefault(); scrollTo(h.id) }}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </>
  )
}
