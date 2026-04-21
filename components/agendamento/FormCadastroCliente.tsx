'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatarTelefone } from '@/lib/format'
import { cadastrarClienteOtp, verificarOtp } from '@/app/actions/clientes'

type CadastrarFn = (
  slug: string,
  fd: FormData,
) => Promise<{ email: string } | { erro: string }>

type VerificarFn = (
  slug: string,
  fd: FormData,
) => Promise<{ erro: string } | undefined>

interface Props {
  slug: string
  cadastrarAction?: CadastrarFn
  verificarAction?: VerificarFn
}

function mascaraEmail(email: string): string {
  const [local, domain] = email.split('@')
  const visivel = local.slice(0, 2)
  return `${visivel}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`
}

export default function FormCadastroCliente({
  slug,
  cadastrarAction = cadastrarClienteOtp,
  verificarAction = verificarOtp,
}: Props) {
  const [step,       setStep]       = useState<'dados' | 'otp'>('dados')
  const [telefone,   setTelefone]   = useState('')
  const [emailOtp,   setEmailOtp]   = useState('')
  const [token,      setToken]      = useState('')
  const [enviando,   setEnviando]   = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [cooldown,   setCooldown]   = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleCadastrar(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    const fd = new FormData(e.currentTarget)
    try {
      const resultado = await cadastrarAction(slug, fd)
      if ('erro' in resultado) {
        toast.error(resultado.erro)
      } else {
        setEmailOtp(resultado.email)
        setCooldown(30)
        setStep('otp')
      }
    } catch {
      toast.error('Erro ao criar conta. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function handleVerificar(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    const fd = new FormData(e.currentTarget)
    try {
      const resultado = await verificarAction(slug, fd)
      if (resultado?.erro) {
        toast.error(resultado.erro)
        setToken('')
      }
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'digest' in err &&
        String((err as { digest: unknown }).digest).startsWith('NEXT_REDIRECT')
      ) throw err
      toast.error('Erro ao verificar código. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function handleReenviar() {
    if (cooldown > 0 || reenviando) return
    setReenviando(true)
    const fd = new FormData()
    fd.set('modo', 'email')
    fd.set('email', emailOtp)
    try {
      // Reutiliza solicitarOtp com shouldCreateUser=false — apenas reenvia o código
      const { solicitarOtp } = await import('@/app/actions/clientes')
      const resultado = await solicitarOtp(slug, fd)
      if ('erro' in resultado) {
        toast.error(resultado.erro)
      } else {
        setCooldown(30)
        toast.success('Código reenviado!')
      }
    } catch {
      toast.error('Erro ao reenviar.')
    } finally {
      setReenviando(false)
    }
  }

  const inputCls = `w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3
    text-white placeholder-zinc-600 text-sm transition-all
    focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500`

  if (step === 'otp') {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <p className="text-zinc-300 text-sm">Enviamos um código para</p>
          <p className="text-amber-400 text-sm font-medium">{mascaraEmail(emailOtp)}</p>
        </div>

        <form onSubmit={handleVerificar} className="space-y-4">
          <input type="hidden" name="email" value={emailOtp} />
          <input type="hidden" name="novo" value="true" />

          <div className="space-y-1">
            <label className="text-sm text-zinc-400 ml-1">Código de 6 dígitos</label>
            <input
              name="token"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={token}
              onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
              required
              placeholder="000000"
              className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`}
            />
          </div>

          <button
            type="submit"
            disabled={enviando || token.length !== 6}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800
                       disabled:text-zinc-600 text-black font-bold
                       rounded-xl py-4 text-sm transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
          >
            {enviando ? 'Verificando...' : 'Confirmar e entrar'}
          </button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => { setStep('dados'); setToken('') }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Voltar
          </button>
          <button
            type="button"
            disabled={cooldown > 0 || reenviando}
            onClick={handleReenviar}
            className="text-amber-400 hover:text-amber-300 disabled:text-zinc-600 transition-colors"
          >
            {reenviando ? 'Reenviando...' : cooldown > 0 ? `Reenviar (${cooldown}s)` : 'Reenviar código'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleCadastrar} className="space-y-4">
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

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800
                   disabled:text-zinc-600 text-black font-bold
                   rounded-xl py-4 text-sm transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
      >
        {enviando ? 'Enviando código...' : 'Criar conta'}
      </button>
    </form>
  )
}
