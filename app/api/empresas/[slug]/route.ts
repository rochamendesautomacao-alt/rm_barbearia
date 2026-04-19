import { NextRequest, NextResponse } from 'next/server'
import { getTenantPorSlug } from '@/lib/tenant'

// GET /api/empresas/[slug]
// Rota pública — retorna dados mínimos da barbearia para o cliente
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ erro: 'Slug inválido' }, { status: 400 })
  }

  const empresa = await getTenantPorSlug(slug)

  if (!empresa) {
    return NextResponse.json({ erro: 'Barbearia não encontrada' }, { status: 404 })
  }

  // Retorna apenas campos públicos — nunca expor dados internos
  return NextResponse.json({
    empresa: {
      id:          empresa.id,
      nome:        empresa.nome,
      slug:        empresa.slug,
      logo_url:    empresa.logo_url,
      cor_primaria: empresa.cor_primaria,
      cidade:      empresa.cidade,
      estado:      empresa.estado,
    }
  }, {
    // Cache de 5 minutos — slugs não mudam com frequência
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }
  })
}
