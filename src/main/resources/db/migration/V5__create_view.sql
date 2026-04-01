CREATE OR REPLACE VIEW vw_questoes_priorizadas AS
SELECT
    q.id,
    q.enunciado,
    q.assunto,
    q.topico,
    q.gabarito,
    q.pegadinha,
    q.tipo_pegadinha,
    q.palavras_alerta,
    q.detalhe_pegadinha,
    q.comentario_professor,
    q.referencia_legal,
    q.gerada_por_ia,
    COALESCE(ae.tentativas, 0)          AS tentativas,
    COALESCE(ae.erros_recorrentes, 0)   AS erros_recorrentes,
    COALESCE(ae.grau_certeza, 0)         AS grau_certeza,
    ae.mnemonico_pessoal,
    ae.data_proxima_revisao,
    COALESCE(ae.streak_acertos, 0)       AS streak_acertos,
    CASE
        WHEN ae.id IS NULL THEN 1000.0
        WHEN ae.data_proxima_revisao <= NOW() THEN
            500.0 + (COALESCE(ae.erros_recorrentes, 0) * 100.0)
        ELSE
            EXTRACT(EPOCH FROM (ae.data_proxima_revisao - NOW())) / 3600.0 * -1
    END AS score_prioridade
FROM questoes q
LEFT JOIN analise_estudo ae
    ON ae.questao_id = q.id
    AND ae.session_id = 'default'
WHERE q.ativa = TRUE
ORDER BY score_prioridade DESC;