package com.gestao.uep.controllers;

import com.gestao.uep.domain.usuario.dto.DadosProfessorDTO;
import com.gestao.uep.domain.usuario.dto.ProfessorAdminDTO;
import com.gestao.uep.services.ProfessorAdminService;
import com.gestao.uep.services.ProfessorAdminService.ResultadoAlteracao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/professores")
public class ProfessorAdminController {

    private final ProfessorAdminService professores;

    public ProfessorAdminController(ProfessorAdminService professores) {
        this.professores = professores;
    }

    @GetMapping
    public List<ProfessorAdminDTO> listar() {
        return professores.listar();
    }

    @PostMapping
    public ResponseEntity<RespostaAlteracao> criar(@RequestBody @Valid DadosProfessorDTO dados) {
        return responderAlteracao(professores.criar(dados), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RespostaAlteracao> atualizar(@PathVariable UUID id, @RequestBody @Valid DadosProfessorDTO dados) {
        return responderAlteracao(professores.atualizar(id, dados), HttpStatus.OK);
    }

    @PostMapping("/{id}/reenviar-convite")
    public ResponseEntity<RespostaAlteracao> reenviarConvite(@PathVariable UUID id) {
        return responderAlteracao(professores.reenviarConvite(id), HttpStatus.OK);
    }

    @PatchMapping("/{id}/status")
    public ProfessorAdminDTO alterarStatus(@PathVariable UUID id, @RequestBody @Valid AlterarStatusDTO dados) {
        return professores.alterarStatus(id, dados.ativo());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> erroDaOperacao(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("erro", exception.getReason()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> dadosInvalidos(MethodArgumentNotValidException exception) {
        String mensagem = exception.getFieldErrors().stream()
                .findFirst()
                .map(ObjectError::getDefaultMessage)
                .orElse("Dados do professor inválidos");
        return ResponseEntity.badRequest().body(Map.of("erro", mensagem));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> corpoInvalido() {
        return ResponseEntity.badRequest().body(Map.of("erro", "O corpo da requisição deve conter dados válidos"));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> identificadorInvalido() {
        return ResponseEntity.badRequest().body(Map.of("erro", "Identificador de professor inválido"));
    }

    private static ResponseEntity<RespostaAlteracao> responderAlteracao(ResultadoAlteracao resultado, HttpStatus sucesso) {
        ProfessorAdminDTO professor = resultado.professor();
        if (resultado.envio() == null) {
            return ResponseEntity.status(sucesso).body(new RespostaAlteracao(professor, null, null));
        }
        if (resultado.envio().foiEnviado()) {
            return ResponseEntity.status(sucesso).body(new RespostaAlteracao(professor, true, null));
        }

        String mensagem = professor.convitePendente()
                ? "Os dados foram salvos, mas o convite não pôde ser enviado. Use Reenviar convite."
                : "Os dados foram salvos, mas o e-mail de confirmação não pôde ser enviado. Solicite o reenvio para o novo endereço.";
        return ResponseEntity.accepted().body(new RespostaAlteracao(professor, false, mensagem));
    }

    public record AlterarStatusDTO(@NotNull(message = "Informe se o professor deve ficar ativo") Boolean ativo) {
    }

    public record RespostaAlteracao(ProfessorAdminDTO professor, Boolean emailEnviado, String message) {
    }
}
