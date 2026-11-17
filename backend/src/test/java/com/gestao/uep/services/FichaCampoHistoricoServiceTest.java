package com.gestao.uep.services;

import com.gestao.uep.domain.canteiro.AlteracaoFichaCampo;
import com.gestao.uep.domain.canteiro.Canteiro;
import com.gestao.uep.domain.canteiro.FichaCampo;
import com.gestao.uep.domain.canteiro.HistoricoFichaCampo;
import com.gestao.uep.domain.canteiro.HistoricoFichaCampoRepository;
import com.gestao.uep.domain.canteiro.AlteracaoFichaCampoRepository;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class FichaCampoHistoricoServiceTest {

    @Mock
    private HistoricoFichaCampoRepository historicoRepository;

    @Mock
    private AlteracaoFichaCampoRepository alteracaoRepository;

    @Test
    void registrarDiferencasUsaTransacaoRequired() throws NoSuchMethodException {
        Transactional transactional = FichaCampoHistoricoService.class
                .getMethod("registrarDiferencas", java.util.Map.class, FichaCampo.class, Usuario.class)
                .getAnnotation(Transactional.class);

        assertThat(transactional).isNotNull();
        assertThat(transactional.propagation()).isEqualTo(Propagation.REQUIRED);
    }

    @Test
    void registraDiferencaDeCulturaComAutorEValores() {
        FichaCampo ficha = ficha("Batata");
        FichaCampoHistoricoService service = service();
        var snapshot = service.snapshot(ficha("Alface"));
        Usuario autor = new Usuario("Ana", "ana@uep.br", "senha", UsuarioRole.PROFESSOR);

        service.registrarDiferencas(snapshot, ficha, autor);

        ArgumentCaptor<HistoricoFichaCampo> eventoCaptor = ArgumentCaptor.forClass(HistoricoFichaCampo.class);
        verify(historicoRepository).save(eventoCaptor.capture());
        HistoricoFichaCampo evento = eventoCaptor.getValue();
        assertThat(evento.getAutorNome()).isEqualTo("Ana");
        assertThat(evento.getAutorPapel()).isEqualTo("PROFESSOR");

        verify(alteracaoRepository).saveAll(any());
        List<AlteracaoFichaCampo> alteracoes = evento.getAlteracoes();
        assertThat(alteracoes).filteredOn(a -> a.getCampo().equals("cultura"))
                .singleElement()
                .satisfies(a -> {
                    assertThat(a.getValorAnterior()).isEqualTo("Alface");
                    assertThat(a.getValorNovo()).isEqualTo("Batata");
                });
    }

    @Test
    void preservaNullComoValorAnteriorDaDiferenca() {
        FichaCampoHistoricoService service = service();
        service.registrarDiferencas(service.snapshot(ficha(null)), ficha("Alface"), null);

        ArgumentCaptor<HistoricoFichaCampo> eventoCaptor = ArgumentCaptor.forClass(HistoricoFichaCampo.class);
        verify(historicoRepository).save(eventoCaptor.capture());
        assertThat(eventoCaptor.getValue().getAlteracoes())
                .filteredOn(a -> a.getCampo().equals("cultura"))
                .singleElement()
                .satisfies(a -> {
                    assertThat(a.getValorAnterior()).isNull();
                    assertThat(a.getValorNovo()).isEqualTo("Alface");
                });
    }

    @Test
    void naoPersisteEventoQuandoTodosOsValoresSaoIguais() {
        FichaCampo ficha = ficha("Alface");
        ficha.setAreaCanteiroM2(new BigDecimal("1.0"));
        FichaCampoHistoricoService service = service();
        var snapshot = service.snapshot(ficha);
        ficha.setAreaCanteiroM2(new BigDecimal("1.00"));
        ficha.setUpdatedAt(Instant.now());
        ficha.setPrevisaoCalculadaEm(Instant.now());
        ficha.setUpdatedBy(new Usuario("Bia", "bia@uep.br", "senha", UsuarioRole.ALUNO));

        service.registrarDiferencas(snapshot, ficha, null);

        verifyNoInteractions(historicoRepository, alteracaoRepository);
    }

    private FichaCampoHistoricoService service() {
        return new FichaCampoHistoricoService(historicoRepository, alteracaoRepository);
    }

    private FichaCampo ficha(String cultura) {
        FichaCampo ficha = new FichaCampo(new Canteiro("canteiro-01", "C01", "Canteiro 01"));
        ficha.setCultura(cultura);
        return ficha;
    }
}
