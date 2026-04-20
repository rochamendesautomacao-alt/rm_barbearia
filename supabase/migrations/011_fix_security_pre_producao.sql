-- =============================================================
-- Migration 011: Correções de segurança pré-produção
-- =============================================================

-- 1. Remove política anon que expunha TODOS os agendamentos via REST API
--    Qualquer pessoa com a anon key podia listar nome/telefone de todos os clientes.
--    A página de confirmação passou a usar createAdminClient() no server component.
DROP POLICY IF EXISTS agendamentos_leitura_publica ON agendamentos;

-- 2. Permite que clientes autenticados leiam seus próprios agendamentos
--    (necessário para portal /b/[slug] e reagendamento)
CREATE POLICY agendamentos_leitura_cliente ON agendamentos
  FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );

-- 3. Corrige política de clientes para anon ter restrição de empresa_id no INSERT
--    Antes: WITH CHECK (true) confiava inteiramente na validação do servidor
--    Agora: a coluna empresa_id deve ser diferente de NULL (proteção mínima no banco)
DROP POLICY IF EXISTS clientes_upsert_publico ON clientes;
CREATE POLICY clientes_upsert_publico ON clientes
  FOR INSERT
  TO anon
  WITH CHECK (empresa_id IS NOT NULL);

-- 4. Restringe UPDATE anon de clientes para só poder atualizar registros sem auth_user_id
--    (evita que um anon sobrescreva dados de um cliente já vinculado a uma conta)
DROP POLICY IF EXISTS clientes_update_publico ON clientes;
CREATE POLICY clientes_update_publico ON clientes
  FOR UPDATE
  TO anon
  USING (auth_user_id IS NULL)
  WITH CHECK (auth_user_id IS NULL);
