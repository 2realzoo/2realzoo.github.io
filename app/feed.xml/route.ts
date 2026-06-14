import { getAllPostsMeta } from '@/lib/posts'

// Statically emitted at build time (output: 'export').
export const dynamic = 'force-static'

const SITE_URL = 'https://2realzoo.github.io'
const SITE_TITLE = '2realzoo'
const SITE_DESC = '사내 AI 어시스턴트 / 챗봇을 만들며 부딪힌 문제와 정리한 노트.'

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// RSS pubDate must be RFC-822. Post dates are 'YYYY-MM-DD'.
function toRfc822(date: string) {
  return new Date(`${date}T00:00:00Z`).toUTCString()
}

export function GET() {
  const posts = getAllPostsMeta()
  const lastBuild = posts[0]?.date ? toRfc822(posts[0].date) : new Date(0).toUTCString()

  const items = posts
    .map(p => {
      const url = `${SITE_URL}/post/${p.slug}/`
      const categories = p.tags.map(t => `      <category>${escapeXml(t)}</category>`).join('\n')
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(p.date)}</pubDate>
      <description>${escapeXml(p.summary)}</description>
${categories}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>ko</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
