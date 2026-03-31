package br.com.cebraspe.simulados.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Projeção que une dados de questoes + analise_estudo
 * para a view de estudo.
 */
public record QuestaoCompleta(
        UUID id,
        String enunciado,
        String assunto,
        Boolean gabarito,
        String pegadinha,
        String tipoPegadinha,
        List<String> palavrasAlerta,
        String detalhePegadinha,
        String referenciaLegal,
        Integer tentativas,
        Integer errosRecorrentes,
        Integer grauCerteza,
        String mnemonicoPersonal,
        OffsetDateTime dataProximaRevisao,
        Integer streakAcertos,
        Double scorePrioridade) {
}