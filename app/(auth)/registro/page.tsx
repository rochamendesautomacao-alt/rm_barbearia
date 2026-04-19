import { cadastrar } from '@/app/actions/auth'

interface Props {
  searchParams: Promise<{ erro?: string }>
}

export default async function RegistroPage({ searchParams }: Props) {
  const params = await searchParams
  const erro   = params.erro

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Criar sua barbearia</h1>
          <p className="text-zinc-400 text-sm mt-1">14 dias grátis, sem cartão</p>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {decodeURIComponent(erro)}
          </div>
        )}

        <form action={cadastrar} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="nome" className="text-sm text-zinc-300">Seu nome</label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5
                         text-white placeholder-zinc-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="João Silva"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="empresa_nome" className="text-sm text-zinc-300">Nome da barbearia</label>
            <input
              id="empresa_nome"
              name="empresa_nome"
              type="text"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5
                         text-white placeholder-zinc-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Barbearia do João"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm text-zinc-300">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5
                         text-white placeholder-zinc-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="voce@barbearia.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="senha" className="text-sm text-zinc-300">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5
                         text-white placeholder-zinc-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="mínimo 8 caracteres"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold
                       rounded-lg py-2.5 text-sm transition-colors"
          >
            Criar barbearia grátis
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm">
          Já tem conta?{' '}
          <a href="/login" className="text-amber-500 hover:text-amber-400 font-medium">
            Entrar
          </a>
        </p>

      </div>
    </div>
  )
}
