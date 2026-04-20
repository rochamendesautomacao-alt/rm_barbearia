/**
 * Constantes globais do projeto.
 */

export const STATUS_LABEL: Record<string, string> = {
  pendente:     'Pendente',
  confirmado:   'Confirmado',
  em_andamento: 'Em andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
  no_show:      'Não compareceu',
}

export const STATUS_COR: Record<string, string> = {
  pendente:     'bg-yellow-900/40 text-yellow-400',
  confirmado:   'bg-blue-900/40 text-blue-400',
  em_andamento: 'bg-amber-900/40 text-amber-400',
  concluido:    'bg-green-900/40 text-green-400',
  cancelado:    'bg-red-900/40 text-red-400',
  no_show:      'bg-zinc-800 text-zinc-500',
}

export const DIAS_SEMANA = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]
