import { createClient } from '@/lib/supabase/server'
import ListaServicos from '@/components/dashboard/ListaServicos'

export default async function ServicosPage() {
  const supabase = await createClient()

  const { data: servicos } = await supabase
    .from('servicos')
    .select('id, nome, descricao, duracao_minutos, preco, ativo')
    .order('nome')

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-white text-2xl font-black tracking-tight">Serviços</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Cadastre os serviços oferecidos</p>
      </div>

      <ListaServicos servicos={servicos ?? []} />
    </div>
  )
}
