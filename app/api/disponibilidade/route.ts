import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buscarSlots } from '@/lib/agendamento/slots'
import { SlotQuerySchema } from '@/lib/validations/agendamento'

// GET /api/disponibilidade?empresa_id=&barbeiro_id=&servico_id=&data=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const parsed = SlotQuerySchema.safeParse({
    empresa_id:  searchParams.get('empresa_id'),
    barbeiro_id: searchParams.get('barbeiro_id'),
    servico_id:  searchParams.get('servico_id'),
    data:        searchParams.get('data'),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Parâmetros inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // rota pública — não exige autenticação (cliente agendando)
  const supabase = await createClient()

  try {
    const slots = await buscarSlots(supabase, parsed.data)

    // só retorna slots disponíveis para o cliente
    const disponiveis = slots.filter(s => s.disponivel)

    return NextResponse.json({ slots: disponiveis }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
