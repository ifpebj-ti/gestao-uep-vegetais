package com.gestao.uep.controllers;

import com.gestao.uep.domain.canteiro.dto.AlunoResumoDTO;
import com.gestao.uep.domain.canteiro.dto.AtualizarFichaCampoDTO;
import com.gestao.uep.domain.canteiro.dto.CanteiroDetalheDTO;
import com.gestao.uep.domain.canteiro.dto.CanteiroResumoDTO;
import com.gestao.uep.domain.canteiro.dto.FichaCampoDTO;
import com.gestao.uep.domain.canteiro.dto.ResponsaveisDTO;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.services.CanteiroService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/canteiros")
public class CanteiroController {

    private final CanteiroService service;

    public CanteiroController(CanteiroService service) {
        this.service = service;
    }

    @GetMapping
    public List<CanteiroResumoDTO> listar(@AuthenticationPrincipal Usuario usuario) {
        return service.listar(usuario);
    }

    @GetMapping("/{id}")
    public CanteiroDetalheDTO buscar(
            @PathVariable String id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return service.buscarDetalhe(id, usuario);
    }

    @GetMapping("/{id}/ficha")
    public FichaCampoDTO buscarFicha(
            @PathVariable String id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return service.buscarFicha(id, usuario);
    }

    @PutMapping("/{id}/ficha")
    public FichaCampoDTO atualizarFicha(
            @PathVariable String id,
            @RequestBody @Valid AtualizarFichaCampoDTO dados,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return service.atualizarFicha(id, dados, usuario);
    }

    @GetMapping("/{id}/responsaveis")
    public List<AlunoResumoDTO> listarResponsaveis(
            @PathVariable String id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        service.buscarDetalhe(id, usuario);
        return service.responsaveis(id).stream().map(AlunoResumoDTO::from).toList();
    }

    @PutMapping("/{id}/responsaveis")
    public List<AlunoResumoDTO> substituirResponsaveis(
            @PathVariable String id,
            @RequestBody ResponsaveisDTO dados,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return service.substituirResponsaveis(id, dados, usuario).stream()
                .map(AlunoResumoDTO::from)
                .toList();
    }
}
