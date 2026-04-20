import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClienteAutenticado } from '@/app/actions/clientes'
import FluxoAgendamento, { type Servico, type Barbeiro } from '@/components/agendamento/FluxoAgendamento'

interface Props {
  params:      Promise<{ slug: string }>
  searchParams: Promise<{ reagendar?: string }>
}

export default async function AgendarPage({ params, searchParams }: Props) {
  const { slug }      = await params
  const { reagendar } = await searchParams
  const supabase      = await createClient()

  const { data: empresaData } = await supabase
    .from('empresas')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!empresaData) notFound()
  const empresa = empresaData as any

  const [{ data: servicos }, { data: barbeiros }, { data: horarios }] = await Promise.all([
    supabase.from('servicos').select('*').eq('empresa_id', empresa.id).eq('ativo', true).order('nome'),
    supabase.from('barbeiros').select('*').eq('empresa_id', empresa.id).eq('ativo', true).order('nome'),
    supabase.from('horarios_funcionamento').select('dia_semana')
      .eq('empresa_id', empresa.id).is('barbeiro_id', null).eq('ativo', true),
  ])

  const diasAtivos = (horarios ?? []).map((h: any) => Number(h.dia_semana))
  const cliente    = await getClienteAutenticado(empresa.id)

  let reagendarId:     string | undefined
  let initialServico:  Servico | undefined
  let initialBarbeiro: Barbeiro | undefined

  if (reagendar && cliente) {
    const admin = createAdminClient()
    const { data: agendamento } = await admin
      .from('agendamentos')
      .select('id, servico_id, barbeiro_id')
      .eq('id', reagendar)
      .eq('cliente_id', cliente.id)
      .in('status', ['pendente', 'confirmado'])
      .single()

    if (agendamento) {
      reagendarId     = agendamento.id
      initialServico  = (servicos ?? []).find((s: any) => s.id === agendamento.servico_id)
      initialBarbeiro = (barbeiros ?? []).find((b: any) => b.id === agendamento.barbeiro_id)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {empresa.logo_url ? (
              <img src={empresa.logo_url} alt={empresa.nome} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <span className="text-black font-bold text-lg">{empresa.nome.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div>
              <h1 className="text-white font-semibold text-base leading-tight">{empresa.nome}</h1>
              {empresa.cidade && (
                <p className="text-zinc-400 text-xs">{empresa.cidade}{empresa.estado ? `, ${empresa.estado}` : ''}</p>
              )}
            </div>
          </div>
          <Link
            href={`/${slug}`}
            className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            ← Início
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {reagendarId && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm">
            Reagendando: escolha a nova data e horário.
          </div>
        )}
        <FluxoAgendamento
          empresa={empresa}
          servicos={servicos ?? []}
          barbeiros={barbeiros ?? []}
          diasAtivos={diasAtivos}
          reagendarId={reagendarId}
          initialServico={initialServico}
          initialBarbeiro={initialBarbeiro}
        />
      </main>
    </div>
  )
}
