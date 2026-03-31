package br.com.cebraspe.simulados.controller;

import br.com.cebraspe.simulados.service.AiQuestaoService;
import br.com.cebraspe.simulados.service.EstudoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ia")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiQuestaoService aiService;
    private final EstudoService estudoService;

    public AiController(AiQuestaoService aiService, EstudoService estudoService) {
        this.aiService = aiService;
        this.estudoService = estudoService;
    }

    @PostMapping("/gerar-questoes")
    public ResponseEntity<Map<String, String>> gerarQuestoes(
            @RequestBody Map<String, Object> body) {
        String assunto = (String) body.getOrDefault("assunto", "Direito Administrativo");
        int quantidade = ((Number) body.getOrDefault("quantidade", 3)).intValue();
        String resultado = aiService.gerarQuestoes(assunto, quantidade);
        return ResponseEntity.ok(Map.of("resultado", resultado));
    }

    @PostMapping("/explicar")
    public ResponseEntity<Map<String, String>> explicar(
            @RequestBody Map<String, Object> body) {
        String enunciado = (String) body.get("enunciado");
        boolean gabarito = Boolean.parseBoolean(body.get("gabarito").toString());
        String pegadinha = (String) body.get("pegadinha");
        String explicacao = aiService.explicarQuestao(enunciado, gabarito, pegadinha);
        return ResponseEntity.ok(Map.of("explicacao", explicacao));
    }

    @PostMapping("/reformular")
    public ResponseEntity<Map<String, String>> reformular(
            @RequestBody Map<String, Object> body) {
        String enunciado = (String) body.get("enunciado");
        boolean gabarito = Boolean.parseBoolean(body.get("gabarito").toString());
        String resultado = aiService.reformularQuestao(enunciado, gabarito);
        return ResponseEntity.ok(Map.of("resultado", resultado));
    }

    @GetMapping("/analisar-desempenho")
    public ResponseEntity<Map<String, String>> analisarDesempenho(
            @RequestParam(defaultValue = "default") String sessionId,
            @RequestParam(required = false) String assuntoFraco) {
        Map<String, Object> stats = estudoService.buscarEstatisticas(sessionId);
        String analise = aiService.analisarDesempenho(stats, assuntoFraco);
        return ResponseEntity.ok(Map.of("analise", analise));
    }
}