'use client'

import { useState } from 'react'
import { loginCliente, loginClientePorTelefone } from '@/app/actions/clientes'

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
  loginAction?:         ActionFn
  loginTelefoneAction?: ActionFn
}

export default function FormLoginCliente({
  slug,
  loginAction         = loginCliente,
  loginTelefoneAction = loginClientePorTelefone,
}: Props) {
  const [modo,     setModo]     = useState<'email' | 'telefone'>('email')
  const [telefone, setTelefone] = useState('')
  const [erro,     setErro]     = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const fd = new FormData(e.currentTarget)
    const resultado = modo === 'email'
      ? await loginAction(slug, fd)
      : await loginTelefoneAction(slug, fd)
    setEnviando(false)
    if (resultado?.erro) setErro(resultado.erro)
  }

  const inputCls = `w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3
    text-white placeholder-zinc-600 text-sm
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent`

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-1 gap-1">
        {(['email', 'telefone'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setModo(m); setErro('') }}
            className={[
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              modo === m ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
            {m === 'email' ? 'E-mail' : 'Telefone'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {modo === 'email' ? (
          <div>
            <label className="text-sm text-zinc-300 mb-1 block">E-mail</label>
            <input name="email" type="email" required placeholder="voce@email.com" className={inputCls} />
          </div>
        ) : (
          <div>
            <label className="text-sm text-zinc-300 mb-1 block">WhatsApp / Telefone</label>
            <input
              name="telefone"
              value={telefone}
              onChange={e => setTelefone(formatarTelefone(e.target.value))}
              required
              placeholder="(11) 99999-9999"
              className={inputCls}
            />
          </div>
        )}

        <div>
          <label className="text-sm text-zinc-300 mb-1 block">Senha</label>
          <input name="senha" type="password" required placeholder="••••••" className={inputCls} />
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
    </div>
  )
}
