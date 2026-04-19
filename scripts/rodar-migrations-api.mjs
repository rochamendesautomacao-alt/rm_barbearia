// Roda migrations via Supabase Management API (sem precisar de conexão PostgreSQL)
// Uso: node scripts/rodar-migrations-api.mjs <PERSONAL_ACCESS_TOKEN>

import { readFileSync } from 'fs'

const TOKEN       = process.argv[2]
const PROJECT_REF = 'zywufysxagtffuougmgx'

if (!TOKEN) {
  console.error('Uso: node scripts/rodar-migrations-api.mjs <PERSONAL_ACCESS_TOKEN>')
  console.error('Gere em: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const MIGRATIONS = [
  'supabase/migrations/001_schema_inicial.sql',
  'supabase/migrations/002_funcoes_disponibilidade.sql',
  'supabase/migrations/003_auth_trigger.sql',
  'supabase/migrations/004_rls_politicas_publicas.sql',
  'supabase/migrations/005_planos_limites.sql',
]

async function runSQL(sql, nome) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  )

  const text = await res.text()

  if (!res.ok) {
    let msg = text
    try { msg = JSON.parse(text)?.message ?? text } catch {}
    throw new Error(msg)
  }

  return text
}

async function main() {
  console.log(`Supabase projeto: ${PROJECT_REF}`)
  console.log('Rodando migrations via Management API...\n')

  for (const file of MIGRATIONS) {
    const sql  = readFileSync(file, 'utf-8')
    const nome = file.split('/').pop()
    process.stdout.write(`▶ ${nome} ... `)

    try {
      await runSQL(sql, nome)
      console.log('✓ OK')
    } catch (err) {
      // alguns erros são esperados (ex: "already exists") — não para a execução
      const mensagem = err.message
      if (
        mensagem.includes('already exists') ||
        mensagem.includes('já existe')      ||
        mensagem.includes('duplicate')
      ) {
        console.log('⚠ já existe (ignorado)')
      } else {
        console.log('✗ ERRO')
        console.error(`  → ${mensagem}\n`)
      }
    }
  }

  console.log('\n✓ Migrations concluídas.')
}

main().catch(err => {
  console.error('\nErro fatal:', err.message)
  process.exit(1)
})
