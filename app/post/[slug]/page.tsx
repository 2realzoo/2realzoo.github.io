import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getAllSlugs, getPostBySlug, getAllPostsMeta } from '@/lib/posts'
import TabBar from '@/app/components/TabBar'
import GraphMini from '@/app/components/GraphMini'
import PostTOC, { type Heading } from '@/app/components/PostTOC'

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  const allPosts = getAllPostsMeta()
  const idx = allPosts.findIndex(p => p.slug === slug)
  const prev = idx < allPosts.length - 1 ? allPosts[idx + 1] : null
  const next = idx > 0 ? allPosts[idx - 1] : null

  function estimateReadingTime(content: string) {
    return Math.max(3, Math.round(content.split(/\s+/).length / 200))
  }

  // Extract headings for TOC — strip fenced code blocks first so that
  // `#` lines inside code examples are not counted as real headings.
  const contentForTOC = post.content
    .replace(/^```[\s\S]*?^```/gm, '')   // fenced code blocks
    .replace(/^~~~[\s\S]*?^~~~/gm, '')   // tilde fenced blocks
  const headings: Heading[] = []
  const headingRe = /^(#{1,3})\s+(.+)$/gm
  let m: RegExpExecArray | null
  let hCount = 0
  while ((m = headingRe.exec(contentForTOC)) !== null) {
    const rawText = m[2].replace(/[*_`]/g, '').trim()
    headings.push({ level: m[1].length, text: rawText, id: `h-${hCount++}` })
  }

  const readMins = estimateReadingTime(post.content)
  const wordCount = post.content.split(/\s+/).length

  // Counter must match the order headings appear in the rendered output.
  // Using a mutable ref inside the closure (server render is synchronous).
  let renderCount = 0
  const mdComponents: Components = {
    h1: ({ children }) => <h1 id={`h-${renderCount++}`}>{children}</h1>,
    h2: ({ children }) => <h2 id={`h-${renderCount++}`}>{children}</h2>,
    h3: ({ children }) => <h3 id={`h-${renderCount++}`}>{children}</h3>,
  }

  return (
    <>
      <TabBar />
      <div className="post-layout">
        {/* Left sidebar — TOC + meta */}
        <aside className="post-sidebar-left">
          <Link href="/" className="post-back-btn">← back</Link>

          {headings.length > 0 && (
            <div>
              <div className="sidebar-section-title">{'// contents'}</div>
              <PostTOC headings={headings} />
            </div>
          )}

          <div>
            <div className="sidebar-section-title">{'// meta'}</div>
            <div className="post-meta-list">
              date · <span className="meta-val">{post.date}</span><br />
              category · <span className="meta-cat">{post.category ?? '회고'}</span><br />
              reading · <span className="meta-val">{readMins} min</span><br />
              words · <span className="meta-val">{wordCount}</span>
            </div>
          </div>
        </aside>

        {/* Center — article */}
        <main className="post-main">
          <article className="post-article">
            <div className="post-header-meta">
              <span>[{slug.toUpperCase().slice(0, 8)}] · {post.date}</span>
              <span className="meta-cat">{post.category ?? '회고'}</span>
            </div>

            <h1 className="post-title">{post.title}</h1>
            {post.summary && (
              <div className="post-en-title" style={{ fontStyle: 'italic' }}>{post.summary.slice(0, 80)}</div>
            )}

            <div className="post-tags">
              {post.tags.map(t => (
                <Link key={t} href={`/tags?t=${t}`} className="post-tag" style={{ textDecoration: 'none' }}>#{t}</Link>
              ))}
            </div>

            <hr className="post-divider" />

            <div className="post-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Prev / Next */}
            {(prev || next) && (
              <nav className="post-nav">
                {prev ? (
                  <Link href={`/post/${prev.slug}`} className="post-nav-item">
                    <div className="post-nav-label">← prev</div>
                    <div className="post-nav-title">{prev.title}</div>
                  </Link>
                ) : <div />}
                {next ? (
                  <Link href={`/post/${next.slug}`} className="post-nav-item next">
                    <div className="post-nav-label">next →</div>
                    <div className="post-nav-title">{next.title}</div>
                  </Link>
                ) : <div />}
              </nav>
            )}
          </article>
        </main>

        {/* Right sidebar */}
        <aside className="post-sidebar-right">
          <div>
            <div className="sidebar-section-title">{'// local_graph'}</div>
            <GraphMini
              currentSlug={slug}
              posts={allPosts.map(p => ({ slug: p.slug, title: p.title, tags: p.tags, summary: p.summary }))}
              height={160}
            />
            <Link
              href="/graph"
              style={{ display: 'block', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-mute)', textDecoration: 'none', marginTop: 4 }}
            >
              full graph →
            </Link>
          </div>

          {allPosts.length > 1 && (
            <div>
              <div className="sidebar-section-title">{'// linked_notes'}</div>
              {allPosts.filter(p => p.slug !== slug).slice(0, 4).map(p => (
                <Link key={p.slug} href={`/post/${p.slug}`} className="linked-note">
                  <div className="linked-note-id">{p.date}</div>
                  <div className="linked-note-title">{p.title}</div>
                </Link>
              ))}
            </div>
          )}

          <div>
            <div className="sidebar-section-title">{'// actions'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link href="/" className="action-btn">← back to posts</Link>
              <Link href="/graph" className="action-btn">⌘G open graph</Link>
              <Link href={`/tags?t=${post.tags[0] ?? ''}`} className="action-btn primary">↗ related posts</Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
