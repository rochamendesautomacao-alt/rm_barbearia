'use client'

import { useState } from 'react'
import { toggleBarbeiro } from '@/app/actions/barbeiros'
import FormBarbeiro from './FormBarbeiro'

interface Barbeiro {
  id:         string
  nome:       string
  bio:        string | null
  telefone:   string | null
  ativo:      boolean
  usuario_id: string | null
}

export default function ListaBarbeiros({ barbeiros }: { barbeiros: Barbeiro[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Barbeiro | null>(null)
  const [lista, setLista]       = useState(barbeiros)

  function abrirEdicao(b: Barbeiro) {
    setEditando(b)
    setShowForm(true)
  }

  function fecharForm() {
    setShowForm(false)
    setEditando(null)
    window.location.reload()
  }

  async function handleToggle(id: string, ativo: boolean) {
    await toggleBarbeiro(id, !ativo)
    setLista(l => l.map(b => b.id === id ? { ...b, ativo: !ativo } : b))
  }

  return (
    <div className="space-y-4">
      {/* Botão adicionar */}
      {!showForm && (
        <button
          onClick={() => { setEditando(null); setShowForm(true) }}
          className="w-full py-3.5 border border-dashed border-zinc-700/60 hover:border-amber-500/40
                     rounded-2xl text-zinc-500 hover:text-amber-400 text-sm font-medium
                     hover:bg-amber-500/5 transition-all duration-200"
        >
          + Adicionar barbeiro
        </button>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/20">
          <h3 className="text-white font-bold text-sm mb-4 tracking-tight">
            {editando ? 'Editar barbeiro' : 'Novo barbeiro'}
          </h3>
          <FormBarbeiro barbeiro={editando ?? undefined} onFinalizar={fecharForm} />
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {lista.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">Nenhum barbeiro cadastrado ainda.</p>
            <p className="text-zinc-600 text-xs mt-1">Adicione o primeiro barbeiro acima.</p>
          </div>
        )}

        {lista.map(b => (
          <div
            key={b.id}
            className={[
              'bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4',
              'transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/50',
              !b.ativo ? 'opacity-50' : '',
            ].join(' ')}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-zinc-800 ring-1 ring-zinc-700 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">
                {b.nome.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{b.nome}</p>
              {b.bio && <p className="text-zinc-500 text-xs truncate mt-0.5">{b.bio}</p>}
              {b.telefone && <p className="text-zinc-600 text-xs mt-0.5">{b.telefone}</p>}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => abrirEdicao(b)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                           hover:text-white rounded-xl text-xs font-medium transition-all duration-200"
              >
                Editar
              </button>
              <button
                onClick={() => handleToggle(b.id, b.ativo)}
                className={[
                  'px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200',
                  b.ativo
                    ? 'bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400'
                    : 'bg-green-900/30 hover:bg-green-900/50 text-green-500',
                ].join(' ')}
              >
                {b.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
