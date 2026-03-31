package br.com.cebraspe.simulados.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AnaliseEstudo(
        UUID id,
        UUID questaoId,
        String sessionId,
        Integer tentativas,
        Integer acertos,
        Integer errosRecorrentes,
        Integer grauCerteza,
        String mnemonicoPersonal,
        OffsetDateTime dataUltimaTentativa,
        OffsetDateTime dataProximaRevisao,
        BigDecimal intervaloAtualHoras,
        Integer streakAcertos,
        OffsetDateTime criadoEm,
        OffsetDateTime atualizadoEm) {
}