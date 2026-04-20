import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verificarConflito, calcularFim } from '@/lib/agendamento/slots'
import { CriarAgendamentoSchema } from '@/lib/validations/agendamento'
import { verificarLimiteAgendamento, tratarErroBanco } from '@/lib/planos'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/agendamentos?empresa_id=&data=YYYY-MM-DD&barbeiro_id=(opcional)
// Rota protegida — somente usuários autenticados da empresa
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const data        = searchParams.get('data')
  const barbeiroId  = searchParams.get('barbeiro_id')

  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ erro: 'Parâmetro data é obrigatório (YYYY-MM-DD)' }, { status: 400 })
  }

  // RLS garante que só retorna agendamentos da empresa do usuário logado
  let query = supabase
    .from('vw_agenda_dia')
    .select('*')
    .gte('data_hora_inicio', `${data}T00:00:00Z`)
    .lte('data_hora_inicio', `${data}T23:59:59Z`)
    .order('data_hora_inicio', { ascending: true })

  if (barbeiroId) {
    query = query.eq('barbeiro_id' as never, barbeiroId)
  }

  const { data: agendamentos, error } = await query

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ agendamentos }, { status: 200 })
}

// Mapa simples para Rate Limiting na instância Serverless
const rateLimit = new Map<string, { count: number; resetAt: number }>()

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/agendamentos
// Rota pública — cliente cria agendamento sem estar logado
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Rate Limiting Básico por IP
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  if (ip !== 'anonymous') {
    const limits = rateLimit.get(ip)
    const now = Date.now()
    if (limits && limits.resetAt > now) {
      if (limits.count >= 5) {
        return NextResponse.json(
          { erro: 'Muitos agendamentos na mesma hora. Tente novamente mais tarde.' },
          { status: 429, headers: { 'Retry-After': '900' } }
        )
      }
      limits.count++
    } else {
      rateLimit.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 }) // 15 minutos
    }
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 })
  }

  const parsed = CriarAgendamentoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const {
    empresa_id,
    barbeiro_id,
    servico_id,
    data_hora_inicio,
    cliente_nome,
    cliente_telefone,
    cliente_email,
    observacoes,
  } = parsed.data

  // rota pública usa anon key — RLS permite INSERT em agendamentos sem login
  const supabase = await createClient()

  // 0. verifica limite do plano antes de qualquer coisa
  const limite = await verificarLimiteAgendamento(empresa_id)
  if (!limite.permitido) {
    return NextResponse.json({ erro: limite.motivo }, { status: 402 })
  }

  // 1. busca duração do serviço
  const { data: servico, error: erroServico } = await supabase
    .from('servicos')
    .select('duracao_minutos, preco')
    .eq('id', servico_id)
    .eq('empresa_id', empresa_id)
    .eq('ativo', true)
    .single()

  if (erroServico || !servico) {
    return NextResponse.json({ erro: 'Serviço não encontrado ou inativo' }, { status: 404 })
  }

  const data_hora_fim = calcularFim(data_hora_inicio, servico.duracao_minutos)

  // 2. verifica conflito de horário (proteção dupla — o banco também tem EXCLUDE)
  const temConflito = await verificarConflito(supabase, {
    barbeiro_id,
    data_hora_inicio,
    data_hora_fim,
  })

  if (temConflito) {
    return NextResponse.json(
      { erro: 'Horário não disponível. Por favor, escolha outro horário.' },
      { status: 409 }
    )
  }

  // 3. upsert do cliente por telefone + empresa (evita duplicatas)
  const supabaseAdmin = createAdminClient()
  const { data: cliente, error: erroCliente } = await supabaseAdmin
    .from('clientes')
    .upsert(
      {
        empresa_id,
        nome:     cliente_nome,
        telefone: cliente_telefone,
        email:    cliente_email || null,
      },
      { onConflict: 'telefone,empresa_id', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (erroCliente || !cliente) {
    return NextResponse.json({ erro: 'Erro ao registrar cliente' }, { status: 500 })
  }

  // Se houver sessão ativa, vincular auth_user_id ao registro (sem sobrescrever vínculo existente)
  const { data: { user: usuarioLogado } } = await supabase.auth.getUser()
  if (usuarioLogado) {
    await supabaseAdmin
      .from('clientes')
      .update({ auth_user_id: usuarioLogado.id })
      .eq('id', cliente.id)
      .is('auth_user_id', null)
  }

  // 4. cria o agendamento
  // data_hora_fim e preco_cobrado são calculados pelos triggers do banco
  const { data: agendamento, error: erroAg } = await supabase
    .from('agendamentos')
    .insert({
      empresa_id,
      cliente_id:      cliente.id,
      barbeiro_id,
      servico_id,
      data_hora_inicio,
      data_hora_fim,    // redundante — o trigger recalcula, mas enviamos para clareza
      preco_cobrado:   servico.preco,
      status:          'pendente',
      observacoes:     observacoes || null,
    })
    .select('id, data_hora_inicio, data_hora_fim, status')
    .single()

  if (erroAg || !agendamento) {
    // código 23P01 = violação da restrição EXCLUDE (overlap detectado pelo banco)
    if (erroAg?.code === '23P01') {
      return NextResponse.json(
        { erro: 'Horário não disponível. Por favor, escolha outro horário.' },
        { status: 409 }
      )
    }
    // trata erro de limite vindo do trigger do banco (fallback)
    const erroPlano = tratarErroBanco(erroAg?.message ?? '')
    if (erroPlano) {
      return NextResponse.json({ erro: erroPlano }, { status: 402 })
    }
    return NextResponse.json({ erro: 'Erro ao criar agendamento' }, { status: 500 })
  }

  return NextResponse.json({ agendamento }, { status: 201 })
}
