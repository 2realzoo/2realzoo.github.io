import Link from 'next/link'
import TabBar from './components/TabBar'
import GraphMini from './components/GraphMini'
import MinecraftAvatar from './components/MinecraftAvatar'
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
        <div className="home-hero-sub">
          <div className="home-hero-ascii">{ASCII_LOGO}</div>
          <div className="home-hero-stats">
            {'// '}{posts.length}{' entries'}<br />
            {'// '}{Array.from(new Set(posts.flatMap(p => p.tags))).length}{' tags'}<br />
            {'// since 2024'}
          </div>
        </div>
        <div className="home-hero-tagline">field notes from an AI engineer.</div>
      </div>

      {/* About */}
      <div className="about-page home-about" id="about">
        <div>
          <div className="home-posts-header">
            <div>
              <span className="home-posts-title">ABOUT</span>
              <span className="home-posts-title-serif">me</span>
            </div>
          </div>

          <p className="about-bio">
            안녕하세요. 회사 안에서 쓰이는 LLM 어시스턴트를 만드는 엔지니어입니다.
            챗봇과 그 뒤에 붙는 RAG 파이프라인이 주로 맡는 영역이에요.
            <br /><br />
            제약, 자산운용처럼 도메인은 바뀌어도 부딪히는 문제는 비슷했습니다.
            문서를 어떻게 쪼갤지, 뽑아낸 답이 맞는지 어떻게 확인할지.
            여기엔 그 과정에서 생긴 노하우를 올립니다.
          </p>

          <div className="about-section-title">SKILLS</div>
          <div className="skills-list">
            {['Python', 'PyTorch', 'TypeScript', 'Next.js', 'Postgres', 'Redis', 'RAG', 'Vector DB', 'LLM Eval', 'Docker'].map(s => (
              <span key={s} className="skill-tag">{s}</span>
            ))}
          </div>

          <div className="about-section-title">WORK</div>
          <div className="work-list">
            <div className="work-item">
              <div className="work-date">2026.07–2026.08</div>
              <div className="work-company">자산운용사</div>
              <div className="work-role">LLM Engineer · 수익자 챗봇 서비스 PoC 개발</div>
            </div>
            <div className="work-item">
              <div className="work-date">2025.08–2026.06</div>
              <div className="work-company">제약회사</div>
              <div className="work-role">LLM Engineer · MR 어시스턴트 애플리케이션 개발</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Portrait — GitHub avatar, always current */}
        <div className="about-window">
          <div className="about-window-chrome">
            <span>MEET-2REALZOO</span>
          </div>
          <div className="about-portrait">
            {/* github.com/<user>.png is prettier but its 302 carries no CORS
                header, so the texture load fails. The avatars host does send
                one, and /u/<id> always serves the current profile photo. */}
            <MinecraftAvatar src="https://avatars.githubusercontent.com/u/115965399?s=400&v=4" />
          </div>
        </div>

        {/* Socials */}
        <div className="about-window">
          <div className="about-window-chrome">
            <span>SOCIALS</span>
          </div>
          <div className="socials-list">
            <a href="https://github.com/2realzoo" target="_blank" rel="noreferrer" className="social-item">
              <span className="social-glyph" style={{ background: '#1a1a1a' }}>GH</span>
              @2realzoo
            </a>
            <a href="mailto:realzoojin@gmail.com" className="social-item">
              <span className="social-glyph" style={{ background: '#8b1da0' }}>✉</span>
              realzoojin@gmail.com
            </a>
            <a href="/feed.xml" className="social-item">
              <span className="social-glyph" style={{ background: '#2a1aff' }}>↻</span>
              rss / atom feed
            </a>
          </div>
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
          {/* Mini graph */}
          <div className="sidebar-box">
            <div className="sidebar-box-header">
              <span className="sidebar-box-title">{'// graph'}</span>
              <span className="sidebar-box-sub">{posts.length} nodes</span>
            </div>
            <GraphMini
              posts={posts.map(p => ({ slug: p.slug, title: p.title, tags: p.tags, summary: p.summary }))}
              height={110}
            />
            <Link
              href="/graph"
              style={{ display: 'block', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-mute)', textDecoration: 'none', marginTop: 4 }}
            >
              full graph →
            </Link>
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
