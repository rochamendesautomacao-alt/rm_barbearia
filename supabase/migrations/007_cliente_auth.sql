-- =============================================================
-- Migration 007: Auth para clientes (portal público)
-- =============================================================

-- 1. Adiciona coluna auth_user_id em clientes
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clientes_auth_user_id_key
  ON clientes(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- 2. RLS: cliente autenticado lê e atualiza seus próprios dados
CREATE POLICY "cliente_le_proprio_registro"
  ON clientes
  FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "cliente_atualiza_proprio_registro"
  ON clientes
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- 3. RLS: cliente autenticado lê seus próprios agendamentos
--    (identifica-se pelo cliente_id vinculado ao seu auth_user_id)
CREATE POLICY "cliente_le_proprios_agendamentos"
  ON agendamentos
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );
