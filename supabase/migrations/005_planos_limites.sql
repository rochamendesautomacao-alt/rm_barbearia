-- =============================================================
-- Migration 005: Sistema de Planos — limites e verificações
-- =============================================================

-- Atualiza seed de planos com nomes e limites corretos
UPDATE planos SET
  nome                 = 'Starter',
  preco_mensal         = 0.00,
  max_barbeiros        = 1,
  max_agendamentos_mes = 50,
  recursos             = '{"relatorios": false, "whatsapp": false, "personalizar_cores": false, "exportar_csv": false}'
WHERE nome = 'Starter';

UPDATE planos SET
  nome                 = 'Básico',
  preco_mensal         = 49.90,
  max_barbeiros        = 3,
  max_agendamentos_mes = 300,
  recursos             = '{"relatorios": true, "whatsapp": false, "personalizar_cores": true, "exportar_csv": false}'
WHERE nome = 'Pro';

UPDATE planos SET
  nome                 = 'Profissional',
  preco_mensal         = 99.90,
  max_barbeiros        = 15,
  max_agendamentos_mes = 9999,
  recursos             = '{"relatorios": true, "whatsapp": true, "personalizar_cores": true, "exportar_csv": true}'
WHERE nome = 'Premium';

-- =============================================================
-- VIEW: assinatura ativa com dados do plano
-- =============================================================

CREATE OR REPLACE VIEW vw_assinatura_ativa AS
SELECT
  a.id                     AS assinatura_id,
  a.empresa_id,
  a.status,
  a.data_inicio,
  a.data_fim,
  p.id                     AS plano_id,
  p.nome                   AS plano_nome,
  p.preco_mensal,
  p.max_barbeiros,
  p.max_agendamentos_mes,
  p.recursos,
  -- barbeiros ativos atuais
  (
    SELECT COUNT(*)
    FROM barbeiros b
    WHERE b.empresa_id = a.empresa_id AND b.ativo = true
  )                        AS barbeiros_em_uso,
  -- agendamentos no mês corrente (exceto cancelados/no_show)
  (
    SELECT COUNT(*)
    FROM agendamentos ag
    WHERE ag.empresa_id = a.empresa_id
      AND ag.status NOT IN ('cancelado', 'no_show')
      AND DATE_TRUNC('month', ag.created_at) = DATE_TRUNC('month', NOW())
  )                        AS agendamentos_mes_em_uso
FROM assinaturas a
JOIN planos p ON p.id = a.plano_id
WHERE a.status IN ('ativa', 'trial');

-- =============================================================
-- FUNÇÃO: retorna o plano ativo de uma empresa
-- =============================================================

CREATE OR REPLACE FUNCTION plano_da_empresa(p_empresa_id UUID)
RETURNS TABLE (
  plano_nome            TEXT,
  max_barbeiros         INT,
  max_agendamentos_mes  INT,
  barbeiros_em_uso      BIGINT,
  agendamentos_mes      BIGINT,
  status_assinatura     status_assinatura,
  recursos              JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.plano_nome,
    v.max_barbeiros,
    v.max_agendamentos_mes,
    v.barbeiros_em_uso,
    v.agendamentos_mes_em_uso,
    v.status,
    v.recursos
  FROM vw_assinatura_ativa v
  WHERE v.empresa_id = p_empresa_id
  LIMIT 1;
END;
$$;

-- =============================================================
-- FUNÇÃO: verifica se empresa pode adicionar barbeiro
-- Retorna TRUE = pode, FALSE = limite atingido
-- =============================================================

CREATE OR REPLACE FUNCTION pode_adicionar_barbeiro(p_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_max    INT;
  v_atual  BIGINT;
BEGIN
  SELECT p.max_barbeiros
  INTO v_max
  FROM assinaturas a
  JOIN planos p ON p.id = a.plano_id
  WHERE a.empresa_id = p_empresa_id
    AND a.status IN ('ativa', 'trial')
  LIMIT 1;

  IF v_max IS NULL THEN
    RETURN FALSE;  -- sem assinatura ativa
  END IF;

  SELECT COUNT(*)
  INTO v_atual
  FROM barbeiros
  WHERE empresa_id = p_empresa_id AND ativo = true;

  RETURN v_atual < v_max;
END;
$$;

-- =============================================================
-- FUNÇÃO: verifica se empresa pode criar agendamento este mês
-- =============================================================

CREATE OR REPLACE FUNCTION pode_criar_agendamento(p_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_max    INT;
  v_atual  BIGINT;
BEGIN
  SELECT p.max_agendamentos_mes
  INTO v_max
  FROM assinaturas a
  JOIN planos p ON p.id = a.plano_id
  WHERE a.empresa_id = p_empresa_id
    AND a.status IN ('ativa', 'trial')
  LIMIT 1;

  IF v_max IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 9999 = ilimitado (plano Profissional)
  IF v_max >= 9999 THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(*)
  INTO v_atual
  FROM agendamentos
  WHERE empresa_id = p_empresa_id
    AND status NOT IN ('cancelado', 'no_show')
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());

  RETURN v_atual < v_max;
END;
$$;

-- =============================================================
-- TRIGGER: bloqueia INSERT de barbeiro se limite atingido
-- =============================================================

CREATE OR REPLACE FUNCTION check_limite_barbeiros()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT pode_adicionar_barbeiro(NEW.empresa_id) THEN
    RAISE EXCEPTION 'LIMITE_BARBEIROS: Limite de barbeiros do plano atingido.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_limite_barbeiros
  BEFORE INSERT ON barbeiros
  FOR EACH ROW
  EXECUTE FUNCTION check_limite_barbeiros();

-- =============================================================
-- TRIGGER: bloqueia INSERT de agendamento se limite atingido
-- =============================================================

CREATE OR REPLACE FUNCTION check_limite_agendamentos()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT pode_criar_agendamento(NEW.empresa_id) THEN
    RAISE EXCEPTION 'LIMITE_AGENDAMENTOS: Limite de agendamentos do plano atingido este mês.'
      USING ERRCODE = 'P0002';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_limite_agendamentos
  BEFORE INSERT ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION check_limite_agendamentos();

-- =============================================================
-- RLS para vw_assinatura_ativa
-- =============================================================

ALTER VIEW vw_assinatura_ativa OWNER TO postgres;

CREATE OR REPLACE FUNCTION pode_ver_assinatura(p_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p_empresa_id = minha_empresa_id()
$$;
