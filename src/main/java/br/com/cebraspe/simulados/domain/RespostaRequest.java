package br.com.cebraspe.simulados.domain;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record RespostaRequest(
        @NotNull UUID questaoId,
        @NotNull Boolean resposta,
        @Min(0) @Max(5) Integer grauCerteza,
        String sessionId,
        Integer tempoMs,
        String mnemonicoPersonal) {
    public RespostaRequest {
        sessionId = (sessionId == null || sessionId.isBlank()) ? "default" : sessionId;
        grauCerteza = (grauCerteza == null) ? 0 : grauCerteza;
    }
}