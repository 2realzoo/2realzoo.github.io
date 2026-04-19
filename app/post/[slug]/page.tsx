import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getAllSlugs, getPostBySlug } from '@/lib/posts'
import type { Metadata } from 'next'

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
    title: `${post.title} | 2realzoo`,
    description: post.summary,
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  return (
    <main className="container post-content">
      <Link href="/" className="back-link">← 목록으로</Link>
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
