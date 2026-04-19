import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-zinc-600 text-6xl font-bold">404</p>
        <h1 className="text-white text-xl font-semibold">Página não encontrada</h1>
        <p className="text-zinc-400 text-sm">
          O endereço que você acessou não existe ou foi removido.
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400
                     text-black font-semibold rounded-xl text-sm transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
