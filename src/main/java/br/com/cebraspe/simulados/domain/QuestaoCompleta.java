package br.com.cebraspe.simulados.domain;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record QuestaoCompleta(
                UUID id,
                String enunciado,
                String assunto,
                String topico,
                Boolean gabarito,
                String pegadinha,
                String tipoPegadinha,
                List<String> palavrasAlerta,
                String detalhePegadinha, // já existia
                String comentarioProfessor, // ← NOVO
                String referenciaLegal,
                Integer tentativas,
                Integer errosRecorrentes,
                Integer grauCerteza,
                String mnemonicoPersonal,
                OffsetDateTime dataProximaRevisao,
                Integer streakAcertos,
                Double scorePrioridade,
                Boolean geradaPorIa // ← NOVO (badge origem)
) {
}