'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const TABS = [
  { id: 'home',   label: 'home.tsx',   href: '/',        swatch: '#2a1aff' },
  { id: 'posts',  label: 'posts.md',   href: '/posts',   swatch: '#0a8a3a' },
  { id: 'graph',  label: 'graph.svg',  href: '/graph',   swatch: '#d8731d' },
  { id: 'tags',   label: 'tags.json',  href: '/tags',    swatch: '#a8208c' },
  { id: 'about',  label: 'about.md',   href: '/about',   swatch: '#1a1a1a' },
  { id: 'search', label: 'search.txt', href: '/search',  swatch: '#6b6155' },
]

function getActiveTab(pathname: string) {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/post')) return 'posts'
  if (pathname.startsWith('/graph')) return 'graph'
  if (pathname.startsWith('/tags')) return 'tags'
  if (pathname.startsWith('/about')) return 'about'
  if (pathname.startsWith('/search')) return 'search'
  return 'home'
}

export default function TabBar() {
  const pathname = usePathname()
  const active = getActiveTab(pathname)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') setDark(true)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const now = new Date()
  const dateStr = `${now.getFullYear().toString().slice(2)}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`

  return (
    <nav className="tab-bar">
      <div className="tab-bar-prompt">
        <span className="prompt-dot" />
        <span className="prompt-dir">~/2realzoo</span>
        <span className="prompt-dollar">$</span>
      </div>

      {TABS.map(t => (
        <Link
          key={t.id}
          href={t.href}
          className={`tab${active === t.id ? ' active' : ''}`}
        >
          <span className="tab-swatch" style={{ background: t.swatch }} />
          <span>{t.label}</span>
          <span className="tab-close">×</span>
        </Link>
      ))}

      <span className="tab-plus">+</span>
      <div className="tab-bar-spacer" />

      <div className="tab-bar-meta">
        <span>main</span>
        <span className="meta-date">{dateStr}</span>
        <button
          className="theme-toggle"
          onClick={toggle}
          aria-label="toggle dark mode"
        >
          <div
            className="theme-toggle-knob"
            style={{ left: dark ? 20 : 2 }}
          />
        </button>
      </div>
    </nav>
  )
}
