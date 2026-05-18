import { getAllSlugs, getPostBySlug, extractWikilinks } from '@/lib/posts'
import GraphClient, { type GraphPost, type GraphCategory } from './GraphClient'
import TabBar from '@/app/components/TabBar'

const CATEGORY_COLORS = [
  '#2a1aff',  // electric blue
  '#0a8a3a',  // green
  '#d8731d',  // amber
  '#8b1da0',  // magenta
  '#1d6dcc',  // blue
  '#c0392b',  // red
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

  const catSet = new Set(posts.map(p => p.cat))
  const categories: Record<string, GraphCategory> = {}
  let colorIdx = 0
  catSet.forEach(cat => {
    categories[cat] = {
      label: cat,
      color: CATEGORY_COLORS[colorIdx++ % CATEGORY_COLORS.length],
    }
  })

  return (
    <>
      <TabBar />
      <div className="graph-page">
        <GraphClient posts={posts} categories={categories} />
      </div>
    </>
  )
}
