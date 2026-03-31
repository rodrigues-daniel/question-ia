package br.com.cebraspe.simulados.domain;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record Questao(
        UUID id,
        String enunciado,
        Boolean gabarito,
        String assunto,
        String banca,
        Integer ano,
        String cargo,
        String pegadinha,
        String tipoPegadinha,
        List<String> palavrasAlerta,
        String detalhePegadinha,
        String referenciaLegal,
        Boolean ativa,
        OffsetDateTime criadoEm,
        OffsetDateTime atualizadoEm) {
}