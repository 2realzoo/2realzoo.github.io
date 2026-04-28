'use client'

import { useState } from 'react'

export default function LandingNewsletter() {
  const [done, setDone] = useState(false)
  return (
    <div className="rl-news-form">
      <input
        type="email"
        className="rl-news-input"
        placeholder="you@work.com"
        disabled={done}
      />
      <button
        type="button"
        className="rl-news-submit"
        onClick={() => setDone(true)}
      >
        {done ? '전송 완료 ✓' : '구독'}
      </button>
    </div>
  )
}
