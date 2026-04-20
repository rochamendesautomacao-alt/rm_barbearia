'use client'

import { useState, useEffect, useRef } from 'react'
import { criarAgendamentoAdmin } from '@/app/actions/agendamentos'
import { criarCliente, buscarClientes } from '@/app/actions/clientes'

interface Barbeiro { id: string; nome: string }
interface Servico  { id: string; nome: string; duracao_minutos: number; preco: number }
interface ClienteItem { id: string; nome: string; telefone: string }

interface Props {
  empresaId: string
  barbeiros: Barbeiro[]
  servicos:  Servico[]
  onFinalizar: () => void
}

function hoje() {
  return new Date().toISOString().split('T')[0]
}

function formatarTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return v
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

const inputCls = `w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3
  text-white placeholder-zinc-600 text-sm
  focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent`

// ─── Busca + mini-cadastro de cliente ────────────────────────────────────────
function BuscaCliente({
  empresaId,
  onSelecionar,
}: {
  empresaId: string
  onSelecionar: (c: ClienteItem) => void
}) {
  const [q,           setQ]           = useState('')
  const [resultados,  setResultados]  = useState<ClienteItem[]>([])
  const [selecionado, setSelecionado] = useState<ClienteItem | null>(null)
  const [showNovo,    setShowNovo]    = useState(false)
  const [buscando,    setBuscando]    = useState(false)
  const [telNovo,     setTelNovo]     = useState('')
  const [erroNovo,    setErroNovo]    = useState('')
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (q.length < 2) { setResultados([]); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setBuscando(true)
      const res = await buscarClientes(q, empresaId)
      setResultados(res as ClienteItem[])
      setBuscando(false)
    }, 350)
  }, [q, empresaId])

  function selecionar(c: ClienteItem) {
    setSelecionado(c)
    setQ('')
    setResultados([])
    setShowNovo(false)
    onSelecionar(c)
  }

  async function handleCadastroRapido(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErroNovo('')
    const fd = new FormData(e.currentTarget)
    const resultado = await criarCliente(fd)
    if (resultado?.erro) { setErroNovo(resultado.erro); return }

    // re-busca pelo nome para pegar o id
    const novos = await buscarClientes(
      (fd.get('nome') as string)?.trim() ?? '',
      empresaId
    ) as ClienteItem[]
    if (novos.length > 0) selecionar(novos[0])
  }

  if (selecionado) {
    return (
      <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
        <div>
          <p className="text-white text-sm font-medium">{selecionado.nome}</p>
          <p className="text-zinc-400 text-xs">{formatarTelefone(selecionado.telefone)}</p>
        </div>
        <button
          type="button"
          onClick={() => { setSelecionado(null); onSelecionar(null as any) }}
          className="text-zinc-500 hover:text-red-400 text-xs transition-colors"
        >
          Trocar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className={inputCls}
        />
        {buscando && (
          <span className="absolute right-3 top-3 text-zinc-500 text-xs">...</span>
        )}
      </div>

      {resultados.length > 0 && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
          {resultados.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => selecionar(c)}
              className="w-full text-left px-4 py-2.5 hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-0"
            >
              <p className="text-white text-sm">{c.nome}</p>
              <p className="text-zinc-500 text-xs">{formatarTelefone(c.telefone)}</p>
            </button>
          ))}
        </div>
      )}

      {q.length >= 2 && resultados.length === 0 && !buscando && (
        <button
          type="button"
          onClick={() => setShowNovo(true)}
          className="w-full py-2 text-amber-400 hover:text-amber-300 text-xs transition-colors"
        >
          + Cadastrar novo cliente
        </button>
      )}

      {showNovo && (
        <form onSubmit={handleCadastroRapido} className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 space-y-2">
          <p className="text-white text-xs font-medium">Novo cliente</p>
          <input name="nome" placeholder="Nome *" required minLength={2} className={inputCls} />
          <input
            name="telefone"
            value={telNovo}
            onChange={e => setTelNovo(formatarTelefone(e.target.value))}
            placeholder="Telefone *"
            required
            className={inputCls}
          />
          <input name="email" type="email" placeholder="E-mail (opcional)" className={inputCls} />
          {erroNovo && <p className="text-red-400 text-xs">{erroNovo}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl py-2 text-xs"
            >
              Cadastrar
            </button>
            <button
              type="button"
              onClick={() => setShowNovo(false)}
              className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-400 rounded-xl text-xs"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── FormAgendamento principal ────────────────────────────────────────────────
export default function FormAgendamento({ empresaId, barbeiros, servicos, onFinalizar }: Props) {
  const [clienteId,  setClienteId]  = useState('')
  const [barbeiroId, setBarbeiroId] = useState('')
  const [servicoId,  setServicoId]  = useState('')
  const [data,       setData]       = useState(hoje())
  const [slot,       setSlot]       = useState('')
  const [slots,      setSlots]      = useState<{ hora_inicio: string }[]>([])
  const [carregando, setCarregando] = useState(false)
  const [enviando,   setEnviando]   = useState(false)
  const [erro,       setErro]       = useState('')

  // Busca slots quando barbeiro + serviço + data estiverem selecionados
  useEffect(() => {
    setSlot('')
    setSlots([])
    if (!barbeiroId || !servicoId || !data || !empresaId) return

    setCarregando(true)
    fetch(
      `/api/disponibilidade?empresa_id=${empresaId}&barbeiro_id=${barbeiroId}&servico_id=${servicoId}&data=${data}`
    )
      .then(r => r.json())
      .then(d => setSlots(Array.isArray(d.slots) ? d.slots : []))
      .finally(() => setCarregando(false))
  }, [barbeiroId, servicoId, data, empresaId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    if (!clienteId) { setErro('Selecione um cliente'); return }
    if (!slot)      { setErro('Selecione um horário');  return }

    setEnviando(true)
    const fd = new FormData(e.currentTarget)
    fd.set('cliente_id',       clienteId)
    fd.set('data_hora_inicio', slot)

    const resultado = await criarAgendamentoAdmin(fd)
    setEnviando(false)

    if (resultado?.erro) {
      setErro(resultado.erro)
    } else {
      onFinalizar()
    }
  }

  const selectCls = `w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3
    text-white text-sm appearance-none
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cliente */}
      <div>
        <label className="text-xs text-zinc-400 mb-1.5 block">Cliente *</label>
        <BuscaCliente
          empresaId={empresaId}
          onSelecionar={c => setClienteId(c?.id ?? '')}
        />
      </div>

      {/* Barbeiro */}
      <div>
        <label className="text-xs text-zinc-400 mb-1.5 block">Barbeiro *</label>
        <select
          name="barbeiro_id"
          value={barbeiroId}
          onChange={e => setBarbeiroId(e.target.value)}
          required
          className={selectCls}
        >
          <option value="">Selecione...</option>
          {barbeiros.map(b => (
            <option key={b.id} value={b.id}>{b.nome}</option>
          ))}
        </select>
      </div>

      {/* Serviço */}
      <div>
        <label className="text-xs text-zinc-400 mb-1.5 block">Serviço *</label>
        <select
          name="servico_id"
          value={servicoId}
          onChange={e => setServicoId(e.target.value)}
          required
          className={selectCls}
        >
          <option value="">Selecione...</option>
          {servicos.map(s => (
            <option key={s.id} value={s.id}>
              {s.nome} — {s.duracao_minutos}min — {s.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </option>
          ))}
        </select>
      </div>

      {/* Data */}
      <div>
        <label className="text-xs text-zinc-400 mb-1.5 block">Data *</label>
        <input
          type="date"
          value={data}
          min={hoje()}
          onChange={e => setData(e.target.value)}
          required
          className={inputCls}
        />
      </div>

      {/* Horários disponíveis */}
      {(barbeiroId && servicoId && data) && (
        <div>
          <label className="text-xs text-zinc-400 mb-1.5 block">Horário *</label>
          {carregando ? (
            <p className="text-zinc-500 text-xs py-2">Buscando horários...</p>
          ) : slots.length === 0 ? (
            <p className="text-zinc-500 text-xs py-2">Nenhum horário disponível para esta data.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map(s => (
                <button
                  key={s.hora_inicio}
                  type="button"
                  onClick={() => setSlot(s.hora_inicio)}
                  className={[
                    'py-2 rounded-xl text-xs font-medium transition-colors',
                    slot === s.hora_inicio
                      ? 'bg-amber-500 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                  ].join(' ')}
                >
                  {formatarHora(s.hora_inicio)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Observações */}
      <div>
        <label className="text-xs text-zinc-400 mb-1.5 block">
          Observações <span className="text-zinc-600">(opcional)</span>
        </label>
        <textarea
          name="observacoes"
          placeholder="Preferências, alergias..."
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </div>

      {erro && <p className="text-red-400 text-xs">{erro}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={enviando || !clienteId || !slot}
          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800
                     disabled:text-zinc-600 text-black font-semibold
                     rounded-xl py-3 text-sm transition-colors"
        >
          {enviando ? 'Agendando...' : 'Confirmar agendamento'}
        </button>
        <button
          type="button"
          onClick={onFinalizar}
          disabled={enviando}
          className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                     hover:text-white rounded-xl text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
