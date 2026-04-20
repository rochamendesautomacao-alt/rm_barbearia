'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioComEmpresa } from '@/app/actions/auth'
import { verificarConflito, calcularFim } from '@/lib/agendamento/slots'
import { verificarLimiteAgendamento } from '@/lib/planos'

export async function criarAgendamentoAdmin(formData: FormData) {
  const usuario = await getUsuarioComEmpresa()
  if (!usuario) return { erro: 'Não autenticado' }

  const cliente_id       = formData.get('cliente_id') as string
  const barbeiro_id      = formData.get('barbeiro_id') as string
  const servico_id       = formData.get('servico_id') as string
  const data_hora_inicio = formData.get('data_hora_inicio') as string
  const observacoes      = (formData.get('observacoes') as string)?.trim() || null

  if (!cliente_id || !barbeiro_id || !servico_id || !data_hora_inicio) {
    return { erro: 'Preencha todos os campos obrigatórios' }
  }

  const supabase = await createClient()

  // Verifica limite do plano
  const limite = await verificarLimiteAgendamento(usuario.empresa_id)
  if (!limite.permitido) return { erro: limite.motivo }

  // Busca duração do serviço para calcular fim
  const { data: servico, error: erroServico } = await supabase
    .from('servicos')
    .select('duracao_minutos')
    .eq('id', servico_id)
    .eq('empresa_id', usuario.empresa_id)
    .single()

  if (erroServico || !servico) return { erro: 'Serviço não encontrado' }

  const data_hora_fim = calcularFim(data_hora_inicio, (servico as any).duracao_minutos)

  // Verifica conflito de horário
  const temConflito = await verificarConflito(supabase as any, {
    barbeiro_id,
    data_hora_inicio,
    data_hora_fim,
  })
  if (temConflito) return { erro: 'Horário já ocupado. Escolha outro horário.' }

  const { error } = await supabase
    .from('agendamentos')
    .insert({
      empresa_id: usuario.empresa_id,
      cliente_id,
      barbeiro_id,
      servico_id,
      data_hora_inicio,
      observacoes,
      status: 'confirmado',
    })

  if (error) return { erro: error.message }

  revalidatePath('/agenda')
  return { ok: true }
}

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
