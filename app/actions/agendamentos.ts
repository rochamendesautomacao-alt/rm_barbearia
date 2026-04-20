'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function atualizarStatus(
  id: string,
  status: 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'no_show',
  motivo?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const atualizacao: any = { status }
  if (status === 'cancelado') {
    atualizacao.cancelado_em     = new Date().toISOString()
    atualizacao.cancelado_motivo = motivo ?? null
  }

  const { error } = await (supabase
    .from('agendamentos') as any)
    .update(atualizacao)
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/agenda')
  return { ok: true }
}
