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

interface Props {
  empresa:    Empresa
  servicos:   Servico[]
  barbeiros:  Barbeiro[]
  diasAtivos: number[]   // dias da semana com horário configurado (0=Dom..6=Sáb)
}

export interface EstadoAgendamento {
  servico:  Servico | null
  barbeiro: Barbeiro | null
  data:     string | null   // YYYY-MM-DD
  slot:     string | null   // ISO datetime
  slot_fim: string | null
}

const PASSOS = ['Serviço', 'Barbeiro', 'Data', 'Horário', 'Confirmar']

export default function FluxoAgendamento({ empresa, servicos, barbeiros, diasAtivos }: Props) {
  const router  = useRouter()
  const [passo, setPasso] = useState(0)
  const [estado, setEstado] = useState<EstadoAgendamento>({
    servico:  null,
    barbeiro: null,
    data:     null,
    slot:     null,
    slot_fim: null,
  })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro]         = useState<string | null>(null)

  function avancar() { setPasso(p => Math.min(p + 1, PASSOS.length - 1)) }
  function voltar()  { setPasso(p => Math.max(p - 1, 0)); setErro(null) }

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
    setErro(null)

    try {
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id:      empresa.id,
          barbeiro_id:     estado.barbeiro.id,
          servico_id:      estado.servico.id,
          data_hora_inicio: estado.slot,
          cliente_nome:    cliente.nome,
          cliente_telefone: cliente.telefone,
          cliente_email:   cliente.email,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setErro(json.erro ?? 'Erro ao criar agendamento')
        return
      }

      router.push(`/${empresa.slug}/confirmacao?id=${json.agendamento.id}`)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Indicador de passos */}
      <nav aria-label="Passos do agendamento">
        <ol className="flex items-center gap-0">
          {PASSOS.map((nome, i) => (
            <li key={nome} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    i < passo  ? 'bg-amber-500 text-black'           : '',
                    i === passo ? 'bg-amber-500 text-black ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-950' : '',
                    i > passo  ? 'bg-zinc-800 text-zinc-500'         : '',
                  ].join(' ')}
                >
                  {i < passo ? '✓' : i + 1}
                </div>
                <span className={[
                  'text-[10px] hidden sm:block',
                  i === passo ? 'text-amber-500 font-medium' : 'text-zinc-600',
                ].join(' ')}>
                  {nome}
                </span>
              </div>
              {i < PASSOS.length - 1 && (
                <div className={[
                  'flex-1 h-px mx-1 transition-colors',
                  i < passo ? 'bg-amber-500' : 'bg-zinc-800',
                ].join(' ')} />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Erro global */}
      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
          {erro}
        </div>
      )}

      {/* Conteúdo do passo atual */}
      <div className="min-h-[400px]">
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
            onConfirmar={confirmar}
            onVoltar={voltar}
          />
        )}
      </div>
    </div>
  )
}
