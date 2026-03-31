package br.com.cebraspe.simulados.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record IngestaoRequest(
        @NotEmpty @Valid List<QuestaoInput> questoes) {
}