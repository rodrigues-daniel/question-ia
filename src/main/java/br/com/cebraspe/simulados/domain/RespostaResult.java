package br.com.cebraspe.simulados.domain;

import java.time.OffsetDateTime;
import java.util.List;

public record RespostaResult(
        boolean correta,
        boolean gabaritoOficial,
        String explicacaoPegadinha,
        String detalhePegadinha,
        String referenciaLegal,
        List<String> palavrasAlerta,
        String mnemonicoPersonal,
        OffsetDateTime proximaRevisao,
        int novoGrauCerteza,
        int errosRecorrentes,
        String mensagemEstudo) {
}