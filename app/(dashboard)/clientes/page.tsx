import { createClient } from '@/lib/supabase/server'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function ClientesPage({ searchParams }: Props) {
  const { q }    = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clientes')
    .select(`
      id, nome, telefone, email, created_at,
      agendamentos(count)
    `)
    .order('nome')

  if (q) {
    query = query.or(`nome.ilike.%${q}%,telefone.ilike.%${q}%`)
  }

  const { data: clientes } = await query

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-white text-xl font-bold">Clientes</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{clientes?.length ?? 0} clientes cadastrados</p>
      </div>

      {/* Busca */}
      <form method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou telefone..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3
                     text-white placeholder-zinc-600 text-sm
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </form>

      {/* Lista */}
      <div className="space-y-2">
        {(clientes ?? []).length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-10">
            {q ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
          </p>
        ) : (
          (clientes ?? []).map((c: any) => (
            <div
              key={c.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <span className="text-zinc-400 font-semibold text-sm">
                  {c.nome.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{c.nome}</p>
                <p className="text-zinc-400 text-xs">{c.telefone}</p>
                {c.email && <p className="text-zinc-600 text-xs truncate">{c.email}</p>}
              </div>

              <div className="text-right shrink-0">
                <p className="text-white text-sm font-medium">
                  {(c.agendamentos as any[])?.[0]?.count ?? 0}
                </p>
                <p className="text-zinc-600 text-xs">visitas</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
