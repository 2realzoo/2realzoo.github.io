'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import TabBar from '@/app/components/TabBar'

interface PostMeta {
  slug: string
  title: string
  date: string
  tags: string[]
  summary: string
  category?: string
}

function highlight(text: string, q: string) {
  if (!q || !text) return <span>{text}</span>
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase()
          ? <mark key={i}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

interface FlagState {
  r: boolean  // recursive — also search summary/body, not just title+tags
  n: boolean  // show line numbers
  i: boolean  // ignore case
  w: boolean  // whole word match
  C: boolean  // show context line (summary)
}

export default function SearchPage() {
  const [posts, setPosts] = useState<PostMeta[]>([])
  const [query, setQuery] = useState('')
  const [flags, setFlags] = useState<FlagState>({ r: true, n: true, i: true, w: false, C: false })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/posts.json').then(r => r.json()).then(setPosts)
    inputRef.current?.focus()
  }, [])

  const toggleFlag = (key: keyof FlagState) =>
    setFlags(prev => ({ ...prev, [key]: !prev[key] }))

  const raw = query.trim()
  const q = flags.i ? raw.toLowerCase() : raw

  // Build a matcher honoring ignore-case (-i) and whole-word (-w) flags.
  const matches = (text: string) => {
    if (!q) return false
    if (flags.w) {
      const esc = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return new RegExp(`\\b${esc}\\b`, flags.i ? 'i' : '').test(text)
    }
    return (flags.i ? text.toLowerCase() : text).includes(q)
  }

  const results = q
    ? posts.filter(p =>
        matches(p.title) ||
        (flags.r && matches(p.summary)) ||
        p.tags.some(t => matches(t))
      )
    : []

  function matchLines(post: PostMeta) {
    const lines: { n: number; kind: string; text: string }[] = []
    if (matches(post.title)) lines.push({ n: 1, kind: 'title', text: post.title })
    if (flags.r && matches(post.summary)) lines.push({ n: 14, kind: 'body', text: post.summary })
    if (post.tags.some(t => matches(t))) lines.push({ n: 3, kind: 'tag', text: post.tags.join(', ') })
    // -C 2: show summary as context even when it isn't itself a match
    if (flags.C && !lines.some(l => l.kind === 'body') && post.summary) {
      lines.push({ n: 14, kind: 'context', text: post.summary })
    }
    return lines
  }

  const totalMatches = results.reduce((s, p) => s + matchLines(p).filter(l => l.kind !== 'context').length, 0)

  const history = ['grep "llm"', 'grep "rag"', 'grep "eval"', 'ls posts/', 'tag --count']

  return (
    <>
      <TabBar />
      <div className="search-page">
        <div className="search-main">
          {/* grep prompt */}
          <div className="search-prompt">
            <span className="sp-path">~/2realzoo</span>
            <span className="sp-dollar">$</span>
            <span className="sp-cmd">grep</span>
            {(() => {
              const letters = (['r', 'n', 'i', 'w'] as const).filter(k => flags[k]).join('')
              return (
                <>
                  {letters && <span className="sp-flag">-{letters}</span>}
                  {flags.C && <span className="sp-flag">-C 2</span>}
                </>
              )
            })()}
            <span className="sp-quote">&quot;</span>
            <input
              ref={inputRef}
              className="search-input"
              value={query}
              onChange={e => {
                const v = e.target.value.replace(/["\\]/g, '')
                setQuery(v)
              }}
              placeholder="search..."
              style={{ width: `${Math.max(80, query.length * 9.5)}px` }}
            />
            <span className="sp-quote">&quot;</span>
            <span className="sp-scope">./posts/</span>
            {!query && <span className="search-cursor" />}
          </div>

          {/* meta */}
          {q && (
            <div className="search-meta">
              <span><span className="ok">✓</span> matched {totalMatches} lines in {results.length} files · {(Math.random() * 0.05 + 0.02).toFixed(2)}s</span>
              <div style={{ flex: 1 }} />
              <span>sort: <span style={{ color: 'var(--ink)', textDecoration: 'underline' }}>relevance</span></span>
            </div>
          )}

          {!q && (
            <div className="search-meta">
              <span style={{ color: 'var(--ink-mute)' }}>type to search...</span>
            </div>
          )}

          {/* Results */}
          <div className="search-results">
            {results.map(p => {
              const lines = matchLines(p)
              return (
                <div key={p.slug}>
                  <div className="search-file-header">
                    <Link href={`/post/${p.slug}`} className="search-file-link">
                      ./posts/{p.slug}.md
                    </Link>
                    <span className="search-file-meta">
                      · {lines.length} {lines.length === 1 ? 'match' : 'matches'} · {p.category ?? '회고'} · {p.date}
                    </span>
                  </div>
                  {lines.map((ln, i) => (
                    <div key={i} className="search-match-row">
                      {flags.n && <span className="search-match-num">{String(ln.n).padStart(3, ' ')}</span>}
                      {flags.n && <span className="search-match-sep">│</span>}
                      <span style={{
                        fontFamily: ln.kind === 'title' ? 'var(--kr)' : 'var(--mono)',
                        fontSize: ln.kind === 'title' ? 15 : 13,
                        fontWeight: ln.kind === 'title' ? 700 : 400,
                        color: ln.kind === 'context' ? 'var(--ink-mute)' : 'var(--ink)',
                        lineHeight: 1.5,
                      }}>
                        {ln.kind === 'context' ? ln.text : highlight(ln.text, raw)}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}

            {q && results.length === 0 && (
              <div style={{ marginTop: 24, color: 'var(--ink-mute)' }}>
                <span style={{ color: 'var(--red)' }}>✗</span> no matches.
              </div>
            )}

            <div className="search-exit">
              <span style={{ color: 'var(--accent)' }}>~/2realzoo</span> $ <span className="search-cursor" />
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="search-sidebar">
          <div>
            <div className="search-sidebar-title">{"// flags"}</div>
            {([
              { key: 'r', f: '-r', label: 'recursive' },
              { key: 'n', f: '-n', label: 'show line nr' },
              { key: 'i', f: '-i', label: 'ignore case' },
              { key: 'w', f: '-w', label: 'whole word' },
              { key: 'C', f: '-C 2', label: '2 lines context' },
            ] as const).map(o => {
              const on = flags[o.key]
              return (
                <div
                  key={o.f}
                  className="flag-row"
                  role="checkbox"
                  aria-checked={on}
                  tabIndex={0}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleFlag(o.key)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFlag(o.key) } }}
                >
                  <span className={`flag-check${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
                  <span style={{ fontWeight: on ? 600 : 400, fontFamily: 'var(--mono)', color: on ? 'var(--ink)' : 'var(--ink-mute)' }}>{o.f}</span>
                  <span className="flag-label">{o.label}</span>
                </div>
              )
            })}
          </div>

          <div>
            <div className="search-sidebar-title">{"// scope"}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', lineHeight: 1.8 }}>
              <div><span style={{ color: 'var(--mag)' }}>▸</span> ./posts/</div>
              <div style={{ color: 'var(--ink-mute)', paddingLeft: 14 }}>./about.md</div>
            </div>
          </div>

          <div>
            <div className="search-sidebar-title">{"// history"}</div>
            {history.map((h, i) => (
              <div
                key={h}
                className={`search-history-item${i === 0 ? ' active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setQuery(h.replace('grep "', '').replace('"', '').trim())}
              >
                <span className="hist-dollar">$</span> {h}
              </div>
            ))}
          </div>

          <div className="search-shortcuts">
            <div>↵ run · esc clear</div>
            <div>↑↓ history</div>
            <div>tab autocomplete</div>
          </div>
        </aside>
      </div>
    </>
  )
}
