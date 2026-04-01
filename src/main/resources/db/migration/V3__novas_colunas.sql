ALTER TABLE public.questoes
ADD COLUMN comentario_professor TEXT,
ADD COLUMN gerada_por_ia BOOLEAN NOT NULL DEFAULT FALSE;



CREATE INDEX IF NOT EXISTS idx_questoes_gerada_por_ia
    ON questoes(gerada_por_ia);