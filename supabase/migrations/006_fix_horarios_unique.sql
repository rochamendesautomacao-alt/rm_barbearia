-- Migration 006: Fix unique constraint for horarios_funcionamento when barbeiro_id IS NULL
-- PostgreSQL treats NULL != NULL in UNIQUE constraints, so we need a partial unique index
-- for the case where barbeiro_id IS NULL (empresa-level schedules).

-- Remove the existing UNIQUE constraint (it doesn't work correctly for NULLs)
ALTER TABLE horarios_funcionamento
  DROP CONSTRAINT IF EXISTS horarios_funcionamento_empresa_id_barbeiro_id_dia_semana_key;

-- Partial unique index for empresa-level schedules (barbeiro_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_horario_empresa_dia
  ON horarios_funcionamento (empresa_id, dia_semana)
  WHERE barbeiro_id IS NULL;

-- Partial unique index for barbeiro-level schedules (barbeiro_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_horario_barbeiro_dia
  ON horarios_funcionamento (empresa_id, barbeiro_id, dia_semana)
  WHERE barbeiro_id IS NOT NULL;

-- Also enable public SELECT on horarios_bloqueados so the availability function works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'horarios_bloqueados'
      AND policyname = 'horarios_bloq_publico'
  ) THEN
    CREATE POLICY horarios_bloq_publico ON horarios_bloqueados
      FOR SELECT USING (true);
  END IF;
END $$;
