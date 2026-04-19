import { z } from 'zod'

export const SlotQuerySchema = z.object({
  empresa_id:  z.string().uuid('empresa_id inválido'),
  barbeiro_id: z.string().uuid('barbeiro_id inválido'),
  servico_id:  z.string().uuid('servico_id inválido'),
  data:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve ser YYYY-MM-DD'),
})

export const CriarAgendamentoSchema = z.object({
  empresa_id:      z.string().uuid(),
  barbeiro_id:     z.string().uuid(),
  servico_id:      z.string().uuid(),
  data_hora_inicio: z.string().datetime({ offset: true }),

  // dados do cliente (upsert por telefone + empresa)
  cliente_nome:    z.string().min(2).max(100),
  cliente_telefone: z.string().min(8).max(20),
  cliente_email:   z.string().email().optional().or(z.literal('')),

  observacoes:     z.string().max(500).optional(),
})

export const AtualizarStatusSchema = z.object({
  status: z.enum(['confirmado', 'em_andamento', 'concluido', 'cancelado', 'no_show']),
  cancelado_motivo: z.string().max(500).optional(),
})

export type SlotQuery        = z.infer<typeof SlotQuerySchema>
export type CriarAgendamento = z.infer<typeof CriarAgendamentoSchema>
export type AtualizarStatus  = z.infer<typeof AtualizarStatusSchema>
