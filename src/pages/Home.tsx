import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface PostMeta {
  slug: string
  title: string
  date: string
  tags: string[]
  summary: string
}

export default function Home() {
  const [posts, setPosts] = useState<PostMeta[]>([])

  useEffect(() => {
    fetch('/posts.json')
      .then(r => r.json())
      .then(setPosts)
  }, [])

  return (
    <main className="container">
      <header className="site-header">
        <h1>2realzoo</h1>
        <p>개발 블로그</p>
      </header>

      <section className="post-list">
        {posts.map(post => (
          <article key={post.slug} className="post-card">
            <Link to={`/post/${post.slug}`}>
              <h2>{post.title}</h2>
            </Link>
            <div className="post-meta">
              <time>{post.date}</time>
              {post.tags.map(tag => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
            {post.summary && <p className="summary">{post.summary}</p>}
          </article>
        ))}
      </section>
    </main>
  )
}
