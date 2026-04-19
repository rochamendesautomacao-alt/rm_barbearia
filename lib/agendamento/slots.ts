import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface Slot {
  hora_inicio: string  // ISO 8601
  hora_fim:    string
  disponivel:  boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Busca slots via função PostgreSQL (horarios_disponiveis)
// Delega para o banco: mais eficiente e sem lógica duplicada
// ─────────────────────────────────────────────────────────────────────────────
export async function buscarSlots(
  supabase: SupabaseClient<Database>,
  params: {
    empresa_id:  string
    barbeiro_id: string
    servico_id:  string
    data:        string   // YYYY-MM-DD
  }
): Promise<Slot[]> {
  // busca duração do serviço
  const { data: servico, error: erroServico } = await supabase
    .from('servicos')
    .select('duracao_minutos')
    .eq('id', params.servico_id)
    .eq('empresa_id', params.empresa_id)
    .single()

  if (erroServico || !servico) {
    throw new Error('Serviço não encontrado')
  }

  // chama a função SQL que calcula os slots
  const { data, error } = await supabase.rpc('horarios_disponiveis', {
    p_empresa_id:  params.empresa_id,
    p_barbeiro_id: params.barbeiro_id,
    p_data:        params.data,
    p_duracao_min: servico.duracao_minutos,
  })

  if (error) throw new Error(error.message)

  return (data ?? []) as Slot[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Verifica se um slot específico ainda está disponível antes de confirmar
// Segunda verificação no servidor para evitar race conditions
// ─────────────────────────────────────────────────────────────────────────────
export async function verificarConflito(
  supabase: SupabaseClient<Database>,
  params: {
    barbeiro_id:      string
    data_hora_inicio: string
    data_hora_fim:    string
    excluir_id?:      string   // ignora este agendamento (usado em reagendamentos)
  }
): Promise<boolean> {
  // usa a restrição EXCLUDE do banco via query direta
  let query = supabase
    .from('agendamentos')
    .select('id', { count: 'exact', head: true })
    .eq('barbeiro_id', params.barbeiro_id)
    .not('status', 'in', '("cancelado","no_show")')
    // overlap: inicio < fim_existente AND fim > inicio_existente
    .lt('data_hora_inicio', params.data_hora_fim)
    .gt('data_hora_fim', params.data_hora_inicio)

  if (params.excluir_id) {
    query = query.neq('id', params.excluir_id)
  }

  const { count, error } = await query

  if (error) throw new Error(error.message)

  return (count ?? 0) > 0  // true = tem conflito
}

// ─────────────────────────────────────────────────────────────────────────────
// Calcula data_hora_fim somando duração do serviço ao início
// ─────────────────────────────────────────────────────────────────────────────
export function calcularFim(inicio: string, duracaoMinutos: number): string {
  const dt = new Date(inicio)
  dt.setMinutes(dt.getMinutes() + duracaoMinutos)
  return dt.toISOString()
}
