package com.gestao.uep.controllers;

import com.gestao.uep.domain.canteiro.dto.AlunoResumoDTO;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.services.CanteiroService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class AlunoController {

    private final CanteiroService service;

    public AlunoController(CanteiroService service) {
        this.service = service;
    }

    @GetMapping("/alunos")
    public List<AlunoResumoDTO> listarAlunos(@AuthenticationPrincipal Usuario usuario) {
        return service.listarAlunos(usuario);
    }
}
