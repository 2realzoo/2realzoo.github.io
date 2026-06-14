import TabBar from '@/app/components/TabBar'

export default function AboutPage() {
  const stroke = 'var(--ink)'
  const mag = 'var(--mag)'
  const accent = 'var(--accent)'

  return (
    <>
      <TabBar />
      <div className="about-page">
        {/* Left column */}
        <div>
          <div className="about-eyebrow">about</div>
          <div className="about-heading">
            <span className="about-heading-pixel">about</span>
            <span className="about-heading-serif">me!</span>
          </div>

          <h2 className="about-name-serif">2realzoo</h2>
          <p className="about-bio">
            안녕하세요. 사내에서 쓰이는 AI 어시스턴트 서비스를 만드는 LLM 엔지니어입니다.
            주로 챗봇 쪽 업무를 맡고 있어요.
            <br /><br />
            지금은 제약회사의 MR(영업 담당자) 어시스턴트 애플리케이션을 개발하고 있습니다.
            여기엔 그 과정에서 부딪힌 문제와 정리한 노트를 올립니다.
          </p>

          <div className="about-section-title">SKILLS</div>
          <div className="skills-list">
            {['Python', 'PyTorch', 'TypeScript', 'Next.js', 'Postgres', 'Redis', 'RAG', 'Vector DB', 'LLM Eval', 'Docker'].map(s => (
              <span key={s} className="skill-tag">{s}</span>
            ))}
          </div>

          <div className="about-section-title">WORK</div>
          <div className="work-list">
            <div className="work-item">
              <div className="work-date">2025.08–</div>
              <div className="work-company">제약회사 (anonymized)</div>
              <div className="work-role">LLM Engineer · MR 어시스턴트 애플리케이션 개발</div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Portrait window */}
          <div className="about-window">
            <div className="about-window-chrome">
              <span>MEET-2REALZOO</span>
              <span style={{ cursor: 'pointer' }}>✕</span>
            </div>
            <div className="portrait-bg">
              {/* Pixel face placeholder */}
              <svg width="180" height="220" viewBox="0 0 180 220" style={{ display: 'block' }}>
                <rect x="40" y="20" width="100" height="100" fill="#e8c9a8" stroke={stroke} strokeWidth="2" />
                <rect x="60" y="50" width="8" height="8" fill={stroke} />
                <rect x="112" y="50" width="8" height="8" fill={stroke} />
                <rect x="78" y="86" width="24" height="6" fill={mag} />
                <rect x="30" y="120" width="120" height="80" fill={accent} stroke={stroke} strokeWidth="2" />
                <rect x="60" y="140" width="60" height="6" fill="#fff" />
                <rect x="60" y="156" width="40" height="6" fill="#fff" />
              </svg>
            </div>
          </div>

          {/* Socials window */}
          <div className="about-window">
            <div className="about-window-chrome">
              <span>SOCIALS</span>
              <span style={{ cursor: 'pointer' }}>✕</span>
            </div>
            <div className="socials-list">
              <a href="https://github.com/2realzoo" target="_blank" rel="noreferrer" className="social-item">
                <span className="social-glyph" style={{ background: '#1a1a1a' }}>GH</span>
                @2realzoo
              </a>
              <a href="mailto:realzoojin@gmail.com" className="social-item">
                <span className="social-glyph" style={{ background: '#8b1da0' }}>✉</span>
                realzoojin@gmail.com
              </a>
              <a href="/feed.xml" className="social-item">
                <span className="social-glyph" style={{ background: '#2a1aff' }}>↻</span>
                rss / atom feed
              </a>
            </div>
          </div>

          {/* Currently */}
          <div className="currently-box">
            <div className="currently-title">currently</div>
            ▸ building: 제약회사 MR 어시스턴트<br />
            ▸ exploring: 사내 챗봇 UX & RAG<br />
            ▸ writing: LLM·챗봇 개발 노트
          </div>
        </div>
      </div>
    </>
  )
}
