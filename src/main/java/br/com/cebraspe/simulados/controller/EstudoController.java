package br.com.cebraspe.simulados.controller;

import br.com.cebraspe.simulados.domain.*;
import br.com.cebraspe.simulados.service.EstudoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/estudo")
@CrossOrigin(origins = "*")
public class EstudoController {

    private final EstudoService estudoService;

    public EstudoController(EstudoService estudoService) {
        this.estudoService = estudoService;
    }

    @GetMapping("/questoes")
    public ResponseEntity<List<QuestaoCompleta>> buscarQuestoes(
            @RequestParam(defaultValue = "default") String sessionId,
            @RequestParam(required = false) String assunto,
            @RequestParam(defaultValue = "10") int limite,
            @RequestParam(defaultValue = "false") boolean apenasVencidas) {
        return ResponseEntity.ok(
                estudoService.buscarQuestoes(sessionId, assunto, limite, apenasVencidas));
    }

    @PostMapping("/responder")
    public ResponseEntity<RespostaResult> responder(
            @Valid @RequestBody RespostaRequest request) {
        return ResponseEntity.ok(estudoService.responder(request));
    }

    @GetMapping("/assuntos")
    public ResponseEntity<List<String>> listarAssuntos() {
        return ResponseEntity.ok(estudoService.listarAssuntos());
    }

    @GetMapping("/estatisticas")
    public ResponseEntity<Map<String, Object>> estatisticas(
            @RequestParam(defaultValue = "default") String sessionId) {
        return ResponseEntity.ok(estudoService.buscarEstatisticas(sessionId));
    }

    @GetMapping("/criticas")
    public ResponseEntity<List<QuestaoCompleta>> questoesCriticas(
            @RequestParam(defaultValue = "default") String sessionId) {
        return ResponseEntity.ok(estudoService.buscarQuestoesCriticas(sessionId));
    }

    @PutMapping("/mnemonico/{questaoId}")
    public ResponseEntity<Void> salvarMnemonico(
            @PathVariable UUID questaoId,
            @RequestParam(defaultValue = "default") String sessionId,
            @RequestBody Map<String, String> body) {
        estudoService.salvarMnemonico(questaoId, sessionId, body.get("mnemonico"));
        return ResponseEntity.ok().build();
    }
}