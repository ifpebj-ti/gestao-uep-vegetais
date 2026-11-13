package com.gestao.uep.services;

import com.gestao.uep.domain.cultivo.ModeloCultivo;
import com.gestao.uep.domain.cultivo.ModeloCultivoRepository;
import com.gestao.uep.domain.cultivo.UnidadeProducao;
import com.gestao.uep.domain.cultivo.dto.AtualizarModeloCultivoDTO;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModeloCultivoServiceTest {

    @Mock
    private ModeloCultivoRepository repository;

    @Mock
    private CanteiroAuthorizationService authorizationService;

    @Test
    void listaModelosAtivos() {
        ModeloCultivo modelo = modelo();
        when(repository.findAllByAtivoTrueOrderByCulturaAscVariedadeAsc()).thenReturn(List.of(modelo));

        List<?> resultado = service().listarAtivos();

        assertThat(resultado).hasSize(1);
        verify(repository).findAllByAtivoTrueOrderByCulturaAscVariedadeAsc();
    }

    @Test
    void criaModeloValido() {
        Usuario professor = professor();
        when(repository.save(any(ModeloCultivo.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var resultado = service().criar(dados("Alface", "Folhosa", 45), professor);

        assertThat(resultado.cultura()).isEqualTo("Alface");
        assertThat(resultado.categoria()).isEqualTo("Folhosa");
        assertThat(resultado.cicloDias()).isEqualTo(45);
        assertThat(resultado.ativo()).isTrue();
        verify(authorizationService).exigirProfessor(professor);
    }

    @Test
    void atualizaModeloExistente() {
        UUID id = UUID.randomUUID();
        ModeloCultivo modelo = modelo();
        when(repository.findById(id)).thenReturn(Optional.of(modelo));
        when(repository.save(modelo)).thenReturn(modelo);

        var resultado = service().atualizar(id, dados("Cenoura", "Raiz", 90), professor());

        assertThat(resultado.cultura()).isEqualTo("Cenoura");
        assertThat(modelo.getVariedade()).isEqualTo("Lisa");
        assertThat(modelo.getCicloDias()).isEqualTo(90);
    }

    @Test
    void rejeitaCategoriaAusenteOuCicloInvalido() {
        assertThatThrownBy(() -> service().criar(dados("Alface", "", 45), professor()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("categoria");
        assertThatThrownBy(() -> service().criar(dados("Alface", "Folhosa", 0), professor()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ciclo");
    }

    @Test
    void rejeitaModeloInexistente() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().atualizar(id, dados("Alface", "Folhosa", 45), professor()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("nao encontrado");
    }

    private ModeloCultivoService service() {
        return new ModeloCultivoService(repository, authorizationService);
    }

    private ModeloCultivo modelo() {
        ModeloCultivo modelo = new ModeloCultivo();
        modelo.setCultura("Alface");
        modelo.setVariedade("Lisa");
        modelo.setCategoria("Folhosa");
        modelo.setCicloDias(30);
        modelo.setEspacamentoLinhasM(new BigDecimal("0.30"));
        modelo.setEspacamentoPlantasM(new BigDecimal("0.30"));
        modelo.setPesoMedioKgPorPlanta(new BigDecimal("0.20"));
        modelo.setUnidadeProducao(UnidadeProducao.KG);
        modelo.setFatorAproveitamento(BigDecimal.ONE);
        modelo.setAtivo(true);
        return modelo;
    }

    private AtualizarModeloCultivoDTO dados(String cultura, String categoria, int ciclo) {
        return new AtualizarModeloCultivoDTO(
                cultura, "Lisa", categoria, ciclo,
                new BigDecimal("0.30"), new BigDecimal("0.30"),
                new BigDecimal("0.20"), null, new BigDecimal("0.20"),
                UnidadeProducao.KG, BigDecimal.ONE, true
        );
    }

    private Usuario professor() {
        return new Usuario("Professor", "professor@ifpe.edu.br", "hash", UsuarioRole.PROFESSOR);
    }
}
