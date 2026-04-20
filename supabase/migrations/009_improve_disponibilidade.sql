-- =============================================================
-- Migration 009: Melhora função horarios_disponiveis
-- 1. Garante que horários passados (no dia de hoje) sejam marcados como indisponíveis
-- 2. Mantém a lógica de timezone America/Sao_Paulo
-- =============================================================

CREATE OR REPLACE FUNCTION horarios_disponiveis(
  p_barbeiro_id  UUID,
  p_data         DATE,
  p_empresa_id   UUID,
  p_duracao_min  INT DEFAULT 30
)
RETURNS TABLE (
  hora_inicio TIMESTAMPTZ,
  hora_fim    TIMESTAMPTZ,
  disponivel  BOOLEAN
)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_dia_semana  TEXT;
  v_hora_abre   TIME;
  v_hora_fecha  TIME;
  v_slot        TIMESTAMPTZ;
  v_slot_fim    TIMESTAMPTZ;
  v_limite      TIMESTAMPTZ;
  v_agora       TIMESTAMPTZ;
BEGIN
  v_dia_semana := EXTRACT(DOW FROM p_data)::TEXT;
  v_agora      := NOW();

  -- busca horário de funcionamento do barbeiro (ou da empresa)
  SELECT
    COALESCE(b.hora_inicio, e.hora_inicio),
    COALESCE(b.hora_fim, e.hora_fim)
  INTO v_hora_abre, v_hora_fecha
  FROM horarios_funcionamento e
  LEFT JOIN horarios_funcionamento b
    ON b.empresa_id = p_empresa_id
    AND b.barbeiro_id = p_barbeiro_id
    AND b.dia_semana = v_dia_semana::dia_semana
    AND b.ativo = true
  WHERE e.empresa_id = p_empresa_id
    AND e.barbeiro_id IS NULL
    AND e.dia_semana = v_dia_semana::dia_semana
    AND e.ativo = true
  LIMIT 1;

  IF v_hora_abre IS NULL THEN
    RETURN; -- barbearia fechada neste dia
  END IF;

  -- Interpreta os horários como America/Sao_Paulo (horário local da barbearia)
  v_slot  := (p_data::TEXT || ' ' || v_hora_abre::TEXT)::TIMESTAMP
               AT TIME ZONE 'America/Sao_Paulo';
  v_limite := (p_data::TEXT || ' ' || v_hora_fecha::TEXT)::TIMESTAMP
               AT TIME ZONE 'America/Sao_Paulo';

  LOOP
    v_slot_fim := v_slot + (p_duracao_min || ' minutes')::INTERVAL;
    EXIT WHEN v_slot_fim > v_limite;

    hora_inicio := v_slot;
    hora_fim    := v_slot_fim;

    -- 1. Verifica se o slot já passou (se for hoje)
    IF v_slot < v_agora THEN
      disponivel := false;
    ELSE
      -- 2. verifica conflito com agendamentos existentes
      SELECT NOT EXISTS (
        SELECT 1 FROM agendamentos a
        WHERE a.barbeiro_id = p_barbeiro_id
          AND a.status NOT IN ('cancelado', 'no_show')
          AND tstzrange(a.data_hora_inicio, a.data_hora_fim, '[)')
              && tstzrange(v_slot, v_slot_fim, '[)')
      )
      -- 3. verifica conflito com bloqueios
      AND NOT EXISTS (
        SELECT 1 FROM horarios_bloqueados b
        WHERE (b.barbeiro_id = p_barbeiro_id OR b.barbeiro_id IS NULL)
          AND b.empresa_id = p_empresa_id
          AND tstzrange(b.data_inicio, b.data_fim, '[)')
              && tstzrange(v_slot, v_slot_fim, '[)')
      )
      INTO disponivel;
    END IF;

    RETURN NEXT;

    v_slot := v_slot_fim;
  END LOOP;
END;
$$;
