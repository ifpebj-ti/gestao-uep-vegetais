package com.gestao.uep.services;

import com.gestao.uep.domain.canteiro.Canteiro;
import com.gestao.uep.domain.canteiro.CanteiroRepository;
import com.gestao.uep.domain.canteiro.CanteiroResponsavel;
import com.gestao.uep.domain.canteiro.CanteiroResponsavelRepository;
import com.gestao.uep.domain.canteiro.FichaCampoRepository;
import com.gestao.uep.domain.canteiro.FichaCampo;
import com.gestao.uep.domain.canteiro.dto.AtualizarFichaCampoDTO;
import com.gestao.uep.domain.canteiro.dto.ResponsaveisDTO;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CanteiroServiceTest {

    @Mock
    private CanteiroRepository canteiroRepository;

    @Mock
    private CanteiroResponsavelRepository responsavelRepository;

    @Mock
    private FichaCampoRepository fichaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private CanteiroAuthorizationService authorizationService;

    @Mock
    private PrevisaoColheitaService previsaoColheitaService;

    @Test
    void listaCanteirosDoProfessor() {
        Usuario professor = usuario(UsuarioRole.PROFESSOR);
        Canteiro canteiro = canteiro();
        when(authorizationService.eProfessor(professor)).thenReturn(true);
        when(canteiroRepository.findAllByOrderByCodigoAsc()).thenReturn(List.of(canteiro));
        when(fichaRepository.findAllByCanteiroIdIn(List.of("c-01"))).thenReturn(List.of());
        when(responsavelRepository.findAllByCanteiroIdsWithUsuarios(List.of("c-01"))).thenReturn(List.of());

        var resultado = service().listar(professor);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.getFirst().codigo()).isEqualTo("C01");
    }

    @Test
    void listaCanteirosDoAlunoEOrdenaPorCodigo() {
        Usuario aluno = usuario(UsuarioRole.ALUNO);
        Canteiro primeiro = new Canteiro("c-02", "C02", "Dois");
        Canteiro segundo = canteiro();
        when(authorizationService.eProfessor(aluno)).thenReturn(false);
        when(responsavelRepository.findCanteiroIdsByUsuarioId(aluno.getId())).thenReturn(List.of("c-02", "c-01"));
        when(canteiroRepository.findAllById(List.of("c-02", "c-01")))
                .thenReturn(new ArrayList<>(List.of(primeiro, segundo)));
        when(fichaRepository.findAllByCanteiroIdIn(any())).thenReturn(List.of());
        when(responsavelRepository.findAllByCanteiroIdsWithUsuarios(any())).thenReturn(List.of());

        var resultado = service().listar(aluno);

        assertThat(resultado).extracting("codigo").containsExactly("C01", "C02");
    }

    @Test
    void retornaListaVaziaParaUsuarioSemPapelDeAlunoOuProfessor() {
        Usuario usuario = usuario(UsuarioRole.USUARIO);
        when(authorizationService.eProfessor(usuario)).thenReturn(false);

        assertThat(service().listar(usuario)).isEmpty();
    }

    @Test
    void buscaDetalheEFichaPadraoDoCanteiro() {
        Usuario professor = usuario(UsuarioRole.PROFESSOR);
        Canteiro canteiro = canteiro();
        when(canteiroRepository.findById("c-01")).thenReturn(Optional.of(canteiro));
        when(responsavelRepository.findByCanteiroIdOrderByOrdem("c-01")).thenReturn(List.of());
        when(fichaRepository.findByCanteiroId("c-01")).thenReturn(Optional.empty());
        when(authorizationService.podeEditar("c-01", professor)).thenReturn(true);

        var detalhe = service().buscarDetalhe("c-01", professor);
        var ficha = service().buscarFicha("c-01", professor);

        assertThat(detalhe.id()).isEqualTo("c-01");
        assertThat(detalhe.podeEditar()).isTrue();
        assertThat(ficha.persistida()).isFalse();
        verify(authorizationService, org.mockito.Mockito.times(2)).exigirLeitura("c-01", professor);
    }

    @Test
    void atualizaFichaCriandoRegistroQuandoNaoExiste() {
        Usuario professor = usuario(UsuarioRole.PROFESSOR);
        Canteiro canteiro = canteiro();
        when(canteiroRepository.findById("c-01")).thenReturn(Optional.of(canteiro));
        when(fichaRepository.findByCanteiroId("c-01")).thenReturn(Optional.empty());
        when(fichaRepository.save(any(FichaCampo.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var resultado = service().atualizarFicha("c-01", fichaDados(), professor);

        assertThat(resultado.canteiroId()).isEqualTo("c-01");
        assertThat(resultado.statusEntrega()).isEqualTo("pendente");
        verify(authorizationService).exigirEdicao("c-01", professor);
        verify(previsaoColheitaService).aplicar(any(FichaCampo.class), any(AtualizarFichaCampoDTO.class), any());
    }

    @Test
    void substituiResponsaveisValidos() {
        Usuario professor = usuario(UsuarioRole.PROFESSOR);
        Usuario aluno = usuario(UsuarioRole.ALUNO);
        when(canteiroRepository.findById("c-01")).thenReturn(Optional.of(canteiro()));
        when(usuarioRepository.findById(aluno.getId())).thenReturn(Optional.of(aluno));

        var resultado = service().substituirResponsaveis("c-01", new ResponsaveisDTO(List.of(aluno.getId())), professor);

        assertThat(resultado).containsExactly(aluno);
        verify(responsavelRepository).deleteByCanteiroId("c-01");
        verify(responsavelRepository).flush();
        verify(responsavelRepository).save(any(CanteiroResponsavel.class));
    }

    @Test
    void rejeitaAlunoDuplicadoOuUsuarioComPapelInvalido() {
        Usuario professor = usuario(UsuarioRole.PROFESSOR);
        UUID alunoId = UUID.randomUUID();
        when(canteiroRepository.findById("c-01")).thenReturn(Optional.of(canteiro()));
        assertThatThrownBy(() -> service().substituirResponsaveis(
                "c-01", new ResponsaveisDTO(List.of(alunoId, alunoId)), professor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("duplicidade");

        Usuario usuario = usuario(UsuarioRole.USUARIO);
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.of(usuario));
        assertThatThrownBy(() -> service().substituirResponsaveis(
                "c-01", new ResponsaveisDTO(List.of(usuario.getId())), professor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ALUNO");
    }

    @Test
    void listaAlunosExigeProfessor() {
        Usuario professor = usuario(UsuarioRole.PROFESSOR);
        Usuario aluno = usuario(UsuarioRole.ALUNO);
        when(usuarioRepository.findAllByRoleOrderByNome(UsuarioRole.ALUNO)).thenReturn(List.of(aluno));

        assertThat(service().listarAlunos(professor)).hasSize(1);
        verify(authorizationService).exigirProfessor(professor);
    }

    private CanteiroService service() {
        return new CanteiroService(canteiroRepository, responsavelRepository, fichaRepository,
                usuarioRepository, authorizationService, previsaoColheitaService);
    }

    private Canteiro canteiro() {
        return new Canteiro("c-01", "C01", "Canteiro 01");
    }

    private AtualizarFichaCampoDTO fichaDados() {
        return new AtualizarFichaCampoDTO(
                "Grupo A", "Turma 1", null, "Alface", null, null, null, null,
                null, null, null, "Observação", null, null, false, null, null,
                null, null, null
        );
    }

    private Usuario usuario(UsuarioRole role) {
        Usuario usuario = new Usuario("Pessoa", role.name().toLowerCase() + "@ifpe.edu.br", "hash", role);
        try {
            var campoId = Usuario.class.getDeclaredField("id");
            campoId.setAccessible(true);
            campoId.set(usuario, UUID.randomUUID());
        } catch (ReflectiveOperationException erro) {
            throw new AssertionError(erro);
        }
        return usuario;
    }
}
