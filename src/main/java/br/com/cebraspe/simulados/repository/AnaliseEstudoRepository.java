package br.com.cebraspe.simulados.repository;

import br.com.cebraspe.simulados.domain.AnaliseEstudo;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public class AnaliseEstudoRepository {

    private final JdbcClient jdbc;

    public AnaliseEstudoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<AnaliseEstudo> buscarPorQuestaoESession(UUID questaoId, String sessionId) {
        return jdbc.sql("""
                SELECT * FROM analise_estudo
                WHERE questao_id = :questaoId AND session_id = :sessionId
                """)
                .param("questaoId", questaoId)
                .param("sessionId", sessionId)
                .query(this::mapear)
                .optional();
    }

    /**
     * Upsert: cria ou atualiza a análise de estudo.
     * Aplica algoritmo SM-2 simplificado para revisão espaçada.
     */
    public void upsertAposResposta(UUID questaoId,
            String sessionId,
            boolean acertou,
            int grauCerteza,
            String mnemonicoPersonal,
            double fatorAcerto,
            double fatorErro,
            double intervaloBaseHoras) {

        Optional<AnaliseEstudo> existente = buscarPorQuestaoESession(questaoId, sessionId);

        if (existente.isEmpty()) {
            // Primeira tentativa: cria registro
            UUID id = UUID.randomUUID();
            double novoIntervalo = acertou
                    ? intervaloBaseHoras * fatorAcerto
                    : intervaloBaseHoras * fatorErro;

            jdbc.sql("""
                    INSERT INTO analise_estudo (
                        id, questao_id, session_id, tentativas, acertos,
                        erros_recorrentes, grau_certeza, mnemonico_pessoal,
                        data_ultima_tentativa, data_proxima_revisao,
                        intervalo_atual_horas, streak_acertos
                    ) VALUES (
                        :id, :questaoId, :sessionId, 1,
                        :acertos, :erros, :grauCerteza, :mnemonico,
                        NOW(),
                        NOW() + (:intervalo || ' hours')::interval,
                        :intervalo, :streak
                    )
                    """)
                    .param("id", id)
                    .param("questaoId", questaoId)
                    .param("sessionId", sessionId)
                    .param("acertos", acertou ? 1 : 0)
                    .param("erros", acertou ? 0 : 1)
                    .param("grauCerteza", grauCerteza)
                    .param("mnemonico", mnemonicoPersonal)
                    .param("intervalo", novoIntervalo)
                    .param("streak", acertou ? 1 : 0)
                    .update();
        } else {
            AnaliseEstudo ae = existente.get();

            // Calcula novo intervalo com SM-2 simplificado
            double novoIntervalo;
            int novoStreak;
            int novosErros;

            if (acertou) {
                novoStreak = ae.streakAcertos() + 1;
                novosErros = Math.max(0, ae.errosRecorrentes() - 1);
                // Aumenta exponencialmente com streak
                novoIntervalo = ae.intervaloAtualHoras().doubleValue()
                        * fatorAcerto
                        * (1 + (novoStreak * 0.1));
                // Cap em 30 dias
                novoIntervalo = Math.min(novoIntervalo, 720.0);
            } else {
                novoStreak = 0;
                novosErros = ae.errosRecorrentes() + 1;
                // Penaliza: reduz intervalo
                novoIntervalo = Math.max(
                        ae.intervaloAtualHoras().doubleValue() * fatorErro,
                        intervaloBaseHoras * 0.5);
            }

            String mnemonicoFinal = (mnemonicoPersonal != null && !mnemonicoPersonal.isBlank())
                    ? mnemonicoPersonal
                    : ae.mnemonicoPersonal();

            jdbc.sql("""
                    UPDATE analise_estudo SET
                        tentativas            = tentativas + 1,
                        acertos               = acertos + :deltaAcerto,
                        erros_recorrentes     = :erros,
                        grau_certeza          = :grauCerteza,
                        mnemonico_pessoal     = :mnemonico,
                        data_ultima_tentativa = NOW(),
                        data_proxima_revisao  = NOW() + (:intervalo || ' hours')::interval,
                        intervalo_atual_horas = :intervalo,
                        streak_acertos        = :streak
                    WHERE questao_id = :questaoId AND session_id = :sessionId
                    """)
                    .param("deltaAcerto", acertou ? 1 : 0)
                    .param("erros", novosErros)
                    .param("grauCerteza", grauCerteza)
                    .param("mnemonico", mnemonicoFinal)
                    .param("intervalo", novoIntervalo)
                    .param("streak", novoStreak)
                    .param("questaoId", questaoId)
                    .param("sessionId", sessionId)
                    .update();
        }

        // Persiste histórico
        jdbc.sql("""
                INSERT INTO historico_respostas (
                    id, questao_id, session_id, resposta, correta, grau_certeza
                ) VALUES (
                    :id, :questaoId, :sessionId, :resposta, :correta, :grauCerteza
                )
                """)
                .param("id", UUID.randomUUID())
                .param("questaoId", questaoId)
                .param("sessionId", sessionId)
                .param("resposta", acertou) // simplificado; no fluxo real vem do request
                .param("correta", acertou)
                .param("grauCerteza", grauCerteza)
                .update();
    }

    public void salvarMnemonico(UUID questaoId, String sessionId, String mnemonico) {
        int updated = jdbc.sql("""
                UPDATE analise_estudo SET mnemonico_pessoal = :mnemonico
                WHERE questao_id = :questaoId AND session_id = :sessionId
                """)
                .param("mnemonico", mnemonico)
                .param("questaoId", questaoId)
                .param("sessionId", sessionId)
                .update();

        if (updated == 0) {
            jdbc.sql("""
                    INSERT INTO analise_estudo (id, questao_id, session_id, mnemonico_pessoal)
                    VALUES (:id, :questaoId, :sessionId, :mnemonico)
                    ON CONFLICT (questao_id, session_id) DO UPDATE
                    SET mnemonico_pessoal = EXCLUDED.mnemonico_pessoal
                    """)
                    .param("id", UUID.randomUUID())
                    .param("questaoId", questaoId)
                    .param("sessionId", sessionId)
                    .param("mnemonico", mnemonico)
                    .update();
        }
    }

    private AnaliseEstudo mapear(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new AnaliseEstudo(
                UUID.fromString(rs.getString("id")),
                UUID.fromString(rs.getString("questao_id")),
                rs.getString("session_id"),
                rs.getInt("tentativas"),
                rs.getInt("acertos"),
                rs.getInt("erros_recorrentes"),
                rs.getInt("grau_certeza"),
                rs.getString("mnemonico_pessoal"),
                rs.getObject("data_ultima_tentativa", OffsetDateTime.class),
                rs.getObject("data_proxima_revisao", OffsetDateTime.class),
                rs.getBigDecimal("intervalo_atual_horas"),
                rs.getInt("streak_acertos"),
                rs.getObject("criado_em", OffsetDateTime.class),
                rs.getObject("atualizado_em", OffsetDateTime.class));
    }
}