'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { formatarTelefone } from '@/lib/format'
import { cadastrarCliente } from '@/app/actions/clientes'

type ActionFn = (slug: string, fd: FormData) => Promise<{ erro?: string } | undefined>

interface Props {
  slug: string
  cadastrarAction?: ActionFn
}

export default function FormCadastroCliente({
  slug,
  cadastrarAction = cadastrarCliente,
}: Props) {
  const [telefone, setTelefone] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    const fd = new FormData(e.currentTarget)
    
    try {
      const resultado = await cadastrarAction(slug, fd)
      if (resultado?.erro) {
        toast.error(resultado.erro)
      } else {
        toast.success('Conta criada com sucesso!')
      }
    } catch (err) {
      toast.error('Erro ao criar conta. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const inputCls = `w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3
    text-white placeholder-zinc-600 text-sm transition-all
    focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm text-zinc-400 ml-1">Nome completo *</label>
        <input name="nome" required minLength={2} placeholder="João Silva" className={inputCls} />
      </div>
      
      <div className="space-y-1">
        <label className="text-sm text-zinc-400 ml-1">WhatsApp / Telefone *</label>
        <input
          name="telefone"
          value={telefone}
          onChange={e => setTelefone(formatarTelefone(e.target.value))}
          required
          placeholder="(11) 99999-9999"
          className={inputCls}
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-sm text-zinc-400 ml-1">E-mail *</label>
        <input name="email" type="email" required placeholder="voce@email.com" className={inputCls} />
      </div>
      
      <div className="space-y-1">
        <label className="text-sm text-zinc-400 ml-1">Senha *</label>
        <input
          name="senha"
          type="password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800
                   disabled:text-zinc-600 text-black font-bold
                   rounded-xl py-4 text-sm transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
      >
        {enviando ? 'Criando conta...' : 'Criar conta'}
      </button>
    </form>
  )
}
