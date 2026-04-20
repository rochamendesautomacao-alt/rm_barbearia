import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getClienteAutenticado, cancelarAgendamentoCliente } from '@/app/actions/clientes'
import FluxoAgendamento, { type Servico, type Barbeiro } from '@/components/agendamento/FluxoAgendamento'

interface Props {
  params:      Promise<{ slug: string }>
  searchParams: Promise<{ reagendar?: string }>
}

export default async function AgendarBPage({ params, searchParams }: Props) {
  const { slug }      = await params
  const { reagendar } = await searchParams
  const base          = `/b/${slug}`
  const supabase      = await createClient()

  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!empresa) notFound()

  // Políticas RLS (migration 010) permitem anon/authenticated ler catálogo ativo
  const [{ data: servicos }, { data: barbeiros }, { data: horarios }] = await Promise.all([
    supabase.from('servicos').select('*').eq('empresa_id', empresa.id).eq('ativo', true).order('nome'),
    supabase.from('barbeiros').select('*').eq('empresa_id', empresa.id).eq('ativo', true).order('nome'),
    supabase.from('horarios_funcionamento').select('dia_semana')
      .eq('empresa_id', empresa.id).is('barbeiro_id', null).eq('ativo', true),
  ])

  const diasAtivos = (horarios ?? []).map((h: { dia_semana: number }) => Number(h.dia_semana))
  const cliente    = await getClienteAutenticado(empresa.id)

  let reagendarId:     string | undefined
  let initialServico:  Servico | undefined
  let initialBarbeiro: Barbeiro | undefined

  if (reagendar && cliente) {
    // agendamentos_leitura_cliente (migration 011) permite clientes autenticados lerem os seus
    const { data: ag } = await supabase
      .from('agendamentos')
      .select('id, servico_id, barbeiro_id')
      .eq('id', reagendar)
      .eq('cliente_id', cliente.id)
      .in('status', ['pendente', 'confirmado'])
      .single()

    if (ag) {
      reagendarId     = ag.id
      initialServico  = (servicos ?? []).find(s => s.id === ag.servico_id)
      initialBarbeiro = (barbeiros ?? []).find(b => b.id === ag.barbeiro_id)
    }
  }

  const cancelarFn = reagendarId
    ? cancelarAgendamentoCliente.bind(null, reagendarId, slug, base)
    : undefined

  return (
    <div className="min-h-screen bg-zinc-950 font-sans selection:bg-amber-500/30">
      <header className="bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-800/50 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Link href={base} className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-amber-500 rounded-full blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
              {empresa.logo_url ? (
                <Image src={empresa.logo_url} alt={empresa.nome} width={36} height={36} className="relative w-9 h-9 rounded-full object-cover border border-zinc-800" />
              ) : (
                <div className="relative w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center border border-amber-400/50 text-black font-black text-sm">
                  {empresa.nome.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-white font-black text-sm leading-tight uppercase tracking-tight">{empresa.nome}</h1>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Agendamento Online</p>
            </div>
          </Link>

          <Link
            href={base}
            className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Sair
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 md:py-12">
        <FluxoAgendamento
          empresa={empresa}
          servicos={servicos ?? []}
          barbeiros={barbeiros ?? []}
          diasAtivos={diasAtivos}
          basePath={base}
          clienteLogado={cliente ?? undefined}
          reagendarId={reagendarId}
          initialServico={initialServico}
          initialBarbeiro={initialBarbeiro}
          cancelarReagendar={cancelarFn}
        />
      </main>

      <footer className="max-w-lg mx-auto px-4 py-12 text-center text-zinc-900 text-[8px] font-black uppercase tracking-[0.4em]">
         RM Barbearia &copy; 2026
      </footer>
    </div>
  )
}
