package br.com.cebraspe.simulados.repository;

import br.com.cebraspe.simulados.domain.AnaliseEstudoInput;
import br.com.cebraspe.simulados.domain.Questao;
import br.com.cebraspe.simulados.domain.QuestaoCompleta;
import br.com.cebraspe.simulados.domain.QuestaoInput;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Array;
import java.sql.SQLException;
import java.util.*;

@Repository
public class QuestaoRepository {

    private final JdbcClient jdbc;

    public QuestaoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public UUID inserir(QuestaoInput input) {
        UUID id = UUID.randomUUID();

        // Extrai dados do bloco analise_estudo
        String mnemonicoInicial = null;
        int errosIniciais = 0;
        int grauInicial = 0;

        if (input.analiseEstudo() != null) {
            AnaliseEstudoInput ae = input.analiseEstudo();
            mnemonicoInicial = ae.meuMnemonicoPersonal();
            errosIniciais = ae.errosRecorrentes() != null ? ae.errosRecorrentes() : 0;
            grauInicial = ae.meuGrauCerteza() != null ? ae.meuGrauCerteza() : 0;
        }

        // 1. Insere a questão principal
        jdbc.sql("""
                INSERT INTO questoes (
                    id, enunciado, gabarito, assunto, banca, ano, cargo,
                    pegadinha, tipo_pegadinha, palavras_alerta,
                    detalhe_pegadinha, referencia_legal
                ) VALUES (
                    :id, :enunciado, :gabarito, :assunto, :banca, :ano, :cargo,
                    :pegadinha, :tipoPegadinha, :palavrasAlerta::text[],
                    :detalhePegadinha, :referenciaLegal
                )
                """)
                .param("id", id)
                .param("enunciado", input.enunciado())
                .param("gabarito", input.gabaritoBoolean()) // Boolean limpo
                .param("assunto", input.assunto())
                .param("banca", input.banca())
                .param("ano", input.ano())
                .param("cargo", input.cargo())
                .param("pegadinha", input.pegadinha()) // String | null
                .param("tipoPegadinha", input.tipoPegadinha())
                .param("palavrasAlerta", converterParaArray(input.palavrasAlerta()))
                .param("detalhePegadinha", input.detalhePegadinha())
                .param("referenciaLegal", input.referenciaLegal())
                .update();

        // 2. Pré-popula analise_estudo se o payload trouxer dados
        if (input.analiseEstudo() != null
                && (mnemonicoInicial != null || errosIniciais > 0 || grauInicial > 0)) {

            jdbc.sql("""
                    INSERT INTO analise_estudo (
                        id, questao_id, session_id,
                        tentativas, acertos, erros_recorrentes,
                        grau_certeza, mnemonico_pessoal,
                        data_proxima_revisao, intervalo_atual_horas, streak_acertos
                    ) VALUES (
                        :id, :questaoId, 'default',
                        :tentativas, 0, :erros,
                        :grau, :mnemonico,
                        NOW(), 24, 0
                    )
                    ON CONFLICT (questao_id, session_id) DO NOTHING
                    """)
                    .param("id", UUID.randomUUID())
                    .param("questaoId", id)
                    .param("tentativas", input.analiseEstudo().tentativasAnteriores())
                    .param("erros", errosIniciais)
                    .param("grau", grauInicial)
                    .param("mnemonico", mnemonicoInicial)
                    .update();
        }

        return id;
    }

    public Optional<Questao> buscarPorId(UUID id) {
        return jdbc.sql("SELECT * FROM questoes WHERE id = :id AND ativa = TRUE")
                .param("id", id)
                .query(this::mapearQuestao)
                .optional();
    }

