import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getAllSlugs, getPostBySlug } from '@/lib/posts'
import type { Metadata } from 'next'
import type React from 'react'
import PostClient from './PostClient'
import './post.css'

// ── Utilities ──────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣\u3040-\u30FF-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
}

function getNodeText(node: React.ReactNode): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join('')
  if (typeof node === 'object' && 'props' in (node as object)) {
    return getNodeText((node as { props?: { children?: React.ReactNode } }).props?.children)
  }
  return ''
}

/** Extract H2 headings from raw markdown for the TOC */
function extractH2s(markdown: string): Array<{ id: string; text: string }> {
  const headings: Array<{ id: string; text: string }> = []
  const re = /^##\s+(.+)$/gm
  let m
  while ((m = re.exec(markdown)) !== null) {
    const raw = m[1]
      .replace(/\*{1,2}(.+?)\*{1,2}/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .trim()
    headings.push({ id: slugify(raw), text: raw })
  }
  return headings
}

/**
 * Pre-process Obsidian-flavored markdown:
 * - [[wikilink]] → [wikilink](wikilink:wikilink)
 * - #hashtag (preceded by space) → [#hashtag](hashtag:hashtag)
 */
function preprocessMarkdown(content: string): string {
  // Wikilinks
  content = content.replace(/\[\[([^\]]+)\]\]/g, '[$1](wikilink:$1)')
  // Inline hashtags (not at line start → avoids heading syntax)
  content = content.replace(
    /(?<=[ \t])#([a-zA-Z가-힣][a-zA-Z0-9가-힣_-]*)/g,
    '[#$1](hashtag:$1)'
  )
  return content
}

function formatDateKo(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[0]}. ${parts[1]}. ${parts[2]}`
}

function calcReadingTime(content: string): number {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))
}

// ── Markdown component overrides ────────────────────────────────────────────

const mdComponents: Components = {
  h2: ({ children, ...rest }) => {
    const text = getNodeText(children)
    return (
      <h2 id={slugify(text)} {...rest}>
        {children}
      </h2>
    )
  },
  h3: ({ children, ...rest }) => {
    const text = getNodeText(children)
    return (
      <h3 id={slugify(text)} {...rest}>
        {children}
      </h3>
    )
  },
  a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => {
    if (href?.startsWith('wikilink:')) {
      return <a className="rz-wikilink" href="#">{children}</a>
    }
    if (href?.startsWith('hashtag:')) {
      return <a className="rz-hashtag" href="#">{children}</a>
    }
    return (
      <a className="rz-link" href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  },
  pre: ({ children }) => <pre className="rz-code-block">{children}</pre>,
  // Remove the default 'table' wrapper — let article css handle it
}

// ── Route ──────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  return {
    title: `${post.title} — realzoojin`,
    description: post.deck ?? post.summary,
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  const headings = extractH2s(post.content)
  const processedContent = preprocessMarkdown(post.content)
  const readingTime = post.readingTime ?? calcReadingTime(post.content)
  const dateKo = formatDateKo(post.date)

  const hasStack = post.stack && Object.keys(post.stack).length > 0

  return (
    <div className="rz-post">
      {/* Topbar */}
      <header className="rz-topbar">
        <Link href="/" className="rz-brand">
          real<em>zoojin</em><span className="rz-dot" />
        </Link>
        <div className="rz-crumbs">
          <Link href="/">글</Link>
          {post.category && (
            <>
              <span className="sep">/</span>
              <span>{post.category}</span>
            </>
          )}
          <span className="sep">/</span>
          <span className="here">
            {post.issue ? `№ ${post.issue} · ` : ''}{post.title}
          </span>
        </div>
        <div className="rz-top-actions">
          <Link href="/graph" className="rz-btn">◌ 그래프 뷰</Link>
        </div>
      </header>

      {/* Three-column shell */}
      <div className="rz-shell">
        {/* Column 1: TOC — rendered by client component for interactivity */}
        <PostClient headings={headings} />

        {/* Column 2: Article */}
        <article>
          {/* Kicker */}
          {(post.category || post.issue) && (
            <div className="rz-kicker">
              {post.category && <span className="cat">{post.category}</span>}
              {post.issue && (
                <>
                  <span className="sep">·</span>
                  <span>Issue № {post.issue}</span>
                </>
              )}
              <span className="sep">·</span>
              <span>{readingTime} min read</span>
              {post.date && (
                <>
                  <span className="sep">·</span>
                  <span>Updated {post.date}</span>
                </>
              )}
            </div>
          )}

          {/* Title */}
          <h1 className="rz-title">{post.title}</h1>

          {/* Deck / subtitle */}
          {post.deck && <p className="rz-deck">{post.deck}</p>}

          {/* Byline */}
          <div className="rz-byline">
            <div className="rz-avatar">Z</div>
            <div className="rz-byline-who">
              <b>realzoojin</b><br />
              <span>{dateKo}</span>
            </div>
            {post.category && (
              <div className="rz-byline-loc">{post.category}</div>
            )}
          </div>

          {/* Markdown body */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={mdComponents}
          >
            {processedContent}
          </ReactMarkdown>
        </article>

        {/* Column 3: Meta sidebar */}
        <aside className="rz-meta-side">
          {/* Metadata */}
          <div className="rz-meta-block">
            <div className="rz-eyebrow">Metadata</div>
            {post.date && (
              <div className="rz-kv">
                <span className="rz-kv-label">Published</span>
                <span>{dateKo}</span>
              </div>
            )}
            <div className="rz-kv">
              <span className="rz-kv-label">Reading</span>
              <span>{readingTime} minutes</span>
            </div>
            {post.category && (
              <div className="rz-kv">
                <span className="rz-kv-label">Category</span>
                <span>{post.category}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="rz-meta-block">
              <div className="rz-eyebrow">Tags</div>
              <div className="rz-tags">
                {post.tags.map(tag => (
                  <a key={tag} href="#" className="rz-tag-pill">{tag}</a>
                ))}
              </div>
            </div>
          )}

          {/* Stack — optional, hidden when no stack frontmatter */}
          {hasStack && (
            <div className="rz-meta-block">
              <div className="rz-eyebrow">Stack</div>
              {Object.entries(post.stack!).map(([key, val]) => (
                <div key={key} className="rz-kv">
                  <span className="rz-kv-label">{key}</span>
                  <span>{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="rz-meta-block">
            <div className="rz-eyebrow">Share</div>
            <button className="rz-share-btn">
              링크 복사 <span className="rz-share-mk">⌘L</span>
            </button>
            <button className="rz-share-btn">
              RSS로 보기 <span className="rz-share-mk">↗</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
