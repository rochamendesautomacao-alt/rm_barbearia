import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cache } from 'react'

export interface StatusPlano {
  plano_nome:           string
  max_barbeiros:        number
  max_agendamentos_mes: number
  barbeiros_em_uso:     number
  agendamentos_mes:     number
  status_assinatura:    'ativa' | 'trial' | 'cancelada' | 'suspensa'
  recursos:             Record<string, boolean>
  // percentuais calculados
  pct_barbeiros:        number  // 0-100
  pct_agendamentos:     number
  // flags de limite
  barbeiros_no_limite:  boolean
  agendamentos_no_limite: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Busca status completo do plano de uma empresa
// Usa a função SQL plano_da_empresa() para eficiência
// ─────────────────────────────────────────────────────────────────────────────
export const getStatusPlano = cache(async (empresa_id: string): Promise<StatusPlano | null> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('plano_da_empresa', { p_empresa_id: empresa_id })

  if (error || !data || data.length === 0) return null

  const row = data[0]
  const max_ag = row.max_agendamentos_mes >= 9999 ? Infinity : row.max_agendamentos_mes

  const pct_barbeiros    = Math.min(100, Math.round((row.barbeiros_em_uso / row.max_barbeiros) * 100))
  const pct_agendamentos = max_ag === Infinity ? 0 : Math.min(100, Math.round((row.agendamentos_mes / max_ag) * 100))

  return {
    plano_nome:             row.plano_nome,
    max_barbeiros:          row.max_barbeiros,
    max_agendamentos_mes:   row.max_agendamentos_mes,
    barbeiros_em_uso:       Number(row.barbeiros_em_uso),
    agendamentos_mes:       Number(row.agendamentos_mes),
    status_assinatura:      row.status_assinatura,
    recursos:               row.recursos as Record<string, boolean>,
    pct_barbeiros,
    pct_agendamentos,
    barbeiros_no_limite:    row.barbeiros_em_uso >= row.max_barbeiros,
    agendamentos_no_limite: max_ag !== Infinity && row.agendamentos_mes >= max_ag,
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Verifica se pode adicionar barbeiro (chamada antes do INSERT)
// ─────────────────────────────────────────────────────────────────────────────
export async function verificarLimiteBarbeiro(empresa_id: string): Promise<{
  permitido: boolean
  motivo?: string
}> {
  const status = await getStatusPlano(empresa_id)

  if (!status) return { permitido: false, motivo: 'Nenhuma assinatura ativa' }
  if (status.barbeiros_no_limite) {
    return {
      permitido: false,
      motivo: `Seu plano ${status.plano_nome} permite até ${status.max_barbeiros} barbeiro(s). Faça upgrade para adicionar mais.`,
    }
  }

  return { permitido: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Verifica se pode criar agendamento este mês
// ─────────────────────────────────────────────────────────────────────────────
export async function verificarLimiteAgendamento(empresa_id: string): Promise<{
  permitido: boolean
  motivo?: string
}> {
  const status = await getStatusPlano(empresa_id)

  if (!status) return { permitido: false, motivo: 'Nenhuma assinatura ativa' }
  if (status.agendamentos_no_limite) {
    return {
      permitido: false,
      motivo: `Limite de ${status.max_agendamentos_mes} agendamentos/mês atingido. Faça upgrade para continuar.`,
    }
  }

  return { permitido: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Verifica se um recurso está disponível no plano
// ex: temRecurso('relatorios'), temRecurso('whatsapp')
// ─────────────────────────────────────────────────────────────────────────────
export async function temRecurso(empresa_id: string, recurso: string): Promise<boolean> {
  const status = await getStatusPlano(empresa_id)
  return status?.recursos?.[recurso] === true
}

// ─────────────────────────────────────────────────────────────────────────────
// Erros específicos do banco que indicam limite atingido
// ─────────────────────────────────────────────────────────────────────────────
export function tratarErroBanco(mensagem: string): string | null {
  if (mensagem.includes('LIMITE_BARBEIROS')) {
    return 'Limite de barbeiros do plano atingido. Faça upgrade para adicionar mais.'
  }
  if (mensagem.includes('LIMITE_AGENDAMENTOS')) {
    return 'Limite de agendamentos do mês atingido. Faça upgrade para continuar.'
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Lista todos os planos disponíveis (para tela de upgrade)
// ─────────────────────────────────────────────────────────────────────────────
export async function getPlanos() {
  // usa admin client para leitura pública sem problemas de RLS
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('planos')
    .select('id, nome, preco_mensal, max_barbeiros, max_agendamentos_mes, recursos')
    .eq('ativo', true)
    .order('preco_mensal')

  return data ?? []
}
