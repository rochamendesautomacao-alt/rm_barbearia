/*
  RESET COMPLETO DO BANCO - RM Barbearia
  =======================================
  ATENCAO: apaga todos os dados (empresas, usuarios, barbeiros,
  servicos, clientes, agendamentos, horarios, assinaturas).
  A tabela de planos e preservada.

  Como executar:
    1. Acesse supabase.com > seu projeto > SQL Editor > New query
    2. Cole este script e clique em RUN
*/

-- Desabilita RLS para permitir delecao total
SET session_replication_role = 'replica';

TRUNCATE TABLE
  agendamentos,
  horarios_bloqueados,
  horarios_funcionamento,
  clientes,
  servicos,
  barbeiros,
  assinaturas,
  usuarios,
  empresas
CASCADE;

DELETE FROM auth.users;

-- Reabilita RLS
SET session_replication_role = 'origin';

-- Confirmacao: todos devem mostrar 0, exceto planos (3)
SELECT 'agendamentos'           AS tabela, COUNT(*) AS total FROM agendamentos
UNION ALL SELECT 'clientes',              COUNT(*) FROM clientes
UNION ALL SELECT 'barbeiros',             COUNT(*) FROM barbeiros
UNION ALL SELECT 'servicos',              COUNT(*) FROM servicos
UNION ALL SELECT 'horarios_funcionamento',COUNT(*) FROM horarios_funcionamento
UNION ALL SELECT 'assinaturas',           COUNT(*) FROM assinaturas
UNION ALL SELECT 'usuarios',              COUNT(*) FROM usuarios
UNION ALL SELECT 'empresas',              COUNT(*) FROM empresas
UNION ALL SELECT 'auth.users',            COUNT(*) FROM auth.users
UNION ALL SELECT 'planos (preservados)',  COUNT(*) FROM planos
ORDER BY tabela;
