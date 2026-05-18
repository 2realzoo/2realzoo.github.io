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
            안녕하세요. ML/Backend 사이를 오가는 엔지니어입니다.
            서울에서 일하고, 매주 한 편씩 회고와 노트를 씁니다.
            <br /><br />
            지금은 사내 RAG 파이프라인의 평가셋과 비용 최적화, 사이드로 만드는 작은 SaaS의 결제, 그리고 Mamba 재현을 천천히 진행하고 있어요.
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
              <div className="work-date">2025–</div>
              <div className="work-company">ML/AI Startup</div>
              <div className="work-role">Senior ML Engineer · RAG infra & evals</div>
            </div>
            <div className="work-item">
              <div className="work-date">2022–2025</div>
              <div className="work-company">Backend Engineer</div>
              <div className="work-role">Recommendations team</div>
            </div>
            <div className="work-item">
              <div className="work-date">2020–2022</div>
              <div className="work-company">CS Graduate</div>
              <div className="work-role">MS in Machine Learning</div>
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
            ▸ writing: RAG eval 시리즈<br />
            ▸ reading: Designing ML Systems<br />
            ▸ building: side SaaS (billing phase)
          </div>
        </div>
      </div>
    </>
  )
}
