package br.com.cebraspe.simulados.domain;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import br.com.cebraspe.simulados.config.GabaritoDeserializer;
import br.com.cebraspe.simulados.config.PegadinhaDeserializer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Record de entrada do payload v4.0.
 *
 * Campos de mapeamento:
 * - gabarito : Boolean | "C" | "E" | "CERTO" | "ERRADO" | "true" | "false"
 * - pegadinha : Boolean | String (texto descritivo) ← corrigido
 */
public record QuestaoInput(

        @JsonProperty("id") Integer idOrigem,

        @JsonProperty("disciplina") String disciplina,

        @JsonProperty("topico") String topico,

        @NotBlank @JsonProperty("enunciado") String enunciado,

        @NotNull @JsonDeserialize(using = GabaritoDeserializer.class) @JsonProperty("gabarito") Boolean gabarito,

        @JsonProperty("assunto") String assunto,

        @JsonProperty("banca") String banca,

        @JsonProperty("ano") Integer ano,

        @JsonProperty("cargo") String cargo,

        /**
         * No payload v4.0 "pegadinha" pode ser:
         * - true/false (flag booleana legada)
         * - "texto..." (descrição da pegadinha)
         * Armazenamos sempre como String.
         * O deserializador PegadinhaDeserializer trata os dois casos.
         */
        @JsonDeserialize(using = PegadinhaDeserializer.class) @JsonProperty("pegadinha") String pegadinha,

        @JsonAlias("tipo_pegadinha") @JsonProperty("tipoPegadinha") String tipoPegadinha,

        @JsonAlias("palavras_alerta") @JsonProperty("palavrasAlerta") List<String> palavrasAlerta,

        @JsonAlias("detalhe_pegadinha") @JsonProperty("detalhePegadinha") String detalhePegadinha,

        @JsonAlias("referencia_legal") @JsonProperty("referenciaLegal") String referenciaLegal,

        @JsonAlias("comentario_professor") @JsonProperty("comentarioProfessor") String comentarioProfessor,

        @JsonAlias("analise_estudo") @JsonProperty("analiseEstudo") AnaliseEstudoInput analiseEstudo

) {
    public QuestaoInput {
        banca = banca != null ? banca : "CEBRASPE";
        palavrasAlerta = palavrasAlerta != null ? palavrasAlerta : List.of();
        // Se não veio "assunto", usa "disciplina" como fallback
        assunto = (assunto != null && !assunto.isBlank())
                ? assunto
                : (disciplina != null && !disciplina.isBlank()
                        ? disciplina
                        : "Geral");
    }

    /** Gabarito já vem deserializado como Boolean pelo GabaritoDeserializer. */
    public boolean gabaritoBoolean() {
        return Boolean.TRUE.equals(gabarito);
    }
}