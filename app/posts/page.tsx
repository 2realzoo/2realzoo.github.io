import Link from 'next/link'
import TabBar from '@/app/components/TabBar'
import { getAllPostsMeta } from '@/lib/posts'

function estimateReadingTime(summary: string) {
  return `${Math.max(3, Math.round(summary.split(/\s+/).length / 200) + 3)} min`
}

export default function PostsPage() {
  const posts = getAllPostsMeta()

  return (
    <>
      <TabBar />
      <div style={{ padding: '44px 56px' }}>
        <div className="page-heading">
          <span className="page-heading-pixel">posts</span>
          <span className="page-heading-serif">· {posts.length} entries</span>
        </div>

        <div style={{ display: 'grid', gap: 10, maxWidth: 840 }}>
          {posts.map((post, i) => (
            <Link key={post.slug} href={`/post/${post.slug}`} className={`post-card${i === 0 ? ' featured' : ''}`}>
              <div className="post-card-meta">
                <span>[{String(i + 1).padStart(2, '0')}] {post.date}</span>
                <span className="post-card-meta-cat">{post.category ?? '회고'}</span>
              </div>
              <h2 className="post-card-title">{post.title}</h2>
              <p className="post-card-excerpt">{post.summary}</p>
              <div className="post-card-footer">
                <div className="post-card-tags">
                  {post.tags.slice(0, 3).map(t => (
                    <span key={t} className="post-tag">#{t}</span>
                  ))}
                </div>
                <span className="post-card-reading">{estimateReadingTime(post.summary)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
