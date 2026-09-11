'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import TabBar from '@/app/components/TabBar'

interface PostMeta {
  slug: string
  title: string
  date: string
  tags: string[]
  summary: string
  category?: string
}

function TagsContent() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<PostMeta[]>([])
  const [activeTag, setActiveTag] = useState<string>('')

  useEffect(() => {
    fetch('/posts.json')
      .then(r => r.json())
      .then((data: PostMeta[]) => {
        setPosts(data)
        const t = searchParams.get('t') || ''
        setActiveTag(t)
      })
  }, [searchParams])

  const tagCount: Record<string, number> = {}
  posts.forEach(p => p.tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1 }))
  const allTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1])
  const maxCount = allTags[0]?.[1] || 1

  const filtered = activeTag ? posts.filter(p => p.tags.includes(activeTag)) : posts

  function estimateReadingTime(summary: string) {
    return `${Math.max(3, Math.round(summary.split(/\s+/).length / 200) + 3)} min`
  }

  return (
    <div className="tags-page">
      <div className="page-heading">
        <span className="page-heading-pixel">tags</span>
        <span className="page-heading-serif">· {allTags.length} total</span>
      </div>

      <div className="tags-layout">
        <div>
          <div className="tag-cloud">
            <a
              className={`tag-cloud-item${!activeTag ? ' active' : ''}`}
              onClick={() => setActiveTag('')}
              style={{ fontSize: 14 }}
            >
              #all<sup>{posts.length}</sup>
            </a>
            {allTags.map(([name, count]) => {
              const sz = 13 + (count / maxCount) * 22
              return (
                <a
                  key={name}
                  className={`tag-cloud-item${activeTag === name ? ' active' : ''}`}
                  onClick={() => setActiveTag(name === activeTag ? '' : name)}
                  style={{ fontSize: sz }}
                >
                  #{name}<sup>{count}</sup>
                </a>
              )
            })}
          </div>

          <div className="tag-posts-box">
            <div className="tag-posts-header">
              <span className="tag-posts-title">
                posts tagged{' '}
                <span style={{ color: 'var(--accent)' }}>
                  {activeTag ? `#${activeTag}` : 'all'}
                </span>
              </span>
              <span className="tag-posts-count">{filtered.length} entries</span>
            </div>
            {filtered.map(p => (
              <Link key={p.slug} href={`/post/${p.slug}`} className="tag-post-row">
                <div>
                  <div className="tag-post-meta">[{p.slug.toUpperCase().slice(0,8)}] {p.date} · {p.category ?? '회고'}</div>
                  <div className="tag-post-title">{p.title}</div>
                  <div className="tag-post-en" style={{ fontStyle: 'italic' }}>{p.summary}</div>
                </div>
                <span className="tag-post-reading">{estimateReadingTime(p.summary)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Frequency sidebar */}
        <aside>
          <div className="sidebar-box">
            <div className="sidebar-box-header">
              <span className="sidebar-box-title">{"// frequency"}</span>
            </div>
            <div className="freq-chart">
              {allTags.slice(0, 12).map(([name, count]) => {
                const w = Math.round((count / maxCount) * 20)
                return (
                  <div key={name} className="freq-row">
                    <span className="freq-name">#{name}</span>
                    <span>
                      <span style={{ color: 'var(--accent)' }}>{'▮'.repeat(w)}</span>
                      <span style={{ color: 'var(--ink-mute)' }}>{'·'.repeat(20 - w)}</span>
                    </span>
                    <span style={{ color: 'var(--ink-mute)', textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function TagsPage() {
  return (
    <>
      <TabBar />
      <Suspense fallback={<div style={{ padding: 40, fontFamily: 'var(--mono)', color: 'var(--ink-mute)' }}>loading tags...</div>}>
        <TagsContent />
      </Suspense>
    </>
  )
}
