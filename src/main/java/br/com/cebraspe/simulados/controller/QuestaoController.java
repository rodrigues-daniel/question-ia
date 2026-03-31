package br.com.cebraspe.simulados.controller;

import br.com.cebraspe.simulados.domain.IngestaoRequest;
import br.com.cebraspe.simulados.service.QuestaoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/questoes")
@CrossOrigin(origins = "*")
public class QuestaoController {

    private final QuestaoService questaoService;

    public QuestaoController(QuestaoService questaoService) {
        this.questaoService = questaoService;
    }

    @PostMapping("/ingerir")
    public ResponseEntity<Map<String, Object>> ingerir(
            @Valid @RequestBody IngestaoRequest request) {
        Map<String, Object> resultado = questaoService.ingerirQuestoes(request);
        return ResponseEntity.ok(resultado);
    }
}