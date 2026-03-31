package br.com.cebraspe.simulados.service;

import br.com.cebraspe.simulados.domain.QuestaoCompleta;
import br.com.cebraspe.simulados.repository.QuestaoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AiQuestaoService {

    private static final Logger log = LoggerFactory.getLogger(AiQuestaoService.class);

    private final ChatClient chatClient;
    private final QuestaoRepository questaoRepo;

    public AiQuestaoService(ChatClient chatClient, QuestaoRepository questaoRepo) {
        this.chatClient = chatClient;
        this.questaoRepo = questaoRepo;
    }

    /**
     * Gera novas questões baseadas em questões existentes do banco (RAG simples).
     */
    public String gerarQuestoes(String assunto, int quantidade) {
        // Busca questões existentes como contexto (RAG via banco)
        List<QuestaoCompleta> contexto = questaoRepo.buscarParaEstudo(
                "default", assunto, 5, false);

        StringBuilder contextoBanco = new StringBuilder();
        for (QuestaoCompleta q : contexto) {
            contextoBanco.append("- Enunciado: ").append(q.enunciado()).append("\n");
            contextoBanco.append("  Gabarito: ").append(q.gabarito() ? "CERTO" : "ERRADO").append("\n");
            if (q.pegadinha() != null) {
                contextoBanco.append("  Pegadinha: ").append(q.pegadinha()).append("\n");
            }
            contextoBanco.append("\n");
        }

        String prompt = String.format("""
                Contexto - Questões existentes no banco sobre "%s":
                %s

                Com base nesse contexto e no estilo CEBRASPE, gere %d novas questões
                de Certo ou Errado sobre o assunto "%s".

                Para cada questão, forneça em formato JSON:
                {
                  "questoes": [
                    {
                      "enunciado": "...",
                      "gabarito": true/false,
                      "pegadinha": "...",
                      "tipo_pegadinha": "...",
                      "palavras_alerta": ["palavra1", "palavra2"],
                      "detalhe_pegadinha": "...",
                      "referencia_legal": "..."
                    }
                  ]
                }

                Regras:
                1. Use linguagem técnica e assertiva
                2. Inclua pegadinhas sutis baseadas em trocas de palavras-chave legais
                3. Varie entre assertivas corretas e incorretas
                4. Foque em detalhes que candidatos costumam errar
                """, assunto, contextoBanco, quantidade, assunto);

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }

    /**
     * Explica uma questão específica usando IA.
     */
    public String explicarQuestao(String enunciado, boolean gabarito, String pegadinha) {
        String prompt = String.format("""
                Analise esta questão do estilo CEBRASPE:

                Enunciado: %s
                Gabarito: %s
                Pegadinha identificada: %s

                Forneça uma explicação detalhada:
                1. Por que o gabarito é %s
                2. Qual é a lógica da pegadinha (se houver)
                3. Como memorizar a resposta correta
                4. Quais dispositivos legais ou conceitos são cobrados
                5. Dica mnemônica para não errar novamente
                """,
                enunciado,
                gabarito ? "CERTO" : "ERRADO",
                pegadinha != null ? pegadinha : "nenhuma identificada",
                gabarito ? "CERTO" : "ERRADO");

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }

    /**
     * Reformula uma questão para variar o enunciado mantendo o mesmo conceito.
     */
    public String reformularQuestao(String enunciado, boolean gabarito) {
        String prompt = String.format("""
                Reformule esta questão CEBRASPE de 3 formas diferentes,
                mantendo o mesmo conceito e gabarito (%s):

                Original: %s

                Retorne em JSON:
                {
                  "reformulacoes": [
                    {"enunciado": "...", "nivel": "fácil/médio/difícil"}
                  ]
                }
                """, gabarito ? "CERTO" : "ERRADO", enunciado);

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }

    /**
     * Análise de desempenho personalizada com sugestões de estudo.
     */
    public String analisarDesempenho(Map<String, Object> estatisticas, String assuntoFraco) {
        String prompt = String.format("""
                Analise o desempenho deste candidato em simulados CEBRASPE:

                Estatísticas gerais:
                - Total de questões: %s
                - Questões estudadas: %s
                - Total de tentativas: %s
                - Total de acertos: %s
                - Grau de certeza médio: %.1f/5.0
                - Questões críticas (3+ erros): %s
                - Revisões pendentes: %s

                Assunto com mais dificuldade: %s

                Forneça:
                1. Diagnóstico do nível atual
                2. Pontos críticos que precisam de atenção imediata
                3. Estratégia de estudo personalizada para os próximos 7 dias
                4. Técnicas específicas para o assunto fraco
                5. Estimativa de prontidão para a prova
                """,
                estatisticas.get("totalQuestoes"),
                estatisticas.get("questoesEstudadas"),
                estatisticas.get("totalTentativas"),
                estatisticas.get("totalAcertos"),
                ((Number) estatisticas.getOrDefault("mediaGrauCerteza", 0)).doubleValue(),
                estatisticas.get("questoesCriticas"),
                estatisticas.get("revisoesPendentes"),
                assuntoFraco != null ? assuntoFraco : "não identificado");

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }
}