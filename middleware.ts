import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Classificação de rotas
// ─────────────────────────────────────────────────────────────────────────────

// Rotas de auth (acessíveis apenas para não autenticados)
const ROTAS_AUTH = ['/login', '/registro']

// Rotas do dashboard (exigem autenticação)
const PREFIXOS_DASHBOARD = [
  '/agenda', '/agendamentos', '/barbeiros',
  '/servicos', '/clientes', '/configuracoes', '/financeiro',
]

// API routes públicas (sem autenticação — chamadas pelo cliente ao agendar)
const API_PUBLICA = /^\/api\/(disponibilidade|agendamentos|empresas)/

// Slug da barbearia: /minha-barbearia ou /minha-barbearia/confirmacao
const ROTA_BARBEARIA = /^\/([a-z0-9-]+)(\/confirmacao)?$/

// Slugs reservados que não devem ser interpretados como barbearias
const SLUGS_RESERVADOS = new Set([
  'login', 'registro', 'agenda', 'agendamentos', 'barbeiros',
  'servicos', 'clientes', 'configuracoes', 'financeiro', 'api', '_next',
])

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isDashboard(pathname: string) {
  return PREFIXOS_DASHBOARD.some(p => pathname.startsWith(p))
}

function isRotaAuth(pathname: string) {
  return ROTAS_AUTH.some(r => pathname.startsWith(r))
}

function isApiPublica(pathname: string) {
  return API_PUBLICA.test(pathname)
}

function extrairSlug(pathname: string): string | null {
  const match = ROTA_BARBEARIA.exec(pathname)
  if (!match) return null
  const slug = match[1]
  return SLUGS_RESERVADOS.has(slug) ? null : slug
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware principal
// ─────────────────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // API públicas passam direto — autenticação é feita dentro da route
  if (isApiPublica(pathname)) return response

  // Cria cliente Supabase lendo cookies do request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Valida sessão no servidor (nunca confia só no cookie local)
  const { data: { user } } = await supabase.auth.getUser()

  // ── 1. DASHBOARD — exige autenticação ────────────────────────────────────
  if (isDashboard(pathname)) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Tenta usar as claims JWT sincronizadas no login (Performance ✨)
    let empresa_id = user.user_metadata?.empresa_id
    let role = user.user_metadata?.role

    // Fallback: Se não tiver no metadata (ex: sessão antiga), busca no banco
    if (!empresa_id || !role) {
      const { data } = await supabase
        .from('usuarios')
        .select('empresa_id, role')
        .eq('id', user.id)
        .single()
      
      const usuario = data as any // bypass type error until types regenerated

      if (!usuario) {
        // usuário autenticado mas sem registro — derruba para login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      
      empresa_id = usuario.empresa_id
      role = usuario.role
    }

    response.headers.set('x-empresa-id', empresa_id)
    response.headers.set('x-user-role', role)
    return response
  }

  // ── 2. AUTH — redireciona se já autenticado ───────────────────────────────
  if (isRotaAuth(pathname) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/agenda'
    return NextResponse.redirect(url)
  }

  // ── 3. ROTA DE BARBEARIA — injeta slug no header ──────────────────────────
  const slug = extrairSlug(pathname)
  if (slug) {
    response.headers.set('x-empresa-slug', slug)
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
