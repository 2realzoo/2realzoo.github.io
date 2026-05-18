import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const postsDir = join(root, 'posts')
const outFile = join(root, 'public', 'posts.json')

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { data: {}, content: raw }
  const fm = match[1]
  const data = {}
  for (const line of fm.split('\n')) {
    const [k, ...v] = line.split(':')
    if (!k) continue
    const val = v.join(':').trim()
    if (val.startsWith('[')) {
      try { data[k.trim()] = JSON.parse(val.replace(/'/g, '"')) } catch { data[k.trim()] = [] }
    } else {
      data[k.trim()] = val.replace(/^["']|["']$/g, '')
    }
  }
  return { data, content: raw.slice(match[0].length).trim() }
}

const files = readdirSync(postsDir).filter(f => f.endsWith('.md'))
const posts = files.map(file => {
  const slug = file.replace(/\.md$/, '')
  const raw = readFileSync(join(postsDir, file), 'utf-8')
  const { data } = parseFrontmatter(raw)
  return {
    slug,
    title: data.title || slug,
    date: data.date ? new Date(data.date).toISOString().slice(0, 10) : '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    summary: data.summary || '',
    category: data.category || undefined,
  }
}).sort((a, b) => b.date.localeCompare(a.date))

writeFileSync(outFile, JSON.stringify(posts, null, 2))
console.log(`✓ generated public/posts.json (${posts.length} posts)`)
