import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AtualizarStatusSchema } from '@/lib/validations/agendamento'

interface Params {
  params: Promise<{ id: string }>
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/agendamentos/[id]
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('vw_agenda_dia')
    .select('*')
    .eq('id' as never, id)
    .single()

  if (error || !data) {
    return NextResponse.json({ erro: 'Agendamento não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ agendamento: data }, { status: 200 })
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/agendamentos/[id]
// Atualiza status: confirmar, iniciar, concluir, cancelar, marcar no_show
// Rota protegida — somente barbearia autenticada
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 })
  }

  const parsed = AtualizarStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { status, cancelado_motivo } = parsed.data

  // valida transições de status permitidas
  const { data: atual, error: erroAtual } = await supabase
    .from('agendamentos')
    .select('status')
    .eq('id', id)
    .single()

  if (erroAtual || !atual) {
    return NextResponse.json({ erro: 'Agendamento não encontrado' }, { status: 404 })
  }

  const transicoesValidas: Record<string, string[]> = {
    pendente:     ['confirmado', 'cancelado', 'no_show'],
    confirmado:   ['em_andamento', 'cancelado', 'no_show'],
    em_andamento: ['concluido', 'cancelado'],
    concluido:    [],
    cancelado:    [],
    no_show:      [],
  }

  if (!transicoesValidas[atual.status]?.includes(status)) {
    return NextResponse.json(
      { erro: `Não é possível mudar de '${atual.status}' para '${status}'` },
      { status: 422 }
    )
  }

  const atualizacao: Record<string, unknown> = { status }

  if (status === 'cancelado') {
    atualizacao.cancelado_em     = new Date().toISOString()
    atualizacao.cancelado_motivo = cancelado_motivo ?? null
  }

  // RLS garante que só atualiza agendamentos da empresa do usuário
  const { data: agendamento, error } = await supabase
    .from('agendamentos')
    .update(atualizacao)
    .eq('id', id)
    .select('id, status, cancelado_em, cancelado_motivo')
    .single()

  if (error || !agendamento) {
    return NextResponse.json({ erro: 'Erro ao atualizar agendamento' }, { status: 500 })
  }

  return NextResponse.json({ agendamento }, { status: 200 })
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/agendamentos/[id]
// Hard delete — apenas para agendamentos pendentes
// Rota protegida — somente admin da barbearia
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  // verifica se o usuário é admin
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (usuario?.role !== 'admin') {
    return NextResponse.json({ erro: 'Apenas admins podem excluir agendamentos' }, { status: 403 })
  }

  // só permite deletar agendamentos pendentes — demais devem ser cancelados via PATCH
  const { error } = await supabase
    .from('agendamentos')
    .delete()
    .eq('id', id)
    .eq('status', 'pendente')

  if (error) {
    return NextResponse.json({ erro: 'Erro ao excluir agendamento' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
