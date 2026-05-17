import { getAllSlugs, getPostBySlug, extractWikilinks } from '@/lib/posts'
import GraphClient, { type GraphPost, type GraphCategory } from './GraphClient'

const CATEGORY_COLORS = [
  'oklch(0.5 0.08 265)',   // blue-purple
  'oklch(0.55 0.09 145)',  // green
  'oklch(0.55 0.1 40)',    // orange
  'oklch(0.55 0.08 310)',  // pink
  'oklch(0.55 0.05 90)',   // yellow-green
  'oklch(0.5 0.1 200)',    // teal
  'oklch(0.5 0.09 350)',   // red
]

export default function GraphPage() {
  const slugs = getAllSlugs()
  const slugSet = new Set(slugs)

  const posts: GraphPost[] = slugs.map(slug => {
    const post = getPostBySlug(slug)
    const rawLinks = extractWikilinks(post.content)
    const links = [...new Set(rawLinks.filter(l => slugSet.has(l) && l !== slug))]
    return {
      id: slug,
      title: post.title,
      cat: post.category ?? 'uncategorized',
      tags: post.tags,
      links,
      summary: post.summary,
      slug,
    }
  })

  // Derive categories with stable color assignment
  const catSet = new Set(posts.map(p => p.cat))
  const categories: Record<string, GraphCategory> = {}
  let colorIdx = 0
  catSet.forEach(cat => {
    categories[cat] = {
      label: cat,
      color: CATEGORY_COLORS[colorIdx++ % CATEGORY_COLORS.length],
    }
  })

  return <GraphClient posts={posts} categories={categories} />
}
