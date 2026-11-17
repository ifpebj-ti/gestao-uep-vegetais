package com.gestao.uep.controllers;

import com.gestao.uep.domain.usuario.dto.AceitarConviteProfessorDTO;
import com.gestao.uep.services.ConviteProfessorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/convites-professor")
public class ConviteProfessorController {

    private final ConviteProfessorService conviteProfessorService;

    public ConviteProfessorController(ConviteProfessorService conviteProfessorService) {
        this.conviteProfessorService = conviteProfessorService;
    }

    @PostMapping("/aceitar")
    public ResponseEntity<Map<String, String>> aceitar(@RequestBody @Valid AceitarConviteProfessorDTO dados) {
        conviteProfessorService.aceitar(dados.token(), dados.senha());
        return ResponseEntity.ok(Map.of("message", "Senha definida e conta ativada com sucesso"));
    }
}
