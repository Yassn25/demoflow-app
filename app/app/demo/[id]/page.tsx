import { notFound } from 'next/navigation'
import { supabase, type Demo, type DemoLink } from '@/lib/supabase'
import DemoViewer from '@/components/DemoViewer'

export const dynamic = 'force-dynamic'

export default async function DemoPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { l?: string }
}) {
  const { data, error } = await supabase
    .from('demos')
    .select('*')
    .eq('id', params.id)
    .eq('published', true)
    .single()

  if (error || !data) notFound()

  supabase.rpc('increment_view_count', { demo_id: params.id }).catch(() => {})

  let linkData: DemoLink | null = null
  if (searchParams.l) {
    const { data: link } = await supabase
      .from('demo_links')
      .select('*')
      .eq('id', searchParams.l)
      .eq('demo_id', params.id)
      .single()
    linkData = link ?? null
  }

  const vars: Record<string, string> = {
    ...(linkData?.custom_vars ?? {}),
    ...(linkData?.viewer_name    ? { name: linkData.viewer_name }       : {}),
    ...(linkData?.viewer_company ? { company: linkData.viewer_company } : {}),
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; }
        @keyframes ping {
          0%   { transform: scale(0.8); opacity: 0.3; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translate(-50%, -4px); }
          to   { opacity: 1; transform: translate(-50%, -10px); }
        }
      `}</style>
      <DemoViewer
        demo={data as Demo}
        linkId={searchParams.l}
        vars={vars}
      />
    </>
  )
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data } = await supabase
    .from('demos')
    .select('title')
    .eq('id', params.id)
    .single()

  return {
    title: data?.title ? `${data.title} — DemoFlow` : 'DemoFlow',
    description: 'Démo produit interactive',
  }
}
