import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { Empresa } from '@/types/database'
import { formatarDataHora, formatarPreco } from '@/lib/format'
import { STATUS_LABEL, STATUS_COR } from '@/lib/constants'
import { getClienteAutenticado, getAgendamentosCliente } from '@/app/actions/clientes'
import { logoutClienteB } from '@/app/actions/booking-publico'
import BotoesAgendamentoCliente from '@/components/agendamento/BotoesAgendamentoCliente'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PortalBPage({ params }: Props) {
  const { slug } = await params
  const base     = `/b/${slug}`
  const supabase = await createClient()

  const { data: empresaData } = await supabase
    .from('empresas')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!empresaData) notFound()
  const empresa = empresaData as Empresa

  const cliente      = await getClienteAutenticado(empresa.id)
  const agendamentos = cliente ? await getAgendamentosCliente(cliente.id) : []
  const proximos     = agendamentos.filter(a =>
    !['cancelado', 'no_show', 'concluido'].includes(a.status)
  )

  return (
    <div className="min-h-screen bg-zinc-950 font-sans selection:bg-amber-500/30">
      <header className="bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-800/50 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              {empresa.logo_url ? (
                <Image src={empresa.logo_url} alt={empresa.nome} width={44} height={44} className="relative w-11 h-11 rounded-full object-cover border border-zinc-700 shadow-xl" />
              ) : (
                <div className="relative w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center border border-amber-400/50 shadow-lg shadow-amber-500/20 text-black font-black text-xl">
                  {empresa.nome.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight uppercase tracking-tight">{empresa.nome}</h1>
              {empresa.cidade && (
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {empresa.cidade}{empresa.estado ? `, ${empresa.estado}` : ''}
                </p>
              )}
            </div>
          </div>

          {cliente && (
            <form action={logoutClienteB.bind(null, slug)}>
              <button type="submit" className="px-3 py-1.5 rounded-full bg-zinc-800/50 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-all border border-zinc-700/50">
                Sair
              </button>
            </form>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10 space-y-10">

        {/* ─── NÃO AUTENTICADO ─── */}
        {!cliente && (
          <>
            <div className="text-center space-y-3 pb-6 border-b border-zinc-900">
              <h2 className="text-white text-4xl font-black italic tracking-tighter leading-none">SEU ESTILO,<br/><span className="text-amber-500 uppercase not-italic">NOSSO TRABALHO.</span></h2>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-[0.2em]">
                Agende seu horário em poucos segundos.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href={`${base}/agendar`}
                className="group relative flex items-center justify-between w-full bg-amber-500 hover:bg-amber-400
                           text-black rounded-3xl px-7 py-6 transition-all duration-300 shadow-2xl shadow-amber-500/20 overflow-hidden active:scale-[0.98]"
              >
                <div className="z-10">
                  <p className="text-xl font-black uppercase tracking-tighter italic">Novo Agendamento</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Garantir meu horário agora</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center transition-transform group-hover:translate-x-1 duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              </Link>

              <div className="grid grid-cols-2 gap-4">
                <Link
                  href={`${base}/entrar`}
                  className="group flex flex-col items-start gap-4 bg-zinc-900 hover:bg-zinc-800
                             border border-zinc-800 rounded-3xl px-6 py-7 transition-all duration-300 shadow-xl active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-amber-500/10 flex items-center justify-center transition-colors">
                    <svg className="w-6 h-6 text-zinc-400 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-base font-black uppercase italic tracking-tighter">Entrar</p>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1">Acessar minha conta</p>
                  </div>
                </Link>

                <Link
                  href={`${base}/cadastro`}
                  className="group flex flex-col items-start gap-4 bg-zinc-900 hover:bg-zinc-800
                             border border-zinc-800 rounded-3xl px-6 py-7 transition-all duration-300 shadow-xl active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-amber-500/10 flex items-center justify-center transition-colors">
                    <svg className="w-6 h-6 text-zinc-400 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-base font-black uppercase italic tracking-tighter">Criar Conta</p>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1">Primeira vez aqui</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="pt-4 text-center">
              <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-[0.3em]">
                Cancele e Reagende com Facilidade
              </p>
            </div>
          </>
        )}

        {/* ─── AUTENTICADO ─── */}
        {cliente && (
          <div className="space-y-8">
            <div className="flex items-end justify-between bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Bem-vindo de volta,</p>
                <h2 className="text-white text-3xl font-black italic tracking-tighter leading-none">{cliente.nome.split(' ')[0]}</h2>
              </div>
              <Link
                href={`${base}/agendar`}
                className="group w-14 h-14 bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center
                           rounded-2xl shadow-lg transition-all active:scale-95"
                title="Novo agendamento"
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </Link>
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  Seu Próximo Estilo
                </h3>
                {proximos.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>}
              </div>

              {proximos.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800/30 rounded-3xl p-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800 mb-2">
                     <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                  </div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Nenhum agendamento futuro</p>
                  <Link
                    href={`${base}/agendar`}
                    className="inline-block px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800
                               text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all"
                  >
                    Agendar agora
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {proximos.map((a: any) => (
                    <div key={a.id} className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-6 space-y-5 backdrop-blur-sm relative overflow-hidden group">
                      <div className="flex items-start justify-between gap-2 relative z-10">
                        <div>
                          <p className="text-white font-black text-lg uppercase italic tracking-tighter leading-tight">{a.servicos?.nome ?? '—'}</p>
                          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Profissional: <span className="text-zinc-400">{a.barbeiros?.nome ?? '—'}</span></p>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shrink-0 border border-white/5 ${STATUS_COR[a.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                          {STATUS_LABEL[a.status] ?? a.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between relative z-10 pt-2 border-t border-zinc-800/30">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700/30">
                              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                           </div>
                           <p className="text-zinc-400 text-[11px] font-black uppercase italic tracking-tighter">{formatarDataHora(a.data_hora_inicio)}</p>
                        </div>
                        {a.preco_cobrado != null && (
                          <p className="text-amber-500 text-lg font-black tracking-tighter italic">
                            {formatarPreco(Number(a.preco_cobrado))}
                          </p>
                        )}
                      </div>

                      <div className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">
                        <BotoesAgendamentoCliente
                          agendamentoId={a.id}
                          status={a.status}
                          slug={slug}
                          basePath={base}
                        />
                      </div>

                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-amber-500/10 transition-all duration-500"></div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Link
              href={`${base}/meus-agendamentos`}
              className="flex items-center justify-between w-full bg-zinc-950 hover:bg-zinc-900
                         border border-zinc-900 rounded-2xl px-6 py-5 transition-all group"
            >
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-zinc-300 transition-colors">Ver histórico de agendamentos</span>
              <svg className="w-5 h-5 text-zinc-700 group-hover:translate-x-1 group-hover:text-amber-500 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}
      </main>
      
      <footer className="max-w-lg mx-auto px-4 py-12 text-center text-zinc-800 text-[8px] font-black uppercase tracking-[0.4em]">
         Desenvolvido por RM Barbearia &copy; 2026
      </footer>
    </div>
  )
}
