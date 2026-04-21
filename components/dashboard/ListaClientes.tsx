'use client'

import { useState } from 'react'
import { criarCliente, editarCliente } from '@/app/actions/clientes'

interface Cliente {
  id:          string
  nome:        string
  telefone:    string
  email:       string | null
  observacoes?: string | null
  visitas:     number
}

interface Props {
  clientes:  Cliente[]
  empresaId: string
}

function formatarTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return v
}

const inputCls = `w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-3
  text-white placeholder-zinc-600 text-sm
  focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/50
  transition-all duration-200`

function FormCliente({
  cliente,
  onFinalizar,
}: {
  cliente?: Cliente
  onFinalizar: () => void
}) {
  const [erro,     setErro]     = useState('')
  const [enviando, setEnviando] = useState(false)
  const [telefone, setTelefone] = useState(
    cliente ? formatarTelefone(cliente.telefone) : ''
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setEnviando(true)

    const fd = new FormData(e.currentTarget)
    const resultado = cliente
      ? await editarCliente(cliente.id, fd)
      : await criarCliente(fd)

    setEnviando(false)

    if (resultado?.erro) {
      setErro(resultado.erro)
    } else {
      onFinalizar()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-zinc-400 font-medium mb-1 block">Nome *</label>
        <input
          name="nome"
          defaultValue={cliente?.nome}
          placeholder="João Silva"
          required
          minLength={2}
          className={inputCls}
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400 font-medium mb-1 block">Telefone *</label>
        <input
          name="telefone"
          value={telefone}
          onChange={e => setTelefone(formatarTelefone(e.target.value))}
          placeholder="(11) 99999-9999"
          required
          className={inputCls}
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400 font-medium mb-1 block">
          E-mail <span className="text-zinc-600">(opcional)</span>
        </label>
        <input
          name="email"
          type="email"
          defaultValue={cliente?.email ?? ''}
          placeholder="joao@email.com"
          className={inputCls}
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400 font-medium mb-1 block">
          Observações <span className="text-zinc-600">(opcional)</span>
        </label>
        <textarea
          name="observacoes"
          defaultValue={cliente?.observacoes ?? ''}
          placeholder="Alergias, preferências..."
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </div>

      {erro && <p className="text-red-400 text-xs">{erro}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700
                     disabled:text-zinc-500 text-black font-bold
                     rounded-xl py-2.5 text-sm transition-all duration-200 active:scale-[0.98]"
        >
          {enviando ? 'Salvando...' : cliente ? 'Salvar alterações' : 'Adicionar cliente'}
        </button>
        <button
          type="button"
          onClick={onFinalizar}
          disabled={enviando}
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                     hover:text-white rounded-xl text-sm font-medium transition-all duration-200"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function ListaClientes({ clientes, empresaId }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [lista,    setLista]    = useState(clientes)

  function abrirEdicao(c: Cliente) {
    setEditando(c)
    setShowForm(true)
  }

  function fecharForm() {
    setShowForm(false)
    setEditando(null)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <button
          onClick={() => { setEditando(null); setShowForm(true) }}
          className="w-full py-3.5 border border-dashed border-zinc-700/60 hover:border-amber-500/40
                     rounded-2xl text-zinc-500 hover:text-amber-400 text-sm font-medium
                     hover:bg-amber-500/5 transition-all duration-200"
        >
          + Adicionar cliente
        </button>
      )}

      {showForm && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/20">
          <h3 className="text-white font-bold text-sm mb-4 tracking-tight">
            {editando ? 'Editar cliente' : 'Novo cliente'}
          </h3>
          <FormCliente cliente={editando ?? undefined} onFinalizar={fecharForm} />
        </div>
      )}

      <div className="space-y-2">
        {lista.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">Nenhum cliente cadastrado ainda.</p>
            <p className="text-zinc-600 text-xs mt-1">Adicione o primeiro cliente acima.</p>
          </div>
        )}

        {lista.map(c => (
          <div
            key={c.id}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4
                       transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/50"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-800 ring-1 ring-zinc-700 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">
                {c.nome.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{c.nome}</p>
              <p className="text-zinc-400 text-xs">{formatarTelefone(c.telefone)}</p>
              {c.email && <p className="text-zinc-600 text-xs truncate">{c.email}</p>}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-white text-sm font-black">{c.visitas}</p>
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest">visitas</p>
              </div>
              <button
                onClick={() => abrirEdicao(c)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                           hover:text-white rounded-xl text-xs font-medium transition-all duration-200"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
