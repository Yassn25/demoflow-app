import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function DashboardPage() {
  const { data: demos } = await supabase
    .from('demos')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  const rows = demos ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#FAFAFA' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(12,12,12,0.9)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 5L8 2L13 5V11L8 14L3 11V5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.03em' }}>DemoFlow</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 8px' }}>Dashboard</span>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{rows.length} démo{rows.length > 1 ? 's' : ''}</span>
      </header>

      <main style={{ padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Démos publiées', value: rows.length, color: '#4F46E5' },
            { label: 'Vues totales', value: rows.reduce((a, r) => a + (r.view_count ?? 0), 0), color: '#06B6D4' },
            { label: 'Cette semaine', value: rows.filter(r => new Date(r.created_at) > new Date(Date.now() - 7 * 86400000)).length, color: '#10B981' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: s.color, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            Aucune démo publiée pour l'instant.
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              <span>Démo</span>
              <span style={{ textAlign: 'right' }}>Vues</span>
              <span style={{ textAlign: 'right' }}>Créée le</span>
            </div>
            {rows.map((row, i) => (
              <Link key={row.id} href={`/dashboard/${row.id}`} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px', padding: '16px 24px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', textDecoration: 'none', color: 'inherit', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{row.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{row.id}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{row.view_count ?? 0}</div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{formatDate(row.created_at)}</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
