import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

interface Props {
  params:       Promise<{ slug: string }>
  searchParams: Promise<{ id?: string }>
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

function formatarDataCompleta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

export default async function ConfirmacaoBPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { id }   = await searchParams
  const base     = `/b/${slug}`

  if (!id) notFound()

  const admin = createAdminClient()

  const { data: ag } = await admin
    .from('agendamentos')
    .select('id, data_hora_inicio, data_hora_fim, preco_cobrado, status, barbeiro_id, servico_id')
    .eq('id', id)
    .single()

  if (!ag) notFound()

  const [{ data: servico }, { data: barbeiro }] = await Promise.all([
    admin.from('servicos').select('nome, duracao_minutos').eq('id', ag.servico_id).single(),
    admin.from('barbeiros').select('nome').eq('id', ag.barbeiro_id).single(),
  ])

  if (!servico || !barbeiro) notFound()

  const agendamento = {
    ...ag,
    servico_nome:    servico.nome,
    duracao_minutos: servico.duracao_minutos,
    barbeiro_nome:   barbeiro.nome,
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-white font-semibold text-base">Agendamento confirmado</h1>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-500/10 border-2 border-green-500 rounded-full
                          flex items-center justify-center mx-auto">
            <span className="text-green-400 text-2xl">✓</span>
          </div>
          <h2 className="text-white text-xl font-bold">Tudo certo!</h2>
          <p className="text-zinc-400 text-sm">Seu agendamento foi realizado com sucesso.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
            Detalhes do agendamento
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-zinc-600 text-lg mt-0.5">✂</span>
              <div>
                <p className="text-zinc-500 text-xs">Serviço</p>
                <p className="text-white font-medium">{agendamento.servico_nome}</p>
                <p className="text-zinc-400 text-sm">
                  {agendamento.preco_cobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
            <div className="border-t border-zinc-800" />
            <div className="flex gap-3 items-start">
              <span className="text-zinc-600 text-lg mt-0.5">👤</span>
              <div>
                <p className="text-zinc-500 text-xs">Barbeiro</p>
                <p className="text-white font-medium">{agendamento.barbeiro_nome}</p>
              </div>
            </div>
            <div className="border-t border-zinc-800" />
            <div className="flex gap-3 items-start">
              <span className="text-zinc-600 text-lg mt-0.5">📅</span>
              <div>
                <p className="text-zinc-500 text-xs">Data e horário</p>
                <p className="text-white font-medium capitalize">
                  {formatarDataCompleta(agendamento.data_hora_inicio)}
                </p>
                <p className="text-zinc-400 text-sm">
                  {formatarHora(agendamento.data_hora_inicio)} – {formatarHora(agendamento.data_hora_fim)}
                  <span className="text-zinc-600 ml-2">({agendamento.duracao_minutos} min)</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 text-sm text-center">
            Guarde este link ou anote o horário.
            Em caso de imprevisto, entre em contato com a barbearia.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`${base}/meus-agendamentos`}
            className="block text-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-700
                       text-white rounded-xl py-3 text-sm font-medium transition-colors"
          >
            Meus agendamentos
          </Link>
          <Link
            href={`${base}/agendar`}
            className="block text-center bg-amber-500 hover:bg-amber-400
                       text-black rounded-xl py-3 text-sm font-semibold transition-colors"
          >
            Novo agendamento
          </Link>
        </div>
      </main>
    </div>
  )
}
