import Link from 'next/link'
import { getAllPostsMeta } from '@/lib/posts'
import LandingNewsletter from './LandingNewsletter'
import './landing.css'
import type React from 'react'

// Mini graph data (static preview)
const GRAPH_NODES = [
  {x:40, y:40}, {x:90, y:70}, {x:140, y:30}, {x:170, y:80}, {x:200, y:45},
  {x:70, y:110}, {x:120, y:100}, {x:180, y:115}, {x:50, y:80},
]
const GRAPH_EDGES = [[0,1],[1,2],[2,3],[3,4],[1,5],[5,6],[6,7],[1,6],[0,8],[8,5]] as const

/** Render [[wikilinks]] in titles as accent italic spans */
function renderTitle(title: string): React.ReactNode {
  const parts = title.split(/\[\[([^\]]+)\]\]/)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} className="rl-acc">{part}</span>
      : part
  )
}

/** Format date for display */
function fmtDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`
}

export default function HomePage() {
  const posts = getAllPostsMeta()

  // Aggregate real tags from posts
  const tagCounts: Record<string, number> = {}
  posts.forEach(p => p.tags.forEach(t => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }))
  const realTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])

  // Aggregate real categories from posts
  const catCounts: Record<string, number> = {}
  posts.forEach(p => { if (p.category) catCounts[p.category] = (catCounts[p.category] ?? 0) + 1 })
  const sidebarCategories = Object.entries(catCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="rl-landing">

      {/* ── Nav ── */}
      <nav className="rl-nav">
        <div className="rl-nav-left">
          <a href="#list">글</a>
          <a href="#categories">주제</a>
          <Link href="/graph">그래프 뷰</Link>
          <a href="#about">소개</a>
          <a href="#">RSS</a>
        </div>
        <Link href="/" className="rl-brand">
          real<em>zoojin</em><span className="rl-dot" />
        </Link>
        <div className="rl-nav-right">
          <div className="rl-search">
            <span>글 검색</span>
            <span className="rl-kbd">⌘K</span>
          </div>
          <a className="rl-btn" href="#news">구독하기 ↗</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="rl-hero">
        <h1>
          현장에서 쓰는<br />
          <span className="rl-accent">AI 트랜스포메이션</span><br />
          노트.
        </h1>
        <div className="rl-hero-side">
          <div className="rl-eyebrow">The Blog · EST. 2023</div>
          <p>제품에 AI를 붙여 나가는 일을 하며 남기는 기록입니다. 주로 소프트웨어 엔지니어링, 가끔 LLM · ML 연구 리뷰. 데모와 출시 사이의 길고 지루한 중간 지점에서 배운 것들을 정리합니다.</p>
          <div className="rl-cta-row">
            {posts[0] && (
              <Link className="rl-btn" href={`/post/${posts[0].slug}`}>
                최근 글 읽기
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M4 12 L12 4 M6 4 H12 V10" />
                </svg>
              </Link>
            )}
            <Link className="rl-btn ghost" href="/graph">그래프 뷰 ↗</Link>
          </div>
        </div>
      </section>

      {/* ── Latest posts + Sidebar ── */}
      <section className="rl-latest-wrap">
        <div id="list">
          <div className="rl-latest-head">
            <h3>최신 글</h3>
            <div className="rl-latest-count">
              SHOWING {String(posts.length).padStart(2, '0')} · UPDATED {posts[0]?.date ?? ''}
            </div>
          </div>

          <div className="rl-post-list">
            {posts.length === 0 && (
              <div style={{ padding: '40px 0', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                아직 글이 없습니다 — posts/ 폴더에 .md 파일을 추가하세요
              </div>
            )}
            {posts.map((post, idx) => (
              <Link
                key={post.slug}
                href={`/post/${post.slug}`}
                className="rl-post-row"
              >
                <div className="rl-post-num">
                  № {String(posts.length - idx).padStart(3, '0')}
                </div>
                <div className="rl-post-body">
                  <h4>{renderTitle(post.title)}</h4>
                  {post.summary && <p>{post.summary}</p>}
                </div>
                <div className="rl-post-meta">
                  {post.category && (
                    <span className="cat">{post.category}</span>
                  )}
                  {!post.category && post.tags[0] && (
                    <span className="cat">{post.tags[0]}</span>
                  )}
                  <br />
                  {fmtDate(post.date)}
                </div>
                <span className="rl-post-arrow">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M4 12 L12 4 M6 4 H12 V10" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="rl-sidebar">

          {/* Categories */}
          {sidebarCategories.length > 0 && (
            <div id="categories">
              <h5>카테고리</h5>
              <div className="rl-cats">
                {sidebarCategories.map(([name, count]) => (
                  <a key={name} href="#list" className="rl-cat-row">
                    <span className="rl-cat-name">{name}</span>
                    <span className="rl-cat-cnt">{count}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {realTags.length > 0 && (
            <div>
              <h5>태그</h5>
              <div className="rl-tag-cloud">
                {realTags.map(([name, count]) => (
                  <a key={name} href="#list" className="rl-tag">
                    {name}<span className="rl-tag-ct">{count}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Author */}
          <div id="about">
            <h5>글쓴이</h5>
            <div className="rl-author">
              <div className="rl-author-top">
                <div className="rl-author-avatar">Z</div>
                <div>
                  <div className="rl-author-name">real<em>zoojin</em></div>
                  <div className="rl-author-role">Staff Eng · AI Platform</div>
                </div>
              </div>
              <p>중간 규모 SaaS에서 AI 기능을 만들고 있습니다. Obsidian 노트에 묵히는 설계 스케치, 평가 회고, 가끔 논문 재독 메모를 이곳에 옮겨 둡니다. 주로 소프트웨어 엔지니어링, 가끔 연구 쪽도.</p>
              <div className="rl-author-links">
                <a href="#">GitHub ↗</a>
                <a href="#">X ↗</a>
                <a href="#">CV ↗</a>
              </div>
            </div>
          </div>

          {/* Graph preview card */}
          <Link href="/graph" className="rl-graph-card">
            <h5 style={{ marginBottom: '10px' }}>지식 그래프</h5>
            <div className="rl-graph-mini">
              <svg width="100%" height="100%" viewBox="0 0 240 140">
                {GRAPH_EDGES.map(([a, b], i) => (
                  <line
                    key={i}
                    x1={GRAPH_NODES[a].x} y1={GRAPH_NODES[a].y}
                    x2={GRAPH_NODES[b].x} y2={GRAPH_NODES[b].y}
                    stroke="#D9D5CB" strokeWidth="1"
                  />
                ))}
                {GRAPH_NODES.map((n, i) => (
                  <circle
                    key={i}
                    cx={n.x} cy={n.y}
                    r={i === 1 ? 6 : i === 5 ? 5 : 3.5}
                    fill={i === 1 ? 'oklch(0.5 0.08 265)' : '#2A2A2E'}
                  />
                ))}
              </svg>
            </div>
            <h6>노트 사이의 연결을 탐색</h6>
            <p>
              Obsidian에서 쓰는 것처럼 글 사이의{' '}
              <span className="rl-wiki">{'[[wikilinks]]'}</span>를 시각화합니다.
            </p>
            <span className="rl-btn-sm">Open Graph ↗</span>
          </Link>

          {/* Newsletter */}
          <div id="news">
            <h5>뉴스레터</h5>
            <div className="rl-news">
              <h6>격주 화요일,<br />글 한 편<em> 씩</em>.</h6>
              <p>프로덕션에서의 AI에 대한 장문 노트. 툴 홍보 없음, 하이프 없음, 링크 모음집 없음.</p>
              <LandingNewsletter />
              <div className="rl-news-foot">UNSUB ANY TIME · NO TRACKING</div>
            </div>
          </div>

        </aside>
      </section>

      {/* ── Footer ── */}
      <footer className="rl-footer">
        <div className="rl-footer-top">
          <div>
            <div className="rl-footer-brand">real<em>zoojin</em></div>
            <div className="rl-footer-tagline">제품에 AI를 붙여 나가는 일을 하며 남기는 기록. 주로 소프트웨어, 가끔 연구.</div>
          </div>
          <div className="rl-footer-col">
            <h6>글</h6>
            <a href="#list">최신</a>
            <a href="#list">전체 보기</a>
          </div>
          <div className="rl-footer-col">
            <h6>주제</h6>
            {sidebarCategories.slice(0, 4).map(([name]) => (
              <a key={name} href="#list">{name}</a>
            ))}
          </div>
          <div className="rl-footer-col">
            <h6>다른 곳</h6>
            <Link href="/graph">그래프 뷰</Link>
            <a href="#">GitHub ↗</a>
            <a href="#">X ↗</a>
            <a href="#">RSS ↗</a>
          </div>
        </div>
        <div className="rl-footer-mid">
          <div>© 2026 realzoojin · CC-BY 4.0</div>
          <div className="center">Writing in Seoul</div>
          <div className="right">contact</div>
        </div>
        <div className="rl-footer-wordmark">realzoojin</div>
      </footer>

    </div>
  )
}
