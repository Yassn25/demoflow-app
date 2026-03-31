import { notFound } from 'next/navigation'
import { supabase, type Demo } from '@/lib/supabase'
import DemoViewer from '@/components/DemoViewer'

// Incrémente le view_count à chaque visite
async function incrementView(id: string) {
  await supabase.rpc('increment_view_count', { demo_id: id })
}

export default async function DemoPage({ params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('demos')
    .select('*')
    .eq('id', params.id)
    .eq('published', true)
    .single()

  if (error || !data) {
    notFound()
  }

  // Fire & forget — n'attend pas la réponse
  incrementView(params.id).catch(() => {})

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
      <DemoViewer demo={data as Demo} />
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