    public List<QuestaoCompleta> buscarParaEstudo(String sessionId, String assunto,
            int limite, boolean apenasVencidas) {

        return buscarParaEstudo(sessionId, assunto, null, limite, apenasVencidas, false);

        // StringBuilder sql = new StringBuilder("""
        // SELECT
        // q.id, q.enunciado, q.assunto, q.gabarito, q.pegadinha,
        // q.tipo_pegadinha, q.palavras_alerta, q.detalhe_pegadinha,
        // q.referencia_legal,
        // COALESCE(ae.tentativas, 0) AS tentativas,
        // COALESCE(ae.erros_recorrentes, 0) AS erros_recorrentes,
        // COALESCE(ae.grau_certeza, 0) AS grau_certeza,
        // ae.mnemonico_pessoal,
        // ae.data_proxima_revisao,
        // COALESCE(ae.streak_acertos, 0) AS streak_acertos,
        // CASE
        // WHEN ae.id IS NULL THEN 1000.0
        // WHEN ae.data_proxima_revisao <= NOW() THEN
        // 500.0 + (COALESCE(ae.erros_recorrentes, 0) * 100.0)
        // ELSE
        // EXTRACT(EPOCH FROM (ae.data_proxima_revisao - NOW())) / 3600.0 * -1
        // END AS score_prioridade
        // FROM questoes q
        // LEFT JOIN analise_estudo ae
        // ON ae.questao_id = q.id AND ae.session_id = :sessionId
        // WHERE q.ativa = TRUE
        // """);

        // if (assunto != null && !assunto.isBlank()) {
        // sql.append(" AND q.assunto ILIKE :assunto ");
        // }
        // if (apenasVencidas) {
        // sql.append("""
        // AND (ae.id IS NULL OR ae.data_proxima_revisao <= NOW()
        // OR ae.erros_recorrentes >= 3)
        // """);
        // }
        // sql.append(" ORDER BY score_prioridade DESC LIMIT :limite");

        // var query = jdbc.sql(sql.toString())
        // .param("sessionId", sessionId)
        // .param("limite", limite);

        // if (assunto != null && !assunto.isBlank()) {
        // query = query.param("assunto", "%" + assunto + "%");
        // }

        // return query.query(this::mapearQuestaoCompleta).list();
    }

    public List<String> listarAssuntos() {
        return jdbc.sql("SELECT DISTINCT assunto FROM questoes WHERE ativa = TRUE ORDER BY assunto")
                .query(String.class)
                .list();
    }

    public List<QuestaoCompleta> buscarPorErrosRecorrentes(String sessionId, int limite) {
        return jdbc.sql("""
                SELECT
                    q.id, q.enunciado, q.assunto, q.gabarito, q.pegadinha,
                    q.tipo_pegadinha, q.palavras_alerta, q.detalhe_pegadinha,
                    q.referencia_legal,
                    COALESCE(ae.tentativas, 0) AS tentativas,
                    COALESCE(ae.erros_recorrentes, 0) AS erros_recorrentes,
                    COALESCE(ae.grau_certeza, 0) AS grau_certeza,
                    ae.mnemonico_pessoal,
                    ae.data_proxima_revisao,
                    COALESCE(ae.streak_acertos, 0) AS streak_acertos,
                    (COALESCE(ae.erros_recorrentes, 0) * 100.0) AS score_prioridade
                FROM questoes q
                JOIN analise_estudo ae
                    ON ae.questao_id = q.id AND ae.session_id = :sessionId
                WHERE q.ativa = TRUE AND ae.erros_recorrentes >= 2
                ORDER BY ae.erros_recorrentes DESC
                LIMIT :limite
                """)
                .param("sessionId", sessionId)
                .param("limite", limite)
                .query(this::mapearQuestaoCompleta)
                .list();
    }

    public Map<String, Object> buscarEstatisticas(String sessionId) {
        return jdbc.sql("""
                SELECT
                    COUNT(q.id)                                     AS total_questoes,
                    COUNT(ae.id)                                    AS questoes_estudadas,
                    COALESCE(SUM(ae.tentativas), 0)                 AS total_tentativas,
                    COALESCE(SUM(ae.acertos), 0)                    AS total_acertos,
                    COALESCE(AVG(ae.grau_certeza), 0)               AS media_grau_certeza,
                    COUNT(CASE WHEN ae.erros_recorrentes >= 3
                               THEN 1 END)                          AS questoes_criticas,
                    COUNT(CASE WHEN ae.data_proxima_revisao <= NOW()
                               THEN 1 END)                          AS revisoes_pendentes
                FROM questoes q
                LEFT JOIN analise_estudo ae
                    ON ae.questao_id = q.id AND ae.session_id = :sessionId
                WHERE q.ativa = TRUE
                """)
                .param("sessionId", sessionId)
                .query((rs, rowNum) -> {
                    Map<String, Object> stats = new LinkedHashMap<>();
                    stats.put("totalQuestoes", rs.getLong("total_questoes"));
                    stats.put("questoesEstudadas", rs.getLong("questoes_estudadas"));
                    stats.put("totalTentativas", rs.getLong("total_tentativas"));
                    stats.put("totalAcertos", rs.getLong("total_acertos"));
                    stats.put("mediaGrauCerteza", rs.getDouble("media_grau_certeza"));
                    stats.put("questoesCriticas", rs.getLong("questoes_criticas"));
                    stats.put("revisoesPendentes", rs.getLong("revisoes_pendentes"));
                    return stats;
                })
                .single();
    }

