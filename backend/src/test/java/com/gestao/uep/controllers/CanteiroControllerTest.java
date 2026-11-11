package com.gestao.uep.controllers;

import com.gestao.uep.domain.canteiro.dto.AlteracaoFichaCampoDTO;
import com.gestao.uep.domain.canteiro.dto.HistoricoFichaCampoDTO;
import com.gestao.uep.services.CanteiroNotFoundException;
import com.gestao.uep.services.CanteiroService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CanteiroControllerTest {

    @Mock private CanteiroService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new CanteiroController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void retornaHistoricoNoEndpointAutorizado() throws Exception {
        when(service.buscarHistorico(org.mockito.ArgumentMatchers.eq("c-01"), any()))
                .thenReturn(List.of(new HistoricoFichaCampoDTO(Instant.parse("2026-01-02T10:00:00Z"),
                        "Ana", "PROFESSOR", List.of(new AlteracaoFichaCampoDTO("cultura", "Alface", "Batata")))));

        mockMvc.perform(get("/api/canteiros/c-01/ficha/historico"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dataHora").value("2026-01-02T10:00:00Z"))
                .andExpect(jsonPath("$[0].autorNome").value("Ana"))
                .andExpect(jsonPath("$[0].autorPapel").value("PROFESSOR"))
                .andExpect(jsonPath("$[0].alteracoes[0].campo").value("cultura"))
                .andExpect(jsonPath("$[0].alteracoes[0].valorAnterior").value("Alface"))
                .andExpect(jsonPath("$[0].alteracoes[0].valorNovo").value("Batata"));
        verify(service).buscarHistorico(org.mockito.ArgumentMatchers.eq("c-01"),
                org.mockito.ArgumentMatchers.any(com.gestao.uep.domain.usuario.Usuario.class));
    }

    @Test
    void retorna403ParaAlunoNaoResponsavel() throws Exception {
        when(service.buscarHistorico(org.mockito.ArgumentMatchers.eq("c-01"), any()))
                .thenThrow(new AccessDeniedException("negado"));

        mockMvc.perform(get("/api/canteiros/c-01/ficha/historico").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void retorna404ParaCanteiroInexistente() throws Exception {
        when(service.buscarHistorico(org.mockito.ArgumentMatchers.eq("ausente"), any()))
                .thenThrow(new CanteiroNotFoundException("ausente"));

        mockMvc.perform(get("/api/canteiros/ausente/ficha/historico"))
                .andExpect(status().isNotFound());
    }
}
