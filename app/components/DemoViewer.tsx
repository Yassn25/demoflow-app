'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Demo, Hotspot } from '@/lib/supabase'

interface DemoViewerProps {
  demo: Demo
  linkId?: string
  vars?: Record<string, string>
}

export default function DemoViewer({ demo, linkId, vars = {} }: DemoViewerProps) {
  const [currentStep, setCurrentStep]     = useState(0)
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  const sessionRef    = useRef<string | null>(null)
  const stepStartTime = useRef<number>(Date.now())
  const completedRef  = useRef(false)

  const step  = demo.steps[currentStep]
  const total = demo.steps.length

  function t(text: string | undefined): string {
    if (!text) return ''
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
  }

  const track = useCallback((eventType: string, extra: Record<string, unknown> = {}) => {
    if (!sessionRef.current) return
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: eventType, demo_id: demo.id, session_id: sessionRef.current, ...extra }),
    }).catch(() => {})
  }, [demo.id])

  useEffect(() => {
    const storageKey = `demoflow_ses_${demo.id}`
    const existing   = sessionStorage.getItem(storageKey)
    if (existing) { sessionRef.current = existing; return }

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'session_start', demo_id: demo.id, link_id: linkId ?? null }),
    })
      .then(r => r.json())
      .then(({ session_id }) => {
        if (!session_id) return
        sessionRef.current = session_id
        sessionStorage.setItem(storageKey, session_id)
        stepStartTime.current = Date.now()
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo.id])

  const goTo = useCallback((index: number) => {
    if (index === currentStep || transitioning) return
    const timeSpent = Date.now() - stepStartTime.current
    track('step_view', { step_index: index, time_spent_ms: timeSpent })
    if (index === total - 1 && !completedRef.current) {
      completedRef.current = true
      track('demo_complete', { time_spent_ms: timeSpent })
    }
    stepStartTime.current = Date.now()
    setTransitioning(true)
    setActiveHotspot(null)
    setTimeout(() => { setCurrentStep(index); setTransitioning(false) }, 220)
  }, [currentStep, transitioning, total, track])

  const prev = () => goTo(Math.max(0, currentStep - 1))
  const next = () => goTo(Math.min(total - 1, currentStep + 1))

  function handleHotspotToggle(hs: Hotspot) {
    const isOpening = activeHotspot?.id !== hs.id
    setActiveHotspot(isOpening ? hs : null)
    if (isOpening) track('hotspot_click', { step_index: currentStep, hotspot_id: hs.id })
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'Escape')     setActiveHotspot(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, transitioning])

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 5L8 2L13 5V11L8 14L3 11V5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
            </svg>
          </div>
          <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>{t(demo.title)}</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{currentStep + 1} / {total}</span>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 28 }}>
        <div style={{ position: 'relative', maxWidth: '900px', width: '100%', opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(8px)' : 'translateY(0)', transition: 'opacity 0.22s ease, transform 0.22s ease' }} onClick={() => setActiveHotspot(null)}>
          <img src={step.screenshotUrl} alt={`Étape ${currentStep + 1}`} style={{ width: '100%', display: 'block', borderRadius: 12, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.06)' }} />
          {step.hotspots.map((hs) => (
            <HotspotDot key={hs.id} hotspot={hs} isActive={activeHotspot?.id === hs.id} onToggle={handleHotspotToggle} interpolate={t} />
          ))}
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prev} disabled={currentStep === 0} style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: currentStep === 0 ? 'rgba(255,255,255,0.2)' : '#FAFAFA', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>←</button>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {demo.steps.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ width: i === currentStep ? 24 : 8, height: 8, borderRadius: 100, border: 'none', background: i === currentStep ? '#4F46E5' : 'rgba(255,255,255,0.18)', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', padding: 0 }} />
            ))}
          </div>
          <button onClick={next} disabled={currentStep === total - 1} style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: currentStep === total - 1 ? 'rgba(255,255,255,0.03)' : '#4F46E5', color: currentStep === total - 1 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: currentStep === total - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>→</button>
        </nav>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center' }}>← → pour naviguer · ESC pour fermer les tooltips</p>
      </main>

      <footer style={{ textAlign: 'center', padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>Créé avec <strong style={{ color: 'rgba(255,255,255,0.35)' }}>DemoFlow</strong></span>
      </footer>
    </div>
  )
}

function HotspotDot({ hotspot, isActive, onToggle, interpolate }: { hotspot: Hotspot; isActive: boolean; onToggle: (h: Hotspot) => void; interpolate: (s: string) => string }) {
  const title = interpolate(hotspot.title)
  const desc  = interpolate(hotspot.description)
  return (
    <div style={{ position: 'absolute', left: `${hotspot.x}%`, top: `${hotspot.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }} onClick={(e) => { e.stopPropagation(); onToggle(hotspot) }}>
      <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', background: '#4F46E5', opacity: 0.2, animation: isActive ? 'none' : 'ping 2s ease-out infinite' }} />
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: isActive ? '#fff' : '#4F46E5', border: `2px solid ${isActive ? '#4F46E5' : '#fff'}`, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform: isActive ? 'scale(1.2)' : 'scale(1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ color: isActive ? '#4F46E5' : '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>{isActive ? '×' : '+'}</span>
      </div>
      {isActive && title && (
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translate(-50%, -10px)', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px', minWidth: 220, maxWidth: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'tooltipIn 0.2s cubic-bezier(0.34,1.56,0.64,1)', pointerEvents: 'none' }}>
          <p style={{ color: '#FAFAFA', fontSize: 13, fontWeight: 600, marginBottom: desc ? 6 : 0, lineHeight: 1.4 }}>{title}</p>
          {desc && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.55 }}>{desc}</p>}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.12)' }} />
        </div>
      )}
    </div>
  )
}
