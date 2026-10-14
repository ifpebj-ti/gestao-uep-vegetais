package com.gestao.uep.controllers;

import com.gestao.uep.domain.cultivo.dto.AtualizarModeloCultivoDTO;
import com.gestao.uep.domain.cultivo.dto.ModeloCultivoDTO;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.services.ModeloCultivoService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/modelos-cultivo")
public class ModeloCultivoController {

    private final ModeloCultivoService service;

    public ModeloCultivoController(ModeloCultivoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ModeloCultivoDTO> listar() {
        return service.listarAtivos();
    }

    @PostMapping
    public ModeloCultivoDTO criar(
            @RequestBody @Valid AtualizarModeloCultivoDTO dados,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return service.criar(dados, usuario);
    }

    @PutMapping("/{id}")
    public ModeloCultivoDTO atualizar(
            @PathVariable UUID id,
            @RequestBody @Valid AtualizarModeloCultivoDTO dados,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return service.atualizar(id, dados, usuario);
    }
}
