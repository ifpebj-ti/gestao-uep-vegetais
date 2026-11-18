package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import com.gestao.uep.domain.usuario.dto.DadosProfessorDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfessorAdminServiceTest {

    @Mock
    private UsuarioRepository usuarios;

    @Mock
    private ConviteProfessorService convites;

    @Mock
    private PasswordEncoder passwordEncoder;

    private ProfessorAdminService service() {
        return new ProfessorAdminService(usuarios, convites, new EmailInstitucionalService(), passwordEncoder);
    }

    @Test
    void listaProfessoresComIndicadorDeConvite() {
        Usuario professor = professor("Ana", "ana@belojardim.ifpe.edu.br");
        when(usuarios.findAllByRoleOrderByNome(UsuarioRole.PROFESSOR)).thenReturn(List.of(professor));
        when(convites.convitePendente(professor)).thenReturn(true);

        var resultado = service().listar();

        assertThat(resultado).hasSize(1);
        assertThat(resultado.getFirst().convitePendente()).isTrue();
        assertThat(resultado.getFirst().email()).isEqualTo(professor.getEmail());
    }

    @Test
    void criaProfessorDesativadoEEmiteConvite() {
        when(passwordEncoder.encode(any())).thenReturn("senha-hash");

        var resultado = service().criar(dados("Ana", " ANA@belojardim.ifpe.edu.br ", "fruticultura"));

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarios).saveAndFlush(captor.capture());
        Usuario salvo = captor.getValue();
        assertThat(salvo.getNome()).isEqualTo("Ana");
        assertThat(salvo.getEmail()).isEqualTo("ana@belojardim.ifpe.edu.br");
        assertThat(salvo.getRole()).isEqualTo(UsuarioRole.PROFESSOR);
        assertThat(salvo.getUep()).isEqualTo("fruticultura");
        assertThat(salvo.isAtivo()).isFalse();
        assertThat(salvo.isEmailVerificado()).isFalse();
        assertThat(resultado.professor().convitePendente()).isTrue();
        verify(convites).enviarConvite(salvo);
    }

    @Test
    void rejeitaEmailForaDoDominioInstitucionalDocente() {
        assertThatThrownBy(() -> service().criar(dados("Ana", "ana@gmail.com", "olericultura")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        verifyNoInteractions(usuarios, convites, passwordEncoder);
    }

    @Test
    void rejeitaEmailJaCadastrado() {
        when(usuarios.findByEmail("ana@belojardim.ifpe.edu.br"))
                .thenReturn(professor("Outra Ana", "ana@belojardim.ifpe.edu.br"));

        assertThatThrownBy(() -> service().criar(dados("Ana", "ana@belojardim.ifpe.edu.br", "olericultura")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void atualizaDadosSemReenviarEmailQuandoEnderecoNaoMuda() {
        Usuario professor = professor("Ana", "ana@belojardim.ifpe.edu.br");
        when(usuarios.findByIdForUpdate(professor.getId())).thenReturn(professor);
        when(convites.convitePendente(professor)).thenReturn(false);

        var resultado = service().atualizar(professor.getId(), dados("Ana Silva", professor.getEmail(), "fruticultura"));

        assertThat(resultado.envio()).isNull();
        assertThat(resultado.professor().nome()).isEqualTo("Ana Silva");
        assertThat(resultado.professor().uep()).isEqualTo("fruticultura");
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void trocaEmailDeConvitePendenteEEmiteNovoConvite() {
        Usuario professor = professor("Ana", "ana@belojardim.ifpe.edu.br");
        professor.desativar();
        when(usuarios.findByIdForUpdate(professor.getId())).thenReturn(professor);
        when(convites.convitePendente(professor)).thenReturn(true);
        when(usuarios.findByEmail("ana.silva@belojardim.ifpe.edu.br")).thenReturn(null);

        var resultado = service().atualizar(professor.getId(), dados("Ana", "ana.silva@belojardim.ifpe.edu.br", "olericultura"));

        assertThat(resultado.professor().email()).isEqualTo("ana.silva@belojardim.ifpe.edu.br");
        assertThat(resultado.professor().convitePendente()).isTrue();
        verify(usuarios).saveAndFlush(professor);
        verify(convites).enviarConvite(professor);
    }

    @Test
    void trocaEmailAtivoEExigeConfirmacaoNoNovoEndereco() {
        Usuario professor = professor("Ana", "ana@belojardim.ifpe.edu.br");
        when(usuarios.findByIdForUpdate(professor.getId())).thenReturn(professor);
        when(convites.convitePendente(professor)).thenReturn(false);
        when(usuarios.findByEmail("ana.silva@belojardim.ifpe.edu.br")).thenReturn(null);

        var resultado = service().atualizar(professor.getId(), dados("Ana", "ana.silva@belojardim.ifpe.edu.br", "olericultura"));

        assertThat(resultado.professor().emailVerificado()).isFalse();
        verify(convites).enviarConfirmacaoDeNovoEmail(professor);
    }

    @Test
    void alteraUepValidandoProfessor() {
        Usuario professor = professor("Ana", "ana@belojardim.ifpe.edu.br");
        when(usuarios.findByIdForUpdate(professor.getId())).thenReturn(professor);
        when(convites.convitePendente(professor)).thenReturn(false);

        var resultado = service().alterarUep(professor.getId(), "fruticultura");

        assertThat(resultado.uep()).isEqualTo("fruticultura");
        assertThatThrownBy(() -> service().alterarUep(professor.getId(), "horta"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("UEP inválida");
    }

    @Test
    void respondeNotFoundParaContaAusenteOuQueNaoEProfessor() {
        UUID id = UUID.randomUUID();
        when(usuarios.findByIdForUpdate(id)).thenReturn(null);
        assertThatThrownBy(() -> service().alterarStatus(id, false))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        Usuario aluno = new Usuario(id, "Aluno", "aluno@discente.ifpe.edu.br", "hash", null, UsuarioRole.ALUNO, true);
        when(usuarios.findByIdForUpdate(id)).thenReturn(aluno);
        assertThatThrownBy(() -> service().alterarStatus(id, false))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void bloqueiaReenvioDeConviteQuandoNaoHaConvitePendente() {
        Usuario professor = professor("Ana", "ana@belojardim.ifpe.edu.br");
        when(usuarios.findByIdForUpdate(professor.getId())).thenReturn(professor);
        when(convites.convitePendente(professor)).thenReturn(false);

        assertThatThrownBy(() -> service().reenviarConvite(professor.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void bloqueiaMudancaDeStatusAteAceiteDoConvite() {
        Usuario professor = professor("Ana", "ana@belojardim.ifpe.edu.br");
        when(usuarios.findByIdForUpdate(professor.getId())).thenReturn(professor);
        when(convites.convitePendente(professor)).thenReturn(true);

        assertThatThrownBy(() -> service().alterarStatus(professor.getId(), false))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void desativaEReativaProfessorJaConvidado() {
        Usuario professor = professor("Ana", "ana@belojardim.ifpe.edu.br");
        when(usuarios.findByIdForUpdate(professor.getId())).thenReturn(professor);
        when(convites.convitePendente(professor)).thenReturn(false);

        assertThat(service().alterarStatus(professor.getId(), false).ativo()).isFalse();
        assertThat(professor.isEnabled()).isFalse();
        assertThat(service().alterarStatus(professor.getId(), true).ativo()).isTrue();
        assertThat(professor.isEnabled()).isTrue();
    }

    private static DadosProfessorDTO dados(String nome, String email, String uep) {
        return new DadosProfessorDTO(nome, email, uep);
    }

    private static Usuario professor(String nome, String email) {
        return new Usuario(UUID.randomUUID(), nome, email, "hash", null, UsuarioRole.PROFESSOR, true);
    }
}
