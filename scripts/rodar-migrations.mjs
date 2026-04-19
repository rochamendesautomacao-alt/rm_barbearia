// Roda as migrations do Supabase em ordem
// Uso: node scripts/rodar-migrations.mjs <DB_PASSWORD>

import { readFileSync } from 'fs'
import { createConnection } from 'net'

const PASSWORD = process.argv[2]
if (!PASSWORD) {
  console.error('Uso: node scripts/rodar-migrations.mjs <DB_PASSWORD>')
  process.exit(1)
}

const PROJECT_REF = 'zywufysxagtffuougmgx'

// importação dinâmica do pg (instala se necessário)
let Client
try {
  const pg = await import('pg')
  Client = pg.default.Client ?? pg.Client
} catch {
  console.log('Instalando pg...')
  const { execSync } = await import('child_process')
  execSync('npm install pg', { stdio: 'inherit', cwd: process.cwd() })
  const pg = await import('pg')
  Client = pg.default.Client ?? pg.Client
}

const MIGRATIONS = [
  'supabase/migrations/001_schema_inicial.sql',
  'supabase/migrations/002_funcoes_disponibilidade.sql',
  'supabase/migrations/003_auth_trigger.sql',
  'supabase/migrations/004_rls_politicas_publicas.sql',
  'supabase/migrations/005_planos_limites.sql',
]

// Supabase Session Pooler (suporta DDL/migrations)
const client = new Client({
  host:     `aws-0-sa-east-1.pooler.supabase.com`,
  port:     5432,
  database: 'postgres',
  user:     `postgres.${PROJECT_REF}`,
  password: PASSWORD,
  ssl:      { rejectUnauthorized: false },
})

async function main() {
  console.log('Conectando ao banco...')
  await client.connect()
  console.log('Conectado!\n')

  for (const file of MIGRATIONS) {
    const sql = readFileSync(file, 'utf-8')
    const nome = file.split('/').pop()
    process.stdout.write(`▶ ${nome} ... `)
    try {
      await client.query(sql)
      console.log('✓ OK')
    } catch (err) {
      console.log('✗ ERRO')
      console.error(`  ${err.message}\n`)
      // continua para a próxima migration em vez de parar tudo
    }
  }

  await client.end()
  console.log('\nMigrations concluídas.')
}

main().catch(async err => {
  console.error('Erro fatal:', err.message)
  await client.end().catch(() => {})
  process.exit(1)
})
