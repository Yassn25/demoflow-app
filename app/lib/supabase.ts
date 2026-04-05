import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnon)

export type Hotspot = {
  id: string
  x: number
  y: number
  title: string
  description: string
}

export type Step = {
  id: string
  screenshotUrl: string
  hotspots: Hotspot[]
}

export type Demo = {
  id: string
  title: string
  steps: Step[]
  view_count: number
  created_at: string
  published: boolean
  creator_email?: string
}

export type DemoLink = {
  id: string
  demo_id: string
  label: string | null
  viewer_name: string | null
  viewer_email: string | null
  viewer_company: string | null
  custom_vars: Record<string, string>
  created_at: string
}

export type ViewerSession = {
  id: string
  demo_id: string
  link_id: string | null
  started_at: string
  last_seen: string
  completed: boolean
  steps_seen: number
  total_steps: number
  current_step: number
}

export type ViewerEvent = {
  id: number
  session_id: string
  demo_id: string
  event_type: 'demo_start' | 'step_view' | 'hotspot_click' | 'demo_complete'
  step_index: number | null
  hotspot_id: string | null
  time_spent_ms: number
  created_at: string
}
