package com.gestao.uep.services;

import com.gestao.uep.domain.canteiro.Canteiro;
import com.gestao.uep.domain.canteiro.CanteiroRepository;
import com.gestao.uep.domain.canteiro.CanteiroResponsavelRepository;
import com.gestao.uep.domain.canteiro.AlteracaoFichaCampo;
import com.gestao.uep.domain.canteiro.FichaCampo;
import com.gestao.uep.domain.canteiro.FichaCampoRepository;
import com.gestao.uep.domain.canteiro.HistoricoFichaCampo;
import com.gestao.uep.domain.canteiro.HistoricoFichaCampoRepository;
import com.gestao.uep.domain.canteiro.dto.AtualizarFichaCampoDTO;
import com.gestao.uep.domain.canteiro.dto.HistoricoFichaCampoDTO;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CanteiroServiceTest {

    @Mock private CanteiroRepository canteiroRepository;
    @Mock private CanteiroResponsavelRepository responsavelRepository;
    @Mock private FichaCampoRepository fichaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private CanteiroAuthorizationService authorizationService;
    @Mock private PrevisaoColheitaService previsaoColheitaService;
    @Mock private FichaCampoHistoricoService historicoService;
    @Mock private HistoricoFichaCampoRepository historicoRepository;

    private Canteiro canteiro;
    private CanteiroService service;

    @BeforeEach
    void setUp() {
        canteiro = new Canteiro("canteiro-01", "C01", "Canteiro 01");
        service = new CanteiroService(canteiroRepository, responsavelRepository, fichaRepository,
                usuarioRepository, authorizationService, previsaoColheitaService,
                historicoService, historicoRepository);
        when(canteiroRepository.findById("canteiro-01")).thenReturn(Optional.of(canteiro));
    }

    @Test
    void atualizacaoCapturaSnapshotPersistidoAntesDaMutacaoESalvaHistoricoDepoisDaFicha() {
        FichaCampo persistida = new FichaCampo(canteiro);
        persistida.setCultura("Alface");
        when(fichaRepository.findByCanteiroId("canteiro-01")).thenReturn(Optional.of(persistida));
        when(fichaRepository.save(any(FichaCampo.class))).thenAnswer(call -> call.getArgument(0));
        when(historicoService.snapshot(persistida)).thenReturn(java.util.Map.of("cultura", "Alface"));
        Usuario autora = new Usuario("Ana", "ana@uep.br", "hash", UsuarioRole.PROFESSOR);
        AtualizarFichaCampoDTO dados = dados("Batata");

        service.atualizarFicha("canteiro-01", dados, autora);

        InOrder ordem = inOrder(historicoService, fichaRepository);
        ordem.verify(historicoService).snapshot(persistida);
        ordem.verify(fichaRepository).save(persistida);
        ordem.verify(historicoService).registrarDiferencas(
                java.util.Map.of("cultura", "Alface"), persistida, autora);
        assertThat(persistida.getCultura()).isEqualTo("Batata");
    }

    @Test
    void fichaNovaUsaEstadoInicialComoBaselineEAutorDoPrincipal() {
        when(fichaRepository.findByCanteiroId("canteiro-01")).thenReturn(Optional.empty());
        when(fichaRepository.save(any(FichaCampo.class))).thenAnswer(call -> call.getArgument(0));
        when(historicoService.snapshot(any(FichaCampo.class))).thenAnswer(call -> {
            FichaCampo ficha = call.getArgument(0);
            return java.util.Map.of("statusEntrega", ficha.getStatusEntrega(),
                    "canteiroCodigo", ficha.getCanteiroCodigo());
        });
        Usuario autora = new Usuario("Ana", "ana@uep.br", "hash", UsuarioRole.PROFESSOR);

        service.atualizarFicha("canteiro-01", dados(null), autora);

        ArgumentCaptor<java.util.Map<String, Object>> snapshot = ArgumentCaptor.forClass(java.util.Map.class);
        verify(historicoService).registrarDiferencas(snapshot.capture(), any(FichaCampo.class),
                org.mockito.ArgumentMatchers.same(autora));
        assertThat(snapshot.getValue()).containsEntry("statusEntrega", "pendente")
                .containsEntry("canteiroCodigo", "C01");
    }

    @Test
    void falhaAoPersistirHistoricoPropagaEAtualizacaoPermaneceNaTransacao() throws NoSuchMethodException {
        FichaCampo ficha = new FichaCampo(canteiro);
        when(fichaRepository.findByCanteiroId("canteiro-01")).thenReturn(Optional.of(ficha));
        when(fichaRepository.save(any(FichaCampo.class))).thenReturn(ficha);
        org.mockito.Mockito.doThrow(new IllegalStateException("historico indisponivel"))
                .when(historicoService).registrarDiferencas(any(), any(), any());

        PlatformTransactionManager transactionManager = org.mockito.Mockito.mock(PlatformTransactionManager.class);
        TransactionStatus transactionStatus = new SimpleTransactionStatus();
        when(transactionManager.getTransaction(any())).thenReturn(transactionStatus);
        ProxyFactory proxyFactory = new ProxyFactory(service);
        proxyFactory.addAdvice(new TransactionInterceptor(transactionManager,
                new AnnotationTransactionAttributeSource()));
        CanteiroService transactionalService = (CanteiroService) proxyFactory.getProxy();

        assertThatThrownBy(() -> transactionalService.atualizarFicha("canteiro-01", dados("Alface"),
                new Usuario("Ana", "ana@uep.br", "hash", UsuarioRole.PROFESSOR)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("historico indisponivel");
        verify(transactionManager).rollback(transactionStatus);
        assertThat(CanteiroService.class.getMethod("atualizarFicha", String.class,
                AtualizarFichaCampoDTO.class, Usuario.class).getAnnotation(Transactional.class))
                .isNotNull();
    }

    @Test
    void historicoEhConvertidoComAlteracoesEOrdemMaisRecentePrimeiro() {
        Instant anterior = Instant.parse("2026-01-01T10:00:00Z");
        Instant recente = Instant.parse("2026-01-02T10:00:00Z");
        HistoricoFichaCampo eventoAntigo = evento(anterior, "Alface");
        HistoricoFichaCampo eventoRecente = evento(recente, "Batata");
        when(canteiroRepository.findById("canteiro-01")).thenReturn(Optional.of(canteiro));
        when(historicoRepository.findAllByCanteiroIdOrderByDataHoraDesc("canteiro-01"))
                .thenReturn(List.of(eventoRecente, eventoAntigo));
        Usuario leitora = new Usuario("Ana", "ana@uep.br", "hash", UsuarioRole.PROFESSOR);

        List<HistoricoFichaCampoDTO> resultado = service.buscarHistorico("canteiro-01", leitora);

        assertThat(resultado).extracting(HistoricoFichaCampoDTO::dataHora)
                .containsExactly(recente, anterior);
        assertThat(resultado).extracting(HistoricoFichaCampoDTO::id)
                .containsExactly(eventoRecente.getId(), eventoAntigo.getId());
        assertThat(resultado.getFirst().alteracoes()).singleElement()
                .satisfies(alteracao -> {
                    assertThat(alteracao.campo()).isEqualTo("cultura");
                    assertThat(alteracao.valorAnterior()).isEqualTo("Alface");
                    assertThat(alteracao.valorNovo()).isEqualTo("Batata");
                });
        verify(authorizationService).exigirLeitura("canteiro-01", leitora);
        verify(historicoRepository).findAllByCanteiroIdOrderByDataHoraDesc("canteiro-01");
    }

    @Test
    void leituraNaoResponsavelEhDelegadaAoServicoDeAutorizacao() {
        when(canteiroRepository.findById("canteiro-01")).thenReturn(Optional.of(canteiro));
        Usuario aluno = new Usuario("Beto", "beto@uep.br", "hash", UsuarioRole.ALUNO);
        org.mockito.Mockito.doThrow(new AccessDeniedException("negado"))
                .when(authorizationService).exigirLeitura("canteiro-01", aluno);

        assertThatThrownBy(() -> service.buscarHistorico("canteiro-01", aluno))
                .isInstanceOf(AccessDeniedException.class);
        verify(historicoRepository, never()).findAllByCanteiroIdOrderByDataHoraDesc(any());
    }

    private HistoricoFichaCampo evento(Instant instante, String valorNovo) {
        HistoricoFichaCampo evento = new HistoricoFichaCampo();
        evento.setId(UUID.nameUUIDFromBytes((instante.toString() + valorNovo).getBytes()));
        evento.setDataHora(instante);
        evento.setAutorNome("Ana");
        evento.setAutorPapel("PROFESSOR");
        evento.adicionarAlteracao(new AlteracaoFichaCampo("cultura", "Alface", valorNovo));
        return evento;
    }

    private AtualizarFichaCampoDTO dados(String cultura) {
        return new AtualizarFichaCampoDTO(null, null, null, cultura, null, null, null,
                null, null, null, null, null, null, null, null, null, null,
                null, null, null);
    }
}
