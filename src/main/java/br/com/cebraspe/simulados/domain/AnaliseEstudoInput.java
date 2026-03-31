package br.com.cebraspe.simulados.domain;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Sub-record do bloco "analise_estudo" do payload v4.0.
 */
public record AnaliseEstudoInput(

        @JsonAlias("meu_grau_certeza") @JsonProperty("meuGrauCerteza") Integer meuGrauCerteza,

        @JsonAlias("tentativas_anteriores") @JsonProperty("tentativasAnteriores") Integer tentativasAnteriores,

        @JsonAlias("erros_recorrentes") @JsonProperty("errosRecorrentes") Integer errosRecorrentes,

        @JsonAlias("proxima_revisao_sugerida") @JsonProperty("proximaRevisaoSugerida") String proximaRevisaoSugerida,

        @JsonAlias("meu_mnemonico_pessoal") @JsonProperty("meuMnemonicoPersonal") String meuMnemonicoPersonal

) {
    public AnaliseEstudoInput {
        meuGrauCerteza = meuGrauCerteza != null ? meuGrauCerteza : 0;
        tentativasAnteriores = tentativasAnteriores != null ? tentativasAnteriores : 0;
        errosRecorrentes = errosRecorrentes != null ? errosRecorrentes : 0;
    }
}