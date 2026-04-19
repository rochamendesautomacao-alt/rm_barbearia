import { login } from '@/app/actions/auth'

interface Props {
  searchParams: Promise<{ erro?: string; redirect?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const erro   = params.erro

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Entrar na barbearia</h1>
          <p className="text-zinc-400 text-sm mt-1">Acesse o painel de gestão</p>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {decodeURIComponent(erro)}
          </div>
        )}

        <form action={login} className="space-y-4">
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
              autoComplete="current-password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5
                         text-white placeholder-zinc-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold
                       rounded-lg py-2.5 text-sm transition-colors"
          >
            Entrar
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm">
          Não tem conta?{' '}
          <a href="/registro" className="text-amber-500 hover:text-amber-400 font-medium">
            Cadastre sua barbearia
          </a>
        </p>

      </div>
    </div>
  )
}
