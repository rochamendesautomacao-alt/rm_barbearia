import { createBrowserClient } from '@supabase/ssr'

// Usado em Client Components — cria uma instância singleton no navegador
export function createClient() {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
