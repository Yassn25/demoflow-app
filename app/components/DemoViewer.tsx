'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Demo, Hotspot } from '@/lib/supabase'

interface DemoViewerProps {
  demo: Demo
  linkId?: string
  vars?: Record<string, string>
}

export default function DemoViewer({ demo, linkId, vars = {} }: DemoViewerProps) {
  const [currentStep, setCurrentStep]         = useState(0)
  const [activeHotspot, setActiveHotspot]     = useState<Hotspot | null>(null)
  const [transitioning, setTransitioning]     = useState(false)
  const [transitionDir, setTransitionDir]     = useState<'next' | 'prev'>('next')
  const [finished, setFinished]               = useState(false)
  const [hotspotVisible, setHotspotVisible]   = useState(false)
  const [autoHotspotIdx, setAutoHotspotIdx]   = useState(0)

  const sessionRef    = useRef<string | null>(null)
  const stepStartTime = useRef<number>(Date.now())
  const completedRef  = useRef(false)
  const hotspotTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const step   = demo.steps[currentStep]
  const total  = demo.steps.length
  const isLast = currentStep === total - 1

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

  // Auto-affiche les tooltips séquentiellement après l'arrivée sur un step
  useEffect(() => {
    setHotspotVisible(false)
    setActiveHotspot(null)
    setAutoHotspotIdx(0)
    if (hotspotTimer.current) clearTimeout(hotspotTimer.current)

    const hotspots = demo.steps[currentStep]?.hotspots ?? []
    if (hotspots.length === 0) return

    // Affiche le premier hotspot après 800ms
    hotspotTimer.current = setTimeout(() => {
      setHotspotVisible(true)
      setActiveHotspot(hotspots[0])
      setAutoHotspotIdx(0)
    }, 800)

    return () => { if (hotspotTimer.current) clearTimeout(hotspotTimer.current) }
  }, [currentStep, demo.steps])

  const goTo = useCallback((index: number, dir: 'next' | 'prev' = 'next') => {
    if (index === currentStep || transitioning) return
    const timeSpent = Date.now() - stepStartTime.current
    track('step_view', { step_index: index, time_spent_ms: timeSpent })
    if (index === total - 1 && !completedRef.current) {
      completedRef.current = true
      track('demo_complete', { time_spent_ms: timeSpent })
    }
    stepStartTime.current = Date.now()
    setTransitionDir(dir)
    setTransitioning(true)
    setActiveHotspot(null)
    setHotspotVisible(false)
    setTimeout(() => {
      setCurrentStep(index)
      setTransitioning(false)
    }, 350)
  }, [currentStep, transitioning, total, track])

  // Navigue entre les hotspots avec "Suivant" si sur un step avec plusieurs hotspots
  function handleNext() {
    const hotspots = step?.hotspots ?? []
    const hasMore  = autoHotspotIdx < hotspots.length - 1

    if (hasMore && activeHotspot) {
      // Passe au hotspot suivant avec animation
      const nextIdx = autoHotspotIdx + 1
      setActiveHotspot(null)
      setTimeout(() => {
        setActiveHotspot(hotspots[nextIdx])
        setAutoHotspotIdx(nextIdx)
      }, 250)
      return
    }

    if (isLast) { setFinished(true); return }
    goTo(currentStep + 1, 'next')
  }

  function handlePrev() {
    if (currentStep === 0) return
    goTo(currentStep - 1, 'prev')
  }

  // Label du bouton suivant
  function nextLabel() {
    const hotspots = step?.hotspots ?? []
    const hasMore  = autoHotspotIdx < hotspots.length - 1
    if (hasMore) return `Continuer →`
    if (isLast)  return `🎉 Terminer`
    return `Suivant →`
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft')  handlePrev()
      if (e.key === 'Escape')     setActiveHotspot(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, transitioning, autoHotspotIdx, activeHotspot])

  // Slide direction
  const slideStyle = transitioning ? {
    opacity: 0,
    transform: transitionDir === 'next' ? 'translateX(-40px) scale(0.97)' : 'translateX(40px) scale(0.97)',
    transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
  } : {
    opacity: 1,
    transform: 'translateX(0) scale(1)',
    transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
  }

  // Écran de fin
  if (finished) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#FAFAFA', gap: 24, padding: 24 }}>
        <style>{`
          @keyframes popIn { from { opacity:0; transform:scale(0.7); } to { opacity:1; transform:scale(1); } }
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
        <div style={{ fontSize: 64, animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>🎉</div>
        <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease 0.2s both' }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 10 }}>Démo terminée !</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            Tu as exploré les {total} étapes de<br/>
            <strong style={{ color: '#fff' }}>{t(demo.title)}</strong>
          </p>
        </div>
        <button
          onClick={() => { setFinished(false); setCurrentStep(0); setAutoHotspotIdx(0); completedRef.current = false }}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 24px', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', animation: 'fadeUp 0.4s ease 0.4s both' }}
        >
          ← Recommencer
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes ping { 0% { transform:scale(0.8); opacity:0.3; } 70% { transform:scale(2.2); opacity:0; } 100% { transform:scale(2.2); opacity:0; } }
        @keyframes tooltipIn { from { opacity:0; transform:translate(-50%,-4px) scale(0.95); } to { opacity:1; transform:translate(-50%,-10px) scale(1); } }
        @keyframes hotspotPop { from { opacity:0; transform:translate(-50%,-50%) scale(0.5); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes progressFill { from { width: 0%; } }
        .nav-btn:hover { opacity: 0.85; transform: scale(0.98); }
        .next-btn:hover { transform: scale(1.03); box-shadow: 0 0 32px rgba(79,70,229,0.5) !important; }
      `}</style>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(12,12,12,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 5L8 2L13 5V11L8 14L3 11V5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
            </svg>
          </div>
          <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>{t(demo.title)}</span>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {demo.steps.map((_, i) => (
              <div
                key={i}
                onClick={() => i < currentStep && goTo(i, 'prev')}
                style={{ width: i === currentStep ? 24 : 6, height: 6, borderRadius: 100, background: i < currentStep ? '#4F46E5' : i === currentStep ? '#4F46E5' : 'rgba(255,255,255,0.12)', transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)', cursor: i < currentStep ? 'pointer' : 'default', opacity: i > currentStep ? 0.4 : 1 }}
              />
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, minWidth: 32 }}>{currentStep + 1}/{total}</span>
        </div>
      </header>

      {/* Barre de progression cinématique */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${((currentStep + 1) / total) * 100}%`, background: 'linear-gradient(90deg, #4F46E5, #818CF8)', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 0 8px rgba(79,70,229,0.6)' }} />
      </div>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px 120px', gap: 16 }}>
        <div style={{ position: 'relative', maxWidth: '900px', width: '100%', ...slideStyle }} onClick={() => setActiveHotspot(null)}>
          <img
            src={step.screenshotUrl}
            alt={`Étape ${currentStep + 1}`}
            style={{ width: '100%', display: 'block', borderRadius: 12, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          />
          {hotspotVisible && step.hotspots.map((hs, idx) => (
            <HotspotDot
              key={hs.id}
              hotspot={hs}
              isActive={activeHotspot?.id === hs.id}
              isVisited={idx < autoHotspotIdx}
              onToggle={(h) => {
                setActiveHotspot(activeHotspot?.id === h.id ? null : h)
                track('hotspot_click', { step_index: currentStep, hotspot_id: h.id })
              }}
              interpolate={t}
              animDelay={idx * 150}
            />
          ))}
        </div>

        {/* Indicateur de hotspot actif */}
        {activeHotspot && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', animation: 'fadeUp 0.3s ease' }}>
            Clique sur "Continuer" pour passer au point suivant
          </p>
        )}
      </main>

      {/* Barre de navigation fixe */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 28px', background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 200 }}>

        <button
          className="nav-btn"
          onClick={handlePrev}
          disabled={currentStep === 0}
          style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: currentStep === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', fontSize: 14, cursor: currentStep === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
        >
          ← Précédent
        </button>

        {/* Info étape */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
            {step?.hotspots?.length > 0 && autoHotspotIdx < step.hotspots.length
              ? `Point ${autoHotspotIdx + 1} sur ${step.hotspots.length}`
              : `Étape ${currentStep + 1} sur ${total}`}
          </p>
        </div>

        <button
          className="next-btn"
          onClick={handleNext}
          style={{ padding: '12px 32px', background: isLast && autoHotspotIdx >= (step?.hotspots?.length ?? 1) - 1 ? '#10B981' : '#4F46E5', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 0 20px rgba(79,70,229,0.3)' }}
        >
          {nextLabel()}
        </button>
      </div>
    </div>
  )
}

function HotspotDot({ hotspot, isActive, isVisited, onToggle, interpolate, animDelay }: {
  hotspot: Hotspot; isActive: boolean; isVisited: boolean
  onToggle: (h: Hotspot) => void; interpolate: (s: string) => string; animDelay: number
}) {
  const title = interpolate(hotspot.title)
  const desc  = interpolate(hotspot.description)
  return (
    <div
      style={{ position: 'absolute', left: `${hotspot.x}%`, top: `${hotspot.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10, animation: `hotspotPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${animDelay}ms both` }}
      onClick={(e) => { e.stopPropagation(); onToggle(hotspot) }}
    >
      {/* Pulse ring */}
      {!isVisited && !isActive && (
        <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', background: '#4F46E5', opacity: 0.25, animation: 'ping 2s ease-out infinite' }} />
      )}
      {/* Core */}
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: isVisited ? 'rgba(79,70,229,0.3)' : isActive ? '#fff' : '#4F46E5', border: `2px solid ${isActive ? '#4F46E5' : isVisited ? 'rgba(79,70,229,0.4)' : '#fff'}`, cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', transform: isActive ? 'scale(1.3)' : 'scale(1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: isActive ? '0 0 0 4px rgba(79,70,229,0.2)' : 'none' }}>
        <span style={{ color: isActive ? '#4F46E5' : isVisited ? 'rgba(79,70,229,0.6)' : '#fff', fontSize: 10, fontWeight: 700 }}>
          {isVisited ? '✓' : isActive ? '×' : '+'}
        </span>
      </div>
      {/* Tooltip */}
      {isActive && title && (
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translate(-50%, -10px)', background: '#1A1A2E', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 12, padding: '14px 18px', minWidth: 240, maxWidth: 320, boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,70,229,0.1)', animation: 'tooltipIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', pointerEvents: 'none', zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: desc ? 8 : 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5', flexShrink: 0 }} />
            <p style={{ color: '#FAFAFA', fontSize: 13, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{title}</p>
          </div>
          {desc && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6, margin: 0, paddingLeft: 14 }}>{desc}</p>}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(79,70,229,0.3)' }} />
        </div>
      )}
    </div>
  )
}
