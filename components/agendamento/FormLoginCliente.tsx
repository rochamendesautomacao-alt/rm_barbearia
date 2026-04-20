'use client'

import { useState } from 'react'
import { loginCliente } from '@/app/actions/clientes'

export default function FormLoginCliente({ slug }: { slug: string }) {
  const [erro,     setErro]     = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const fd = new FormData(e.currentTarget)
    const resultado = await loginCliente(slug, fd)
    setEnviando(false)
    if (resultado?.erro) setErro(resultado.erro)
  }

  const inputCls = `w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3
    text-white placeholder-zinc-600 text-sm
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-zinc-300 mb-1 block">E-mail</label>
        <input
          name="email"
          type="email"
          required
          placeholder="voce@email.com"
          className={inputCls}
        />
      </div>
      <div>
        <label className="text-sm text-zinc-300 mb-1 block">Senha</label>
        <input
          name="senha"
          type="password"
          required
          placeholder="••••••"
          className={inputCls}
        />
      </div>

      {erro && <p className="text-red-400 text-sm">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800
                   disabled:text-zinc-600 text-black font-semibold
                   rounded-xl py-4 text-sm transition-all active:scale-[0.98]"
      >
        {enviando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
