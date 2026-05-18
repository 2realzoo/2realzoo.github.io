import Link from 'next/link'
import TabBar from './components/TabBar'
import { getAllPostsMeta, PostMeta } from '@/lib/posts'

const ASCII_LOGO = ` ████████  ██████   ███████   █████   ██       ███████   ███████   ███████
 ██     ██ ██   ██  ██       ██   ██  ██           ██   ██   ██  ██     ██
    ██     █████    ███████  ███████  ██        ███     ██   ██  ██     ██
   ██      ██   ██  ██       ██   ██  ██       ██       ██   ██  ██     ██
 ████████  ██   ██  ███████  ██   ██  ███████  ███████   ███████   ███████`

function estimateReadingTime(summary: string): string {
  const words = summary.split(/\s+/).length
  const mins = Math.max(3, Math.round(words / 200) + 3)
  return `${mins} min`
}

function TagFreqBar({ tags, posts }: { tags: string[], posts: PostMeta[] }) {
  const tagCount: Record<string, number> = {}
  posts.forEach(p => p.tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1 }))
  const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const max = sorted[0]?.[1] || 1

  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
      {sorted.map(([name, count]) => {
        const w = Math.round((count / max) * 16)
        return (
          <div key={name} className="tag-freq-row">
            <span className="tag-freq-name">#{name}</span>
            <span>
              <span className="tag-freq-bar-filled">{'▮'.repeat(w)}</span>
              <span className="tag-freq-bar-empty">{'·'.repeat(16 - w)}</span>
            </span>
            <span className="tag-freq-count">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function Home() {
  const posts = getAllPostsMeta()
  const featured = posts[0]
  const rest = posts.slice(1, 3)

  return (
    <>
      <TabBar />

      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-cmd">
          <span className="cmd-accent">$</span>{' '}
          cat{' '}
          <span style={{ color: 'var(--ink)' }}>~/2realzoo/README.md</span>
        </div>
        <div className="home-hero-ascii">{ASCII_LOGO}</div>
        <div className="home-hero-sub">
          <div>
            <div className="home-hero-tagline">field notes from an ML/Backend engineer.</div>
            <div className="home-hero-desc">
              모델보다 평가셋, 추론보다 파이프라인을 더 좋아합니다. 매주 한 편의 회고와 한 달에 한 편의 논문 정리.
            </div>
          </div>
          <div className="home-hero-stats">
            {'// '}{posts.length}{' entries'}<br />
            {'// '}{Array.from(new Set(posts.flatMap(p => p.tags))).length}{' tags'}<br />
            {'// since 2024'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="home-body">
        {/* Posts */}
        <div className="home-posts">
          <div className="home-posts-header">
            <div>
              <span className="home-posts-title">LATEST</span>
              <span className="home-posts-title-serif">posts</span>
            </div>
            <span className="home-posts-count">showing 1–{Math.min(3, posts.length)} of {posts.length}</span>
          </div>

          {featured && (
            <Link href={`/post/${featured.slug}`} className="post-card featured">
              <div className="post-card-meta">
                <span>[{featured.slug.toUpperCase().slice(0, 6)}] {featured.date}</span>
                <span className="post-card-meta-cat">{featured.category ?? '회고'}</span>
              </div>
              <h2 className="post-card-title">{featured.title}</h2>
              <div className="post-card-en" style={{ fontStyle: 'italic' }}>{featured.summary.slice(0, 60)}</div>
              <p className="post-card-excerpt">{featured.summary}</p>
              <div className="post-card-footer">
                <div className="post-card-tags">
                  {featured.tags.slice(0, 3).map(t => (
                    <span key={t} className="post-tag">#{t}</span>
                  ))}
                </div>
                <span className="post-card-reading">{estimateReadingTime(featured.summary)}</span>
              </div>
            </Link>
          )}

          <div className="posts-grid">
            {rest.map(post => (
              <Link key={post.slug} href={`/post/${post.slug}`} className="post-card">
                <div className="post-card-meta">
                  <span>{post.date}</span>
                  <span className="post-card-meta-cat">{post.category ?? '회고'}</span>
                </div>
                <h3 className="post-card-title">{post.title}</h3>
                <p className="post-card-excerpt">{post.summary}</p>
                <div className="post-card-footer">
                  <div className="post-card-tags">
                    {post.tags.slice(0, 2).map(t => (
                      <span key={t} className="post-tag">#{t}</span>
                    ))}
                  </div>
                  <span className="post-card-reading">{estimateReadingTime(post.summary)}</span>
                </div>
              </Link>
            ))}
          </div>

          {posts.length > 3 && (
            <Link
              href="/posts"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--mono)',
                fontSize: 12,
                color: 'var(--ink-mute)',
                textDecoration: 'none',
                padding: '6px 0',
              }}
            >
              $ ls posts/ <span style={{ color: 'var(--accent)' }}>→ {posts.length} entries</span>
            </Link>
          )}
        </div>

        {/* Sidebar */}
        <aside className="home-sidebar">
          {/* Terminal command box */}
          <div className="sidebar-cmd">
            <div><span className="cmd-dollar">$</span> blog --sort date --desc</div>
            <div className="cmd-ok">→ matched {posts.length} entries.</div>
            <div>
              <span className="cmd-dollar">$</span> filter{' '}
              <span className="cmd-tag">#llm</span>{' '}
              <span className="cmd-tag2">#rag</span>
            </div>
            <div className="cmd-ok">→ matched {posts.filter(p => p.tags.some(t => ['llm','rag'].includes(t))).length} entries.</div>
          </div>

          {/* Mini graph */}
          <div className="sidebar-box">
            <div className="sidebar-box-header">
              <span className="sidebar-box-title">{'// graph'}</span>
              <span className="sidebar-box-sub">{posts.length} nodes</span>
            </div>
            <div className="graph-mini-placeholder">
              <Link href="/graph" style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 11 }}>
                open graph →
              </Link>
            </div>
          </div>

          {/* Tag frequency */}
          <div className="sidebar-box">
            <div className="sidebar-box-header">
              <span className="sidebar-box-title">{'// tag_freq'}</span>
              <span className="sidebar-box-sub">top 6</span>
            </div>
            <TagFreqBar tags={[]} posts={posts} />
          </div>
        </aside>
      </div>
    </>
  )
}
