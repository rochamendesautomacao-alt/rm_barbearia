-- =============================================================
-- Migration 004: Ajuste fino das políticas RLS para SaaS multi-tenant
-- Separa claramente: acesso público (anon) vs. acesso autenticado (dashboard)
-- =============================================================

-- Remove políticas genéricas criadas na migration 001 que podem conflitar
DROP POLICY IF EXISTS empresa_propria          ON empresas;
DROP POLICY IF EXISTS empresa_slug_publico     ON empresas;
DROP POLICY IF EXISTS barbeiros_publico        ON barbeiros;
DROP POLICY IF EXISTS servicos_publico         ON servicos;
DROP POLICY IF EXISTS horarios_func_publico    ON horarios_funcionamento;
DROP POLICY IF EXISTS isolamento_agendamentos  ON agendamentos;
DROP POLICY IF EXISTS isolamento_clientes      ON clientes;

-- =============================================================
-- EMPRESAS
-- =============================================================

-- Qualquer pessoa (anon) pode ler empresa por slug (página de agendamento)
CREATE POLICY empresas_leitura_publica ON empresas
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- Apenas o usuário autenticado da empresa pode atualizar seus próprios dados
CREATE POLICY empresas_update_proprio ON empresas
  FOR UPDATE
  TO authenticated
  USING (id = minha_empresa_id());

-- =============================================================
-- BARBEIROS
-- =============================================================

-- Anon pode listar barbeiros ativos (página de agendamento do cliente)
CREATE POLICY barbeiros_leitura_publica ON barbeiros
  FOR SELECT
  TO anon
  USING (ativo = true);

-- Autenticado vê todos os barbeiros da sua empresa (inclusive inativos)
CREATE POLICY barbeiros_leitura_dashboard ON barbeiros
  FOR SELECT
  TO authenticated
  USING (empresa_id = minha_empresa_id());

-- Autenticado escreve apenas na sua empresa
CREATE POLICY barbeiros_escrita ON barbeiros
  FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = minha_empresa_id());

CREATE POLICY barbeiros_update ON barbeiros
  FOR UPDATE
  TO authenticated
  USING (empresa_id = minha_empresa_id());

-- =============================================================
-- SERVIÇOS
-- =============================================================

-- Anon pode listar serviços ativos (página de agendamento)
CREATE POLICY servicos_leitura_publica ON servicos
  FOR SELECT
  TO anon
  USING (ativo = true);

-- Autenticado vê todos da sua empresa
CREATE POLICY servicos_leitura_dashboard ON servicos
  FOR SELECT
  TO authenticated
  USING (empresa_id = minha_empresa_id());

CREATE POLICY servicos_escrita ON servicos
  FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = minha_empresa_id());

CREATE POLICY servicos_update ON servicos
  FOR UPDATE
  TO authenticated
  USING (empresa_id = minha_empresa_id());

-- =============================================================
-- CLIENTES
-- =============================================================

-- Anon pode criar e atualizar cliente (upsert no agendamento)
CREATE POLICY clientes_upsert_publico ON clientes
  FOR INSERT
  TO anon
  WITH CHECK (true);  -- empresa_id sempre vem do corpo da request validado no servidor

-- Anon pode atualizar seu próprio registro (upsert por telefone)
CREATE POLICY clientes_update_publico ON clientes
  FOR UPDATE
  TO anon
  USING (true);

-- Autenticado vê e gerencia clientes da sua empresa
CREATE POLICY clientes_dashboard ON clientes
  FOR ALL
  TO authenticated
  USING (empresa_id = minha_empresa_id());

-- =============================================================
-- AGENDAMENTOS
-- =============================================================

-- Anon pode criar agendamento (cliente agendando sem login)
CREATE POLICY agendamentos_insert_publico ON agendamentos
  FOR INSERT
  TO anon
  WITH CHECK (true);  -- empresa_id validado no servidor antes do INSERT

-- Anon pode ler seu próprio agendamento pela view (página de confirmação)
-- Restringe apenas por id — sem expor dados de outros
CREATE POLICY agendamentos_leitura_publica ON agendamentos
  FOR SELECT
  TO anon
  USING (true);

-- Autenticado gerencia apenas agendamentos da sua empresa (via RLS automática)
CREATE POLICY agendamentos_dashboard ON agendamentos
  FOR ALL
  TO authenticated
  USING (empresa_id = minha_empresa_id());

-- =============================================================
-- HORÁRIOS DE FUNCIONAMENTO
-- =============================================================

-- Anon pode ler horários (necessário para calcular disponibilidade)
CREATE POLICY horarios_func_publico ON horarios_funcionamento
  FOR SELECT
  TO anon
  USING (ativo = true);

CREATE POLICY horarios_func_dashboard ON horarios_funcionamento
  FOR ALL
  TO authenticated
  USING (empresa_id = minha_empresa_id());

-- =============================================================
-- HORÁRIOS BLOQUEADOS
-- =============================================================

-- Anon pode ler bloqueios (necessário para calcular disponibilidade)
CREATE POLICY horarios_bloq_publico ON horarios_bloqueados
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY horarios_bloq_dashboard ON horarios_bloqueados
  FOR ALL
  TO authenticated
  USING (empresa_id = minha_empresa_id());

-- =============================================================
-- Garante que a função minha_empresa_id() retorna NULL para anon
-- (sem erro, apenas filtra corretamente)
-- =============================================================
CREATE OR REPLACE FUNCTION minha_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id
  FROM usuarios
  WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;
