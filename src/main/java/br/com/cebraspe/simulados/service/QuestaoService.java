package br.com.cebraspe.simulados.service;

import br.com.cebraspe.simulados.domain.IngestaoRequest;
import br.com.cebraspe.simulados.domain.QuestaoInput;
import br.com.cebraspe.simulados.repository.QuestaoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class QuestaoService {

    private static final Logger log = LoggerFactory.getLogger(QuestaoService.class);
    private final QuestaoRepository questaoRepo;

    public QuestaoService(QuestaoRepository questaoRepo) {
        this.questaoRepo = questaoRepo;
    }

    @Transactional
    public Map<String, Object> ingerirQuestoes(IngestaoRequest request) {
        List<UUID> ids = new ArrayList<>();
        List<String> erros = new ArrayList<>();

        for (QuestaoInput input : request.questoes()) {
            try {
                UUID id = questaoRepo.inserir(input);
                ids.add(id);
                log.info("Questão inserida: id={}, assunto={}", id, input.assunto());
            } catch (Exception e) {
                log.error("Erro ao inserir questão: {}", e.getMessage());
                erros.add("Erro em '" + input.enunciado().substring(0,
                        Math.min(50, input.enunciado().length())) + "...': " + e.getMessage());
            }
        }

        return Map.of(
                "inseridas", ids.size(),
                "ids", ids,
                "erros", erros);
    }
}