import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(process.cwd(), 'posts')

export interface PostMeta {
  slug: string
  title: string
  date: string
  tags: string[]
  summary: string
}

export interface PostData extends PostMeta {
  content: string
}

export function getAllPostsMeta(): PostMeta[] {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))

  const posts = files.map((file): PostMeta => {
    const slug = file.replace(/\.md$/, '')
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
    const { data } = matter(raw)

    return {
      slug,
      title: data.title ?? slug,
      date: data.date ? new Date(data.date).toISOString().slice(0, 10) : '',
      tags: data.tags ?? [],
      summary: data.summary ?? '',
    }
  })

  return posts.sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string): PostData {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.md`), 'utf-8')
  const { data, content } = matter(raw)

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ? new Date(data.date).toISOString().slice(0, 10) : '',
    tags: data.tags ?? [],
    summary: data.summary ?? '',
    content,
  }
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''))
}
