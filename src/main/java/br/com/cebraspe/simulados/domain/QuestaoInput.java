package br.com.cebraspe.simulados.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record QuestaoInput(
        @NotBlank String enunciado,
        @NotNull Boolean gabarito,
        @NotBlank String assunto,
        String banca,
        Integer ano,
        String cargo,
        String pegadinha,
        String tipoPegadinha,
        List<String> palavrasAlerta,
        String detalhePegadinha,
        String referenciaLegal) {
    public QuestaoInput {
        banca = (banca == null || banca.isBlank()) ? "CEBRASPE" : banca;
        palavrasAlerta = (palavrasAlerta == null) ? List.of() : palavrasAlerta;
    }
}