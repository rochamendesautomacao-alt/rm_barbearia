-- =============================================================
-- Migration 010: Corrige RLS para Clientes Autenticados
-- Permite que usuários logados (authenticated) também leiam
-- o catálogo público (barbeiros, serviços, horários)
-- =============================================================

-- 1. Barbeiros
DROP POLICY IF EXISTS barbeiros_leitura_publica ON barbeiros;
CREATE POLICY barbeiros_leitura_publica ON barbeiros
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- 2. Serviços
DROP POLICY IF EXISTS servicos_leitura_publica ON servicos;
CREATE POLICY servicos_leitura_publica ON servicos
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- 3. Horários de Funcionamento
DROP POLICY IF EXISTS horarios_func_publico ON horarios_funcionamento;
CREATE POLICY horarios_func_publico ON horarios_funcionamento
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- 4. Horários Bloqueados (necessário para a função de slots)
DROP POLICY IF EXISTS horarios_bloq_publico ON horarios_bloqueados;
CREATE POLICY horarios_bloq_publico ON horarios_bloqueados
  FOR SELECT
  TO anon, authenticated
  USING (true); -- Bloqueios são públicos para evitar agendamentos em horários inválidos
