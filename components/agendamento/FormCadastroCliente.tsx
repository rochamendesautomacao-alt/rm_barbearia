'use client'

import { useState } from 'react'
import { cadastrarCliente } from '@/app/actions/clientes'

type ActionFn = (slug: string, fd: FormData) => Promise<{ erro?: string } | undefined>

function formatarTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return v
}

interface Props {
  slug: string
  cadastrarAction?: ActionFn
}

export default function FormCadastroCliente({
  slug,
  cadastrarAction = cadastrarCliente,
}: Props) {
  const [telefone, setTelefone] = useState('')
  const [erro,     setErro]     = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const fd = new FormData(e.currentTarget)
    const resultado = await cadastrarAction(slug, fd)
    setEnviando(false)
    if (resultado?.erro) setErro(resultado.erro)
  }

  const inputCls = `w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3
    text-white placeholder-zinc-600 text-sm
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-zinc-300 mb-1 block">Nome *</label>
        <input name="nome" required minLength={2} placeholder="João Silva" className={inputCls} />
      </div>
      <div>
        <label className="text-sm text-zinc-300 mb-1 block">WhatsApp / Telefone *</label>
        <input
          name="telefone"
          value={telefone}
          onChange={e => setTelefone(formatarTelefone(e.target.value))}
          required
          placeholder="(11) 99999-9999"
          className={inputCls}
        />
      </div>
      <div>
        <label className="text-sm text-zinc-300 mb-1 block">E-mail *</label>
        <input name="email" type="email" required placeholder="voce@email.com" className={inputCls} />
      </div>
      <div>
        <label className="text-sm text-zinc-300 mb-1 block">Senha *</label>
        <input
          name="senha"
          type="password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
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
        {enviando ? 'Criando conta...' : 'Criar conta'}
      </button>
    </form>
  )
}
