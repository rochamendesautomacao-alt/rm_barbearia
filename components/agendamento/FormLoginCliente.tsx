'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { formatarTelefone } from '@/lib/format'
import { loginCliente, loginClientePorTelefone } from '@/app/actions/clientes'

type ActionFn = (slug: string, fd: FormData) => Promise<{ erro?: string } | undefined>

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
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    const fd = new FormData(e.currentTarget)
    
    try {
      const resultado = modo === 'email'
        ? await loginAction(slug, fd)
        : await loginTelefoneAction(slug, fd)
      
      if (resultado?.erro) {
        toast.error(resultado.erro)
      } else {
        toast.success('Bem-vindo de volta!')
      }
    } catch (err) {
      toast.error('Erro ao entrar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const inputCls = `w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3
    text-white placeholder-zinc-600 text-sm transition-all
    focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500`

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-1 gap-1">
        {(['email', 'telefone'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setModo(m) }}
            className={[
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              modo === m ? 'bg-zinc-800 text-amber-500 shadow-lg' : 'text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
            {m === 'email' ? 'E-mail' : 'Telefone'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {modo === 'email' ? (
          <div className="space-y-1">
            <label className="text-sm text-zinc-400 ml-1">E-mail</label>
            <input name="email" type="email" required placeholder="voce@email.com" className={inputCls} />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-sm text-zinc-400 ml-1">WhatsApp / Telefone</label>
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

        <div className="space-y-1">
          <label className="text-sm text-zinc-400 ml-1">Senha</label>
          <input name="senha" type="password" required placeholder="••••••" className={inputCls} />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800
                     disabled:text-zinc-600 text-black font-bold
                     rounded-xl py-4 text-sm transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
        >
          {enviando ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
