import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const demo_id = req.nextUrl.searchParams.get('demo_id')
  if (!demo_id) return NextResponse.json({ error: 'demo_id required' }, { status: 400 })

  const { data: links, error } = await supabase
    .from('demo_links').select('*').eq('demo_id', demo_id).order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = await Promise.all(
    (links ?? []).map(async (link) => {
      const { data: sessions } = await supabase.from('viewer_sessions').select('id, completed').eq('link_id', link.id)
      const total = sessions?.length ?? 0
      const done  = sessions?.filter(s => s.completed).length ?? 0
      return { ...link, stats: { total_sessions: total, completed: done, completion_rate: total > 0 ? Math.round((done / total) * 100) : null } }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { demo_id, viewer_name, viewer_email, viewer_company, custom_vars } = body as {
    demo_id: string; viewer_name?: string; viewer_email?: string
    viewer_company?: string; custom_vars?: Record<string, string>
  }

  if (!demo_id) return NextResponse.json({ error: 'demo_id required' }, { status: 400 })

  const id    = `lnk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const label = [viewer_name, viewer_company].filter(Boolean).join(' — ') || 'Lien sans nom'
  const vars: Record<string, string> = {
    ...(custom_vars ?? {}),
    ...(viewer_name    ? { name: viewer_name }       : {}),
    ...(viewer_company ? { company: viewer_company } : {}),
  }

  const { data, error } = await supabase.from('demo_links').insert({
    id, demo_id, label,
    viewer_name:    viewer_name    ?? null,
    viewer_email:   viewer_email   ?? null,
    viewer_company: viewer_company ?? null,
    custom_vars: vars,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
