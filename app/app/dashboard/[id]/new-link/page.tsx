'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function NewLinkPage() {
  const router = useRouter()
  const params = useParams()
  const demoId = params.id as string

  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<{ id: string; url: string } | null>(null)
  const [error,   setError]   = useState('')

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

  async function handleCreate() {
    if (!name && !email && !company) { setError('Remplis au moins un champ.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo_id: demoId, viewer_name: name || undefined, viewer_email: email || undefined, viewer_company: company || undefined }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur inconnue')
      const link = await res.json()
      setResult({ id: link.id, url: `${APP_URL}/demo/${demoId}?l=${link.id}` })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur.')
    } finally { setLoading(false) }
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#FAFAFA', fontSize: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#FAFAFA' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 32 }}>← Retour</button>

        {!result ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 8 }}>Nouveau lien de suivi</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 32, lineHeight: 1.6 }}>
              Crée un lien personnalisé pour ce prospect. Tu pourras suivre ses actions et personnaliser les tooltips avec <code style={{ color: '#4F46E5' }}>{'{{name}}'}</code> et <code style={{ color: '#4F46E5' }}>{'{{company}}'}</code>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input style={inputStyle} placeholder="Nom du prospect (ex : Marie Dupont)" value={name} onChange={e => setName(e.target.value)} />
              <input style={inputStyle} type="email" placeholder="Email (ex : marie@acme.com)" value={email} onChange={e => setEmail(e.target.value)} />
              <input style={inputStyle} placeholder="Entreprise (ex : Acme Corp)" value={company} onChange={e => setCompany(e.target.value)} />
              {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>}
              <button onClick={handleCreate} disabled={loading} style={{ width: '100%', background: loading ? 'rgba(79,70,229,0.5)' : '#4F46E5', border: 'none', borderRadius: 10, padding: '14px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Création…' : 'Créer le lien →'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Lien créé !</h2>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all', textAlign: 'left', marginBottom: 16 }}>
              {result.url}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => navigator.clipboard.writeText(result.url)} style={{ background: '#4F46E5', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Copier le lien</button>
              <button onClick={() => router.push(`/dashboard/${demoId}`)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 20px', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Voir les analytics</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
