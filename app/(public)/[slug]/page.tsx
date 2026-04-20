import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FluxoAgendamento from '@/components/agendamento/FluxoAgendamento'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PaginaBarbearia({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: empresaData } = await supabase
    .from('empresas')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!empresaData) notFound()

  const empresa = empresaData as any

  const [{ data: servicos }, { data: barbeiros }] = await Promise.all([
    supabase
      .from('servicos')
      .select('*')
      .eq('empresa_id', empresa.id)
      .eq('ativo', true)
      .order('nome'),
    supabase
      .from('barbeiros')
      .select('*')
      .eq('empresa_id', empresa.id)
      .eq('ativo', true)
      .order('nome'),
  ])

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header da barbearia */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {empresa.logo_url ? (
            <img
              src={empresa.logo_url}
              alt={empresa.nome}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-black font-bold text-lg">
                {empresa.nome.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-white font-semibold text-base leading-tight">{empresa.nome}</h1>
            {empresa.cidade && (
              <p className="text-zinc-400 text-xs">{empresa.cidade}{empresa.estado ? `, ${empresa.estado}` : ''}</p>
            )}
          </div>
        </div>
      </header>

      {/* Fluxo de agendamento */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <FluxoAgendamento
          empresa={empresa}
          servicos={servicos ?? []}
          barbeiros={barbeiros ?? []}
        />
      </main>
    </div>
  )
}
