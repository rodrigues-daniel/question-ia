-- 1. Adiciona a coluna
ALTER TABLE public.questoes
ADD COLUMN topico VARCHAR(255);

-- 2. Cria o índice para performance em filtros (opcional, mas recomendado)
CREATE INDEX IF NOT EXISTS idx_questoes_topico
    ON questoes(topico);