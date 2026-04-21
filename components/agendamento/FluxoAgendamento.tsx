'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PassoServico from './PassoServico'
import PassoBarbeiro from './PassoBarbeiro'
import PassoData from './PassoData'
import PassoHorario from './PassoHorario'
import PassoCliente from './PassoCliente'

export interface Servico {
  id: string
  nome: string
  descricao: string | null
  duracao_minutos: number
  preco: number
}

export interface Barbeiro {
  id: string
  nome: string
  foto_url: string | null
  bio: string | null
}

interface Empresa {
  id: string
  nome: string
  slug: string
  logo_url: string | null
  cor_primaria: string
}

export interface ClienteLogado {
  id: string
  nome: string
  telefone: string
  email: string | null
}

interface Props {
  empresa:          Empresa
  servicos:         Servico[]
  barbeiros:        Barbeiro[]
  diasAtivos:       number[]
  basePath?:           string
  clienteLogado?:      ClienteLogado
  reagendarId?:        string
  initialServico?:     Servico
  initialBarbeiro?:    Barbeiro
  cancelarReagendar?:  (id: string) => Promise<{ ok?: boolean; erro?: string } | undefined>
}

export interface EstadoAgendamento {
  servico:  Servico | null
  barbeiro: Barbeiro | null
  data:     string | null   // YYYY-MM-DD
  slot:     string | null   // ISO datetime
  slot_fim: string | null
}

const PASSOS = ['Serviço', 'Barbeiro', 'Data', 'Horário', 'Confirmar']

export default function FluxoAgendamento({
  empresa, servicos, barbeiros, diasAtivos,
  basePath, clienteLogado,
  reagendarId, initialServico, initialBarbeiro,
  cancelarReagendar,
}: Props) {
  const base = basePath ?? `/${empresa.slug}`
  const router  = useRouter()
  const isReagendar = Boolean(reagendarId && initialServico && initialBarbeiro)

  const [passo, setPasso] = useState(() => isReagendar ? 2 : 0)
  const [estado, setEstado] = useState<EstadoAgendamento>({
    servico:  initialServico  ?? null,
    barbeiro: initialBarbeiro ?? null,
    data:     null,
    slot:     null,
    slot_fim: null,
  })
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  function avancar() { setPasso(p => Math.min(p + 1, PASSOS.length - 1)) }
  function voltar()  {
    if (isReagendar && passo === 2) { router.back(); return }
    setPasso(p => Math.max(p - 1, 0))
    setErroEnvio(null)
  }

  function selecionarServico(s: Servico) {
    setEstado(e => ({ ...e, servico: s, barbeiro: null, data: null, slot: null, slot_fim: null }))
    avancar()
  }

  function selecionarBarbeiro(b: Barbeiro) {
    setEstado(e => ({ ...e, barbeiro: b, data: null, slot: null, slot_fim: null }))
    avancar()
  }

  function selecionarData(data: string) {
    setEstado(e => ({ ...e, data, slot: null, slot_fim: null }))
    avancar()
  }

  function selecionarSlot(inicio: string, fim: string) {
    setEstado(e => ({ ...e, slot: inicio, slot_fim: fim }))
    avancar()
  }

  async function confirmar(cliente: { nome: string; telefone: string; email?: string }) {
    if (!estado.servico || !estado.barbeiro || !estado.slot) return
    setEnviando(true)
    setErroEnvio(null)

    try {
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id:       empresa.id,
          barbeiro_id:      estado.barbeiro.id,
          servico_id:       estado.servico.id,
          data_hora_inicio: estado.slot,
          cliente_nome:     cliente.nome,
          cliente_telefone: cliente.telefone,
          cliente_email:    cliente.email,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setErroEnvio(json.erro ?? 'Erro ao criar agendamento')
        return
      }

      if (reagendarId && cancelarReagendar) {
        await cancelarReagendar(reagendarId).catch(() => null)
      }

      router.push(`${base}/confirmacao?id=${json.agendamento.id}`)
    } catch {
      setErroEnvio('Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Indicador de passos */}
      <nav aria-label="Passos do agendamento" className="px-2">
        <ol className="flex items-center justify-between w-full">
          {PASSOS.map((nome, i) => (
            <li key={nome} className="flex flex-col items-center gap-2 group relative">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 z-10',
                  i < passo  
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-90' 
                    : '',
                  i === passo 
                    ? 'bg-amber-500 text-black ring-4 ring-amber-500/20 scale-110 shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
                    : '',
                  i > passo  
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-600' 
                    : '',
                ].join(' ')}
              >
                {i < passo ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={[
                'text-[9px] uppercase tracking-widest font-black transition-all duration-300 whitespace-nowrap',
                i === passo ? 'text-amber-500 opacity-100' : 'text-zinc-600 opacity-50 group-hover:opacity-80',
              ].join(' ')}>
                {nome}
              </span>
              
              {/* Linha conectora */}
              {i < PASSOS.length - 1 && (
                <div 
                  className="absolute left-[50%] top-4 w-[100%] h-[2px] -z-0"
                  style={{ width: 'calc(100% * 1.5)' }}
                >
                  <div className={[
                    'h-full transition-all duration-700 ease-out',
                    i < passo ? 'bg-amber-500' : 'bg-zinc-800'
                  ].join(' ')} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Banner de reagendamento */}
      {isReagendar && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl px-5 py-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-amber-500 text-sm font-bold">Reagendamento em curso</p>
            <p className="text-amber-500/60 text-xs mt-0.5">
              Defina o novo horário para <span className="font-bold text-amber-500/90">{estado.servico?.nome}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo do passo atual com animação */}
      <div className="min-h-[450px] relative">
        <div key={passo} className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
          {passo === 0 && (
            <PassoServico servicos={servicos} onSelecionar={selecionarServico} />
          )}
          {passo === 1 && (
            <PassoBarbeiro
              barbeiros={barbeiros}
              onSelecionar={selecionarBarbeiro}
              onVoltar={voltar}
            />
          )}
          {passo === 2 && (
            <PassoData diasAtivos={diasAtivos} onSelecionar={selecionarData} onVoltar={voltar} />
          )}
          {passo === 3 && estado.servico && estado.barbeiro && estado.data && (
            <PassoHorario
              empresaId={empresa.id}
              barbeiroId={estado.barbeiro.id}
              servicoId={estado.servico.id}
              data={estado.data}
              onSelecionar={selecionarSlot}
              onVoltar={voltar}
            />
          )}
          {passo === 4 && (
            <PassoCliente
              estado={estado}
              enviando={enviando}
              erro={erroEnvio}
              clienteLogado={clienteLogado}
              onConfirmar={confirmar}
              onVoltar={voltar}
            />
          )}
        </div>
      </div>
    </div>
  )
}