    // ---- Mapeadores ----

    private Questao mapearQuestao(java.sql.ResultSet rs, int row) throws SQLException {
        return new Questao(
                UUID.fromString(rs.getString("id")),
                rs.getString("enunciado"),
                rs.getBoolean("gabarito"),
                rs.getString("assunto"),
                rs.getString("banca"),
                rs.getObject("ano", Integer.class),
                rs.getString("cargo"),
                rs.getString("pegadinha"),
                rs.getString("tipo_pegadinha"),
                converterDeArray(rs.getArray("palavras_alerta")),
                rs.getString("detalhe_pegadinha"),
                rs.getString("referencia_legal"),
                rs.getBoolean("ativa"),
                rs.getObject("criado_em", java.time.OffsetDateTime.class),
                rs.getObject("atualizado_em", java.time.OffsetDateTime.class));
    }

    private QuestaoCompleta mapearQuestaoCompleta(java.sql.ResultSet rs, int row) throws SQLException {
        return new QuestaoCompleta(
                UUID.fromString(rs.getString("id")),
                rs.getString("enunciado"),
                rs.getString("assunto"),
                rs.getBoolean("gabarito"),
                rs.getString("pegadinha"),
                rs.getString("tipo_pegadinha"),
                converterDeArray(rs.getArray("palavras_alerta")),
                rs.getString("detalhe_pegadinha"),
                rs.getString("referencia_legal"),
                rs.getInt("tentativas"),
                rs.getInt("erros_recorrentes"),
                rs.getInt("grau_certeza"),
                rs.getString("mnemonico_pessoal"),
                rs.getObject("data_proxima_revisao", java.time.OffsetDateTime.class),
                rs.getInt("streak_acertos"),
                rs.getDouble("score_prioridade"));
    }

    private String converterParaArray(List<String> lista) {
        if (lista == null || lista.isEmpty())
            return "{}";
        return "{" + String.join(",",
                lista.stream().map(s -> "\"" + s.replace("\"", "\\\"") + "\"").toList()) + "}";
    }

    private List<String> converterDeArray(Array array) throws SQLException {
        if (array == null)
            return List.of();
        String[] arr = (String[]) array.getArray();
        return Arrays.asList(arr);
    }

    public List<String> listarTopicos(String assunto) {
        StringBuilder sql = new StringBuilder(
                "SELECT DISTINCT topico FROM questoes WHERE ativa = TRUE AND topico IS NOT NULL");
        var query = jdbc.sql(
                assunto != null && !assunto.isBlank()
                        ? sql.append(" AND assunto ILIKE :assunto").toString()
                        : sql.toString());
        if (assunto != null && !assunto.isBlank())
            query = query.param("assunto", "%" + assunto + "%");
        return query.query(String.class).list();
    }

    public List<QuestaoCompleta> buscarParaEstudo(String sessionId,
            String assunto,
            String topico,
            int limite,
            boolean apenasVencidas,
            boolean apenasNaoRespondidas) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    q.id, q.enunciado, q.assunto, q.gabarito, q.pegadinha,
                    q.tipo_pegadinha, q.palavras_alerta, q.detalhe_pegadinha,
                    q.referencia_legal,
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
                    ON ae.questao_id = q.id AND ae.session_id = :sessionId
                WHERE q.ativa = TRUE
                """);

        if (assunto != null && !assunto.isBlank())
            sql.append(" AND q.assunto ILIKE :assunto");

        if (topico != null && !topico.isBlank())
            sql.append(" AND q.topico ILIKE :topico");

        if (apenasVencidas)
            sql.append("""
                    AND (ae.id IS NULL
                         OR ae.data_proxima_revisao <= NOW()
                         OR ae.erros_recorrentes >= 3)
                    """);

        // Não respondidas = nunca tiveram tentativa nesta sessão
        if (apenasNaoRespondidas)
            sql.append(" AND (ae.id IS NULL OR ae.tentativas = 0)");

        sql.append(" ORDER BY score_prioridade DESC LIMIT :limite");

        var query = jdbc.sql(sql.toString())
                .param("sessionId", sessionId)
                .param("limite", limite);

        if (assunto != null && !assunto.isBlank())
            query = query.param("assunto", "%" + assunto + "%");
        if (topico != null && !topico.isBlank())
            query = query.param("topico", "%" + topico + "%");

        return query.query(this::mapearQuestaoCompleta).list();
    }
}