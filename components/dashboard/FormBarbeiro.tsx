'use client'

import { useState, useRef } from 'react'
import { criarBarbeiro, editarBarbeiro } from '@/app/actions/barbeiros'

interface Barbeiro {
  id:       string
  nome:     string
  bio:      string | null
  telefone: string | null
}

interface Props {
  barbeiro?: Barbeiro
  onFinalizar: () => void
}

const inputCls = `w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2.5
  text-white placeholder-zinc-600 text-sm
  focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/50
  transition-all duration-200`

export default function FormBarbeiro({ barbeiro, onFinalizar }: Props) {
  const [erro,    setErro]    = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    const fd  = new FormData(e.currentTarget)
    const res = barbeiro
      ? await editarBarbeiro(barbeiro.id, fd)
      : await criarBarbeiro(fd)

    setLoading(false)

    if (res?.erro) { setErro(res.erro); return }

    formRef.current?.reset()
    onFinalizar()
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {erro && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {erro}
        </p>
      )}

      <div className="space-y-1.5">
        <label className="text-xs text-zinc-400 font-medium">Nome *</label>
        <input
          name="nome"
          required
          defaultValue={barbeiro?.nome}
          placeholder="Nome do barbeiro"
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-zinc-400 font-medium">Telefone</label>
        <input
          name="telefone"
          defaultValue={barbeiro?.telefone ?? ''}
          placeholder="(11) 99999-9999"
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-zinc-400 font-medium">Bio</label>
        <textarea
          name="bio"
          rows={2}
          defaultValue={barbeiro?.bio ?? ''}
          placeholder="Especialidades, anos de experiência..."
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onFinalizar}
          className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-sm font-medium transition-all duration-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                     text-black font-bold rounded-xl text-sm transition-all duration-200 active:scale-[0.98]"
        >
          {loading ? 'Salvando...' : barbeiro ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}
