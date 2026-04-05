import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

function formatDuration(ms: number | null): string {
  if (!ms || ms < 0) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export default async function DemoAnalyticsPage({ params }: { params: { id: string } }) {
  const { id } = params

  const { data: demo, error } = await supabase.from('demos').select('*').eq('id', id).single()
  if (error || !demo) notFound()

  const { data: sessions } = await supabase.from('viewer_sessions').select('*').eq('demo_id', id).order('started_at', { ascending: false })
  const { data: events } = await supabase.from('viewer_events').select('*').eq('demo_id', id)
  const { data: links } = await supabase.from('demo_links').select('*').eq('demo_id', id).order('created_at', { ascending: false })

  const allSessions = sessions ?? []
  const allLinks = links ?? []
  const steps = demo.steps ?? []

  const totalSessions = allSessions.length
  const completions = allSessions.filter((s: any) => s.completed).length
  const completionRate = totalSessions > 0 ? Math.round((completions / totalSessions) * 100) : null

  const durations = allSessions.map((s: any) => new Date(s.last_seen).getTime() - new Date(s.started_at).getTime()).filter((d: number) => d > 0 && d < 3600000)
  const avgDuration = durations.length ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : null

  const stepViewEvents = (events ?? []).filter((e: any) => e.event_type === 'step_view')
  const funnelData = steps.map((_: any, i: number) => ({ step: i + 1, count: stepViewEvents.filter((e: any) => e.step_index === i).length }))
  const maxFunnelCount = Math.max(...funnelData.map((d: any) => d.count), 1)

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px' }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#FAFAFA' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(12,12,12,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13 }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{demo.title}</span>
        </div>
        <Link href={`/demo/${id}`} target="_blank" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px' }}>Voir la démo →</Link>
      </header>

      <main style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Sessions', value: totalSessions, color: '#4F46E5' },
            { label: 'Complétions', value: completions, color: '#10B981' },
            { label: 'Taux complétion', value: completionRate !== null ? `${completionRate}%` : '—', color: '#10B981' },
            { label: 'Durée moyenne', value: formatDuration(avgDuration), color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} style={cardStyle}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: s.color, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Funnel de navigation</h3>
          {funnelData.length === 0 ? <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Aucune donnée.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {funnelData.map((d: any) => {
                const pct = Math.round((d.count / maxFunnelCount) * 100)
                return (
                  <div key={d.step}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Étape {d.step}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{d.count}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct > 60 ? '#4F46E5' : pct > 30 ? '#F59E0B' : '#EF4444', borderRadius: 100 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Liens de suivi ({allLinks.length})</h3>
            <Link href={`/dashboard/${id}/new-link`} style={{ fontSize: 12, color: '#fff', background: '#4F46E5', borderRadius: 8, padding: '6px 14px', textDecoration: 'none' }}>+ Nouveau lien</Link>
          </div>
          {allLinks.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Aucun lien créé. Utilise le bouton ci-dessus ou l'extension après publication.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allLinks.map((link: any) => {
                const ls = allSessions.filter((s: any) => s.link_id === link.id)
                const done = ls.filter((s: any) => s.completed).length
                const rate = ls.length > 0 ? Math.round((done / ls.length) * 100) : null
                const url = `${process.env.NEXT_PUBLIC_APP_URL}/demo/${id}?l=${link.id}`
                return (
                  <div key={link.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{link.viewer_name ?? link.label ?? '—'}</div>
                      {link.viewer_company && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{link.viewer_company}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{ls.length} session{ls.length > 1 ? 's' : ''}</span>
                      {rate !== null && <span style={{ fontSize: 12, fontWeight: 700, color: rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444' }}>{rate}%</span>}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sessions récentes</h3>
          {allSessions.length === 0 ? <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Aucune session.</p> : (
            <div>
              {allSessions.slice(0, 20).map((s: any) => {
                const link = allLinks.find((l: any) => l.id === s.link_id)
                const dur = new Date(s.last_seen).getTime() - new Date(s.started_at).getTime()
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.completed ? '#10B981' : '#F59E0B' }} />
                      {link && <span style={{ fontSize: 12, color: '#4F46E5' }}>{link.viewer_name ?? link.label}</span>}
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.steps_seen}/{s.total_steps} steps</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{formatDuration(dur > 0 ? dur : null)}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{timeAgo(s.started_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
