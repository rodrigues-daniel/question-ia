-- =============================================================
-- SCHEMA: Sistema de Simulados Cebraspe
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- -------------------------------------------------------------
-- Tabela principal de questões (conteúdo)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questoes (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enunciado        TEXT        NOT NULL,
    gabarito         BOOLEAN     NOT NULL, -- TRUE=Certo, FALSE=Errado
    assunto          VARCHAR(255) NOT NULL,
    banca            VARCHAR(100) NOT NULL DEFAULT 'CEBRASPE',
    ano              INTEGER,
    cargo            VARCHAR(255),
    pegadinha        TEXT,
    tipo_pegadinha   VARCHAR(100),
    palavras_alerta  TEXT[], -- array de strings para highlight via regex
    detalhe_pegadinha TEXT,
    referencia_legal TEXT,
    ativa            BOOLEAN     NOT NULL DEFAULT TRUE,
    criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- Tabela de controle interno de estudo (por questão, por usuário)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analise_estudo (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    questao_id            UUID        NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
    session_id            VARCHAR(255) NOT NULL DEFAULT 'default', -- suporte a multi-usuário futuro
    tentativas            INTEGER     NOT NULL DEFAULT 0,
    acertos               INTEGER     NOT NULL DEFAULT 0,
    erros_recorrentes     INTEGER     NOT NULL DEFAULT 0,
    grau_certeza          INTEGER     NOT NULL DEFAULT 0
                          CHECK (grau_certeza BETWEEN 0 AND 5),
    -- 0=Nunca viu, 1=Muito incerto, 2=Incerto, 3=Médio, 4=Confiante, 5=Dominado
    mnemonico_pessoal     TEXT,
    data_ultima_tentativa TIMESTAMPTZ,
    data_proxima_revisao  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    intervalo_atual_horas NUMERIC(10,2) NOT NULL DEFAULT 24,
    streak_acertos        INTEGER     NOT NULL DEFAULT 0,
    criado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (questao_id, session_id)
);

-- -------------------------------------------------------------
-- Tabela de histórico detalhado de respostas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico_respostas (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    questao_id   UUID        NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
    session_id   VARCHAR(255) NOT NULL DEFAULT 'default',
    resposta     BOOLEAN     NOT NULL,
    correta      BOOLEAN     NOT NULL,
    grau_certeza INTEGER     NOT NULL DEFAULT 0,
    tempo_ms     INTEGER,
    respondido_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- Tabela para questões geradas pela IA
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questoes_ia (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    questao_origem_id UUID REFERENCES questoes(id) ON DELETE SET NULL,
    enunciado         TEXT NOT NULL,
    gabarito          BOOLEAN NOT NULL,
    assunto           VARCHAR(255),
    justificativa_ia  TEXT,
    modelo_usado      VARCHAR(100),
    aprovada          BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- Índices para performance
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_questoes_assunto
    ON questoes(assunto);

CREATE INDEX IF NOT EXISTS idx_questoes_ativa
    ON questoes(ativa);

CREATE INDEX IF NOT EXISTS idx_analise_estudo_questao
    ON analise_estudo(questao_id);

CREATE INDEX IF NOT EXISTS idx_analise_estudo_proxima_revisao
    ON analise_estudo(data_proxima_revisao ASC);

CREATE INDEX IF NOT EXISTS idx_analise_estudo_erros
    ON analise_estudo(erros_recorrentes DESC);

CREATE INDEX IF NOT EXISTS idx_analise_estudo_session
    ON analise_estudo(session_id);

CREATE INDEX IF NOT EXISTS idx_historico_questao
    ON historico_respostas(questao_id);

CREATE INDEX IF NOT EXISTS idx_historico_session
    ON historico_respostas(session_id);

-- -------------------------------------------------------------
-- Função: atualiza timestamp automaticamente
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_atualiza_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_questoes_updated
    BEFORE UPDATE ON questoes
    FOR EACH ROW EXECUTE FUNCTION fn_atualiza_timestamp();

CREATE OR REPLACE TRIGGER trg_analise_updated
    BEFORE UPDATE ON analise_estudo
    FOR EACH ROW EXECUTE FUNCTION fn_atualiza_timestamp();

-- -------------------------------------------------------------
-- View: questões priorizadas para estudo
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW vw_questoes_priorizadas AS
SELECT
    q.id,
    q.enunciado,
    q.assunto,
    q.gabarito,
    q.pegadinha,
    q.tipo_pegadinha,
    q.palavras_alerta,
    q.detalhe_pegadinha,
    q.referencia_legal,
    COALESCE(ae.tentativas, 0)            AS tentativas,
    COALESCE(ae.erros_recorrentes, 0)     AS erros_recorrentes,
    COALESCE(ae.grau_certeza, 0)          AS grau_certeza,
    ae.mnemonico_pessoal,
    ae.data_proxima_revisao,
    ae.streak_acertos,
    -- Score de prioridade: quanto maior, mais urgente
    CASE
        WHEN ae.id IS NULL THEN 1000  -- Nunca vista = máxima prioridade
        WHEN ae.data_proxima_revisao <= NOW() THEN
            500 + (COALESCE(ae.erros_recorrentes, 0) * 100)
        ELSE
            EXTRACT(EPOCH FROM (ae.data_proxima_revisao - NOW())) / 3600 * -1
    END AS score_prioridade
FROM questoes q
LEFT JOIN analise_estudo ae ON ae.questao_id = q.id AND ae.session_id = 'default'
WHERE q.ativa = TRUE
ORDER BY score_prioridade DESC;