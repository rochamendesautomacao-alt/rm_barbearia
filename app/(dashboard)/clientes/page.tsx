import { createClient } from '@/lib/supabase/server'
import { getUsuarioComEmpresa } from '@/app/actions/auth'
import ListaClientes from '@/components/dashboard/ListaClientes'

const escapeIlike = (s: string) => s.replace(/[\\%_]/g, c => `\\${c}`)

const POR_PAGINA = 50

interface Props {
  searchParams: Promise<{ q?: string; pagina?: string }>
}

export default async function ClientesPage({ searchParams }: Props) {
  const { q, pagina: paginaStr } = await searchParams
  const pagina   = Math.max(1, parseInt(paginaStr ?? '1', 10))
  const from     = (pagina - 1) * POR_PAGINA
  const to       = from + POR_PAGINA - 1

  const usuario  = await getUsuarioComEmpresa()
  const supabase = await createClient()

  let query = supabase
    .from('clientes')
    .select(`id, nome, telefone, email, observacoes, agendamentos(count)`, { count: 'exact' })
    .order('nome')
    .range(from, to)

  if (q) {
    const eq = escapeIlike(q)
    query = query.or(`nome.ilike.%${eq}%,telefone.ilike.%${eq}%`)
  }

  const { data: raw, count } = await query

  const clientes = (raw ?? []).map((c: { id: string; nome: string; telefone: string; email: string | null; observacoes: string | null; agendamentos: { count: number }[] }) => ({
    id:         c.id,
    nome:       c.nome,
    telefone:   c.telefone,
    email:      c.email,
    observacoes: c.observacoes,
    visitas:    c.agendamentos?.[0]?.count ?? 0,
  }))

  const total    = count ?? 0
  const totalPag = Math.ceil(total / POR_PAGINA)

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-white text-xl font-bold">Clientes</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{total} clientes cadastrados</p>
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

      <ListaClientes
        clientes={clientes}
        empresaId={usuario?.empresa_id ?? ''}
      />

      {totalPag > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-zinc-500 text-xs">
            Página {pagina} de {totalPag}
          </span>
          <div className="flex gap-2">
            {pagina > 1 && (
              <a
                href={`?${q ? `q=${encodeURIComponent(q)}&` : ''}pagina=${pagina - 1}`}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
              >
                Anterior
              </a>
            )}
            {pagina < totalPag && (
              <a
                href={`?${q ? `q=${encodeURIComponent(q)}&` : ''}pagina=${pagina + 1}`}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
              >
                Próxima
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
