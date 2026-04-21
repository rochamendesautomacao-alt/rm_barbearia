'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatarTelefone } from '@/lib/format'
import { solicitarOtp, verificarOtp } from '@/app/actions/clientes'

type SolicitarFn = (
  slug: string,
  fd: FormData,
) => Promise<{ email: string } | { erro: string; naoEncontrado?: boolean }>

type VerificarFn = (
  slug: string,
  fd: FormData,
) => Promise<{ erro: string } | undefined>

interface Props {
  slug: string
  solicitarAction?: SolicitarFn
  verificarAction?: VerificarFn
  cadastroHref?: string
}

function mascaraEmail(email: string): string {
  const [local, domain] = email.split('@')
  const visivel = local.slice(0, 2)
  return `${visivel}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`
}

export default function FormLoginCliente({
  slug,
  solicitarAction = solicitarOtp,
  verificarAction = verificarOtp,
  cadastroHref,
}: Props) {
  const href = cadastroHref ?? `/${slug}/cadastro`

  const [modo,         setModo]         = useState<'telefone' | 'email'>('telefone')
  const [step,         setStep]         = useState<'identificador' | 'otp'>('identificador')
  const [telefone,     setTelefone]     = useState('')
  const [emailOtp,     setEmailOtp]     = useState('')
  const [token,        setToken]        = useState('')
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [enviando,     setEnviando]     = useState(false)
  const [reenviando,   setReenviando]   = useState(false)
  const [cooldown,     setCooldown]     = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleSolicitar(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setNaoEncontrado(false)
    const fd = new FormData(e.currentTarget)
    try {
      const resultado = await solicitarAction(slug, fd)
      if ('erro' in resultado) {
        if (resultado.naoEncontrado) {
          setNaoEncontrado(true)
        } else {
          toast.error(resultado.erro)
        }
      } else {
        setEmailOtp(resultado.email)
        setCooldown(30)
        setStep('otp')
      }
    } catch {
      toast.error('Erro ao enviar código. Tente novamente.')
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
    fd.set('modo', modo)
    if (modo === 'telefone') fd.set('telefone', telefone)
    else fd.set('email', emailOtp)
    try {
      const resultado = await solicitarAction(slug, fd)
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
            {enviando ? 'Verificando...' : 'Confirmar código'}
          </button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => { setStep('identificador'); setToken(''); setNaoEncontrado(false) }}
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
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-1 gap-1">
        {(['telefone', 'email'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setModo(m); setNaoEncontrado(false) }}
            className={[
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              modo === m ? 'bg-zinc-800 text-amber-500 shadow-lg' : 'text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
            {m === 'telefone' ? 'Telefone' : 'E-mail'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSolicitar} className="space-y-4">
        <input type="hidden" name="modo" value={modo} />

        {modo === 'telefone' ? (
          <div className="space-y-1">
            <label className="text-sm text-zinc-400 ml-1">WhatsApp / Telefone</label>
            <input
              name="telefone"
              value={telefone}
              onChange={e => { setTelefone(formatarTelefone(e.target.value)); setNaoEncontrado(false) }}
              required
              placeholder="(11) 99999-9999"
              className={inputCls}
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-sm text-zinc-400 ml-1">E-mail</label>
            <input
              name="email"
              type="email"
              required
              onChange={() => setNaoEncontrado(false)}
              placeholder="voce@email.com"
              className={inputCls}
            />
          </div>
        )}

        {naoEncontrado && (
          <p className="text-sm text-red-400">
            {modo === 'telefone' ? 'Número' : 'E-mail'} não cadastrado.{' '}
            <Link href={href} className="text-amber-400 hover:text-amber-300 underline">
              Criar conta
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800
                     disabled:text-zinc-600 text-black font-bold
                     rounded-xl py-4 text-sm transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
        >
          {enviando ? 'Enviando código...' : 'Enviar código'}
        </button>
      </form>
    </div>
  )
}
