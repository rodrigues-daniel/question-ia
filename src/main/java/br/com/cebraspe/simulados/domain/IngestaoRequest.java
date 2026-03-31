package br.com.cebraspe.simulados.domain;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.Map;

public record IngestaoRequest(

                @JsonAlias("simulado_config") @JsonProperty("simuladoConfig") Map<String, Object> simuladoConfig,

                @NotEmpty @Valid @JsonProperty("questoes") List<QuestaoInput> questoes,

                @JsonAlias("metadados_evolucao") @JsonProperty("metadadosEvolucao") Map<String, Object> metadadosEvolucao

) {
}