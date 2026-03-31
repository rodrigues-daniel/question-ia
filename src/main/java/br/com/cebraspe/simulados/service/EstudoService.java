package br.com.cebraspe.simulados.service;

import br.com.cebraspe.simulados.domain.*;
import br.com.cebraspe.simulados.repository.AnaliseEstudoRepository;
import br.com.cebraspe.simulados.repository.QuestaoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EstudoService {

    private static final Logger log = LoggerFactory.getLogger(EstudoService.class);

    private final QuestaoRepository questaoRepo;
    private final AnaliseEstudoRepository analiseRepo;

    @Value("${app.estudo.intervalo-base-horas:24}")
    private double intervaloBaseHoras;

    @Value("${app.estudo.fator-acerto:2.5}")
    private double fatorAcerto;

    @Value("${app.estudo.fator-erro:0.5}")
    private double fatorErro;

    public EstudoService(QuestaoRepository questaoRepo,
            AnaliseEstudoRepository analiseRepo) {
        this.questaoRepo = questaoRepo;
        this.analiseRepo = analiseRepo;
    }

    public List<QuestaoCompleta> buscarQuestoes(String sessionId,
            String assunto,
            int limite,
            boolean apenasVencidas) {
        return questaoRepo.buscarParaEstudo(sessionId, assunto, limite, apenasVencidas);
    }

    public List<String> listarAssuntos() {
        return questaoRepo.listarAssuntos();
    }

    public Map<String, Object> buscarEstatisticas(String sessionId) {
        return questaoRepo.buscarEstatisticas(sessionId);
    }

    public List<QuestaoCompleta> buscarQuestoesCriticas(String sessionId) {
        return questaoRepo.buscarPorErrosRecorrentes(sessionId, 20);
    }

    @Transactional
    public RespostaResult responder(RespostaRequest request) {
        Questao questao = questaoRepo.buscarPorId(request.questaoId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Questão não encontrada: " + request.questaoId()));

        boolean acertou = request.resposta().equals(questao.gabarito());

        log.debug("Resposta: questao={}, resposta={}, gabarito={}, acertou={}",
                questao.id(), request.resposta(), questao.gabarito(), acertou);

        analiseRepo.upsertAposResposta(
                request.questaoId(),
                request.sessionId(),
                acertou,
                request.grauCerteza(),
                request.mnemonicoPersonal(),
                fatorAcerto,
                fatorErro,
                intervaloBaseHoras);

        // Busca análise atualizada para retornar dados precisos
        var analise = analiseRepo.buscarPorQuestaoESession(
                request.questaoId(), request.sessionId());

        String mensagem = gerarMensagemEstudo(acertou, questao, analise.orElse(null));

        return new RespostaResult(
                acertou,
                questao.gabarito(),
                questao.pegadinha(),
                questao.detalhePegadinha(),
                questao.referenciaLegal(),
                questao.palavrasAlerta(),
                analise.map(AnaliseEstudo::mnemonicoPersonal).orElse(null),
                analise.map(AnaliseEstudo::dataProximaRevisao).orElse(null),
                request.grauCerteza(),
                analise.map(AnaliseEstudo::errosRecorrentes).orElse(0),
                mensagem);
    }

    @Transactional
    public void salvarMnemonico(UUID questaoId, String sessionId, String mnemonico) {
        analiseRepo.salvarMnemonico(questaoId, sessionId, mnemonico);
    }

    private String gerarMensagemEstudo(boolean acertou, Questao q, AnaliseEstudo ae) {
        if (acertou) {
            int streak = ae != null ? ae.streakAcertos() : 1;
            if (streak >= 5)
                return "🔥 Incrível! " + streak + " acertos seguidos!";
            if (streak >= 3)
                return "✅ Excelente! Você está dominando este assunto.";
            return "✅ Correto! Continue assim.";
        } else {
            int erros = ae != null ? ae.errosRecorrentes() : 1;
            if (erros >= 3) {
                return "⚠️ ATENÇÃO: Esta questão é um ponto crítico! "
                        + erros + " erros recorrentes. Revise o fundamento legal.";
            }
            if (q.pegadinha() != null) {
                return "❌ Errado. Cuidado com a pegadinha: " + q.tipoPegadinha();
            }
            return "❌ Errado. Revise as palavras-chave destacadas.";
        }
    }
}