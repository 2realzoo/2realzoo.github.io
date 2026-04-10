/**
 * posts/*.md 를 읽어서 public/posts.json (목록) 과
 * public/posts/{slug}.json (개별) 으로 변환한다.
 */
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.resolve('posts')
const OUT_DIR = path.resolve('public/posts')

fs.mkdirSync(OUT_DIR, { recursive: true })

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))

const index = []

for (const file of files) {
  const slug = file.replace(/\.md$/, '')
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
  const { data, content } = matter(raw)

  const post = {
    slug,
    title: data.title ?? slug,
    date: data.date ? new Date(data.date).toISOString().slice(0, 10) : '',
    tags: data.tags ?? [],
    summary: data.summary ?? '',
    content,
  }

  fs.writeFileSync(path.join(OUT_DIR, `${slug}.json`), JSON.stringify(post, null, 2))
  index.push({ slug, title: post.title, date: post.date, tags: post.tags, summary: post.summary })
}

// 날짜 내림차순 정렬
index.sort((a, b) => b.date.localeCompare(a.date))
fs.writeFileSync(path.resolve('public/posts.json'), JSON.stringify(index, null, 2))

console.log(`✓ ${files.length}개 포스트 빌드 완료`)
