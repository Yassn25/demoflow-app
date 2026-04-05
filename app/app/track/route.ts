import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { type, demo_id, session_id, link_id, step_index, hotspot_id, time_spent_ms } = body as {
    type: string; demo_id: string; session_id?: string; link_id?: string
    step_index?: number; hotspot_id?: string; time_spent_ms?: number
  }

  if (!demo_id) return NextResponse.json({ error: 'demo_id required' }, { status: 400 })

  if (type === 'session_start') {
    const id = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const { data: demo } = await supabase.from('demos').select('steps').eq('id', demo_id).single()
    const total_steps = Array.isArray(demo?.steps) ? demo.steps.length : 0
    const { error } = await supabase.from('viewer_sessions').insert({ id, demo_id, link_id: link_id ?? null, total_steps, steps_seen: 1 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('viewer_events').insert({ session_id: id, demo_id, event_type: 'demo_start', step_index: 0 })
    return NextResponse.json({ session_id: id })
  }

  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  if (type === 'step_view') {
    const stepIdx = typeof step_index === 'number' ? step_index : 0
    await supabase.from('viewer_sessions').update({ last_seen: new Date().toISOString(), current_step: stepIdx, steps_seen: stepIdx + 1 }).eq('id', session_id)
    await supabase.from('viewer_events').insert({ session_id, demo_id, event_type: 'step_view', step_index: stepIdx, time_spent_ms: time_spent_ms ?? 0 })
    return NextResponse.json({ ok: true })
  }

  if (type === 'hotspot_click') {
    await supabase.from('viewer_events').insert({ session_id, demo_id, event_type: 'hotspot_click', step_index: step_index ?? null, hotspot_id: hotspot_id ?? null })
    return NextResponse.json({ ok: true })
  }

  if (type === 'demo_complete') {
    await supabase.from('viewer_sessions').update({ completed: true, last_seen: new Date().toISOString() }).eq('id', session_id)
    await supabase.from('viewer_events').insert({ session_id, demo_id, event_type: 'demo_complete', time_spent_ms: time_spent_ms ?? 0 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: `Unknown event type: ${type}` }, { status: 400 })
}
