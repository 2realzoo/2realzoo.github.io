import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PostData {
  slug: string
  title: string
  date: string
  tags: string[]
  content: string
}

export default function Post() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostData | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`/posts/${slug}.json`)
      .then(r => r.json())
      .then(setPost)
  }, [slug])

  if (!post) return <div className="container">Loading...</div>

  return (
    <main className="container post-content">
      <Link to="/" className="back-link">← 목록으로</Link>
      <article>
        <header>
          <h1>{post.title}</h1>
          <div className="post-meta">
            <time>{post.date}</time>
            {post.tags.map(tag => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        </header>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </article>
    </main>
  )
}
