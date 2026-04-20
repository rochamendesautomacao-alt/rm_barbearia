import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FormLoginCliente from '@/components/agendamento/FormLoginCliente'
import { loginClienteB, loginClientePorTelefoneB } from '@/app/actions/booking-publico'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EntrarBPage({ params }: Props) {
  const { slug } = await params
  const base     = `/b/${slug}`
  const supabase = await createClient()

  const { data: empresa } = await supabase
    .from('empresas')
    .select('id, nome, slug, logo_url, cidade, estado')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!empresa) notFound()

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {empresa.logo_url ? (
            <img src={empresa.logo_url} alt={empresa.nome} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-black font-bold text-lg">{empresa.nome.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            <h1 className="text-white font-semibold text-base leading-tight">{empresa.nome}</h1>
            {empresa.cidade && (
              <p className="text-zinc-400 text-xs">{empresa.cidade}{empresa.estado ? `, ${empresa.estado}` : ''}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-white text-xl font-bold">Entrar</h2>
          <p className="text-zinc-400 text-sm mt-1">Acesse sua conta para gerenciar seus agendamentos</p>
        </div>

        <FormLoginCliente
          slug={slug}
          loginAction={loginClienteB}
          loginTelefoneAction={loginClientePorTelefoneB}
        />

        <p className="text-center text-zinc-500 text-sm mt-6">
          Não tem conta?{' '}
          <Link href={`${base}/cadastro`} className="text-amber-400 hover:text-amber-300">
            Cadastre-se
          </Link>
        </p>
        <p className="text-center text-zinc-600 text-xs mt-4">
          <Link href={base} className="hover:text-zinc-400">← Voltar</Link>
        </p>
      </main>
    </div>
  )
}
