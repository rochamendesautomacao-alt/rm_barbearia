import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClienteAutenticado, getAgendamentosCliente } from '@/app/actions/clientes'
import { logoutClienteB } from '@/app/actions/booking-publico'
import BotoesAgendamentoCliente from '@/components/agendamento/BotoesAgendamentoCliente'

interface Props {
  params: Promise<{ slug: string }>
}

const STATUS_LABEL: Record<string, string> = {
  pendente:     'Pendente',
  confirmado:   'Confirmado',
  em_andamento: 'Em andamento',
}

const STATUS_COR: Record<string, string> = {
  pendente:     'bg-yellow-900/40 text-yellow-400',
  confirmado:   'bg-blue-900/40 text-blue-400',
  em_andamento: 'bg-amber-900/40 text-amber-400',
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export default async function PortalBPage({ params }: Props) {
  const { slug } = await params
  const base     = `/b/${slug}`
  const supabase = await createClient()

  const { data: empresa } = await supabase
    .from('empresas')
    .select('id, nome, slug, logo_url, cidade, estado')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!empresa) notFound()

  const cliente      = await getClienteAutenticado(empresa.id)
  const agendamentos = cliente ? await getAgendamentosCliente(cliente.id) : []
  const proximos     = agendamentos.filter(a =>
    !['cancelado', 'no_show', 'concluido'].includes(a.status)
  )

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
                <p className="text-zinc-400 text-xs">
                  {empresa.cidade}{empresa.estado ? `, ${empresa.estado}` : ''}
                </p>
              )}
            </div>
          </div>

          {cliente && (
            <form action={logoutClienteB.bind(null, slug)}>
              <button type="submit" className="text-zinc-500 hover:text-red-400 text-xs transition-colors">
                Sair
              </button>
            </form>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* ─── NÃO AUTENTICADO ─── */}
        {!cliente && (
          <>
            <div className="text-center py-4">
              <h2 className="text-white text-2xl font-bold">Bem-vindo!</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Agende seu horário ou acesse sua conta.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href={`${base}/agendar`}
                className="flex items-center justify-between w-full bg-amber-500 hover:bg-amber-400
                           text-black font-semibold rounded-2xl px-5 py-4 transition-colors"
              >
                <div>
                  <p className="text-base font-bold">Fazer agendamento</p>
                  <p className="text-xs font-normal opacity-70 mt-0.5">Escolha serviço, barbeiro e horário</p>
                </div>
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`${base}/entrar`}
                  className="flex flex-col items-center gap-2 bg-zinc-900 hover:bg-zinc-800
                             border border-zinc-800 rounded-2xl px-4 py-5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-semibold">Entrar</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Já tenho conta</p>
                  </div>
                </Link>

                <Link
                  href={`${base}/cadastro`}
                  className="flex flex-col items-center gap-2 bg-zinc-900 hover:bg-zinc-800
                             border border-zinc-800 rounded-2xl px-4 py-5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-semibold">Criar conta</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Cadastro gratuito</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <p className="text-zinc-600 text-xs">Com conta você pode cancelar e reagendar</p>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
          </>
        )}

        {/* ─── AUTENTICADO ─── */}
        {cliente && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Olá,</p>
                <h2 className="text-white text-xl font-bold">{cliente.nome.split(' ')[0]}</h2>
              </div>
              <Link
                href={`${base}/agendar`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black
                           font-semibold rounded-xl text-sm transition-colors"
              >
                + Novo agendamento
              </Link>
            </div>

            <section>
              <h3 className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-3">
                Próximos agendamentos
              </h3>

              {proximos.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
                  <p className="text-zinc-500 text-sm">Você não tem agendamentos futuros.</p>
                  <Link
                    href={`${base}/agendar`}
                    className="inline-block mt-3 px-5 py-2.5 bg-amber-500 hover:bg-amber-400
                               text-black font-semibold rounded-xl text-sm transition-colors"
                  >
                    Agendar agora
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {proximos.map((a: any) => (
                    <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-white font-semibold text-sm">{a.servicos?.nome ?? '—'}</p>
                          <p className="text-zinc-400 text-xs mt-0.5">com {a.barbeiros?.nome ?? '—'}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${STATUS_COR[a.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                          {STATUS_LABEL[a.status] ?? a.status}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs capitalize">{formatarDataHora(a.data_hora_inicio)}</p>
                      {a.preco_cobrado != null && (
                        <p className="text-amber-400 text-sm font-semibold">
                          {Number(a.preco_cobrado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      )}
                      <BotoesAgendamentoCliente
                        agendamentoId={a.id}
                        status={a.status}
                        slug={slug}
                        basePath={base}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Link
              href={`${base}/meus-agendamentos`}
              className="flex items-center justify-between w-full bg-zinc-900 hover:bg-zinc-800
                         border border-zinc-800 rounded-2xl px-4 py-3 transition-colors"
            >
              <span className="text-zinc-300 text-sm">Ver histórico completo</span>
              <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </>
        )}
      </main>
    </div>
  )
}
