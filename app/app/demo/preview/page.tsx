'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import DemoViewer from '@/components/DemoViewer'
import type { Demo } from '@/lib/supabase'

function PreviewContent() {
  const params = useSearchParams()
  const dataParam = params.get('data')

  if (!dataParam) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: 40 }}>
        Aucune donnée de prévisualisation.
      </div>
    )
  }

  try {
    const demo = JSON.parse(decodeURIComponent(dataParam)) as Demo
    return (
      <>
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          background: 'rgba(251,191,36,0.12)',
          borderBottom: '1px solid rgba(251,191,36,0.3)',
          padding: '8px 20px',
          fontSize: 12,
          color: 'rgba(251,191,36,0.8)',
          textAlign: 'center',
          zIndex: 9999,
          fontFamily: 'monospace',
        }}>
          ⚠ MODE PRÉVISUALISATION — Non publié
        </div>
        <div style={{ paddingTop: 36 }}>
          <DemoViewer demo={demo} />
        </div>
      </>
    )
  } catch {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: 40 }}>
        Données invalides.
      </div>
    )
  }
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: 40 }}>Chargement…</div>}>
      <PreviewContent />
    </Suspense>
  )
}
