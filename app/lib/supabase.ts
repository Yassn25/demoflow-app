import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnon)

export type Hotspot = {
  id: string
  x: number    // % from left
  y: number    // % from top
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
}
