package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.ConviteProfessor;
import com.gestao.uep.domain.usuario.ConviteProfessorRepository;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConviteProfessorServiceTest {

    @Mock
    private ConviteProfessorRepository convites;

    @Mock
    private UsuarioRepository usuarios;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailVerificationTokenService verificationTokenService;

    @Mock
    private EmailService emailService;

    @AfterEach
    void limparSincronizacaoTransacional() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void identificaConvitePendenteSomenteParaProfessorInativo() {
        Usuario professor = professorInativo();
        when(convites.existsByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(professor)).thenReturn(true);
        ConviteProfessorService service = service();

        assertThat(service.convitePendente(professor)).isTrue();
        professor.ativar();
        assertThat(service.convitePendente(professor)).isFalse();
        verify(convites).existsByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(professor);
    }

    @Test
    void salvaConviteEEnviaEmailDepoisDoCommit() {
        Usuario professor = professorInativo();
        when(convites.findByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(professor)).thenReturn(List.of());
        TransactionSynchronizationManager.initSynchronization();

        ConviteProfessorService.EnvioEmail envio = service().enviarConvite(professor);

        ArgumentCaptor<ConviteProfessor> conviteCaptor = ArgumentCaptor.forClass(ConviteProfessor.class);
        verify(convites).save(conviteCaptor.capture());
        assertThat(conviteCaptor.getValue().estaAtivo(Instant.now())).isTrue();
        assertThat(envio.foiEnviado()).isFalse();

        for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCommit();
        }
        assertThat(envio.foiEnviado()).isTrue();
        verify(emailService).enviarConviteProfessor(eq(professor.getEmail()), any());
    }

    @Test
    void mantemConviteSalvoQuandoEmailFalhaNoCommit() {
        Usuario professor = professorInativo();
        when(convites.findByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(professor)).thenReturn(List.of());
        doThrow(new MailSendException("SMTP indisponível"))
                .when(emailService).enviarConviteProfessor(eq(professor.getEmail()), any());
        TransactionSynchronizationManager.initSynchronization();

        ConviteProfessorService.EnvioEmail envio = service().enviarConvite(professor);
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);

        assertThat(envio.foiEnviado()).isFalse();
        verify(convites).save(any(ConviteProfessor.class));
    }

    @Test
    void emiteConfirmacaoParaNovoEmailDepoisDoCommit() {
        Usuario professor = new Usuario(
                UUID.randomUUID(), "Ana", "ana@belojardim.ifpe.edu.br", "senha",
                null, UsuarioRole.PROFESSOR, true
        );
        professor.alterarEmail("ana.nova@belojardim.ifpe.edu.br");
        when(verificationTokenService.emitir(professor, false)).thenReturn("token-confirmacao");
        TransactionSynchronizationManager.initSynchronization();

        ConviteProfessorService.EnvioEmail envio = service().enviarConfirmacaoDeNovoEmail(professor);

        assertThat(professor.isConfirmacaoNovoEmailPendente()).isTrue();
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        assertThat(envio.foiEnviado()).isTrue();
        verify(emailService).enviarConfirmacao("ana.nova@belojardim.ifpe.edu.br", "token-confirmacao");
    }

    @Test
    void aceitaConviteValidoAtivaContaEAtualizaSenha() {
        Usuario professor = professorInativo();
        String tokenBruto = "convite-valido";
        String tokenHash = TokenEmail.hash(tokenBruto);
        ConviteProfessor convite = new ConviteProfessor(
                professor, tokenHash, Instant.now(), Instant.now().plusSeconds(3600)
        );
        when(convites.findUsuarioIdByTokenHash(tokenHash)).thenReturn(Optional.of(professor.getId()));
        when(usuarios.findByIdForUpdate(professor.getId())).thenReturn(professor);
        when(convites.findByTokenHash(tokenHash)).thenReturn(Optional.of(convite));
        when(passwordEncoder.encode("senha-segura")).thenReturn("senha-criptografada");

        service().aceitar(tokenBruto, "senha-segura");

        assertThat(professor.isAtivo()).isTrue();
        assertThat(professor.isEmailVerificado()).isTrue();
        assertThat(professor.getPassword()).isEqualTo("senha-criptografada");
        assertThat(convite.estaAtivo(Instant.now())).isFalse();
    }

    @Test
    void rejeitaSenhaComMaisDe72BytesAntesDeConsultarBanco() {
        assertThatThrownBy(() -> service().aceitar("token", "á".repeat(37)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("72 bytes");

        verifyNoInteractions(convites, usuarios, passwordEncoder, verificationTokenService, emailService);
    }

    @Test
    void rejeitaConviteExpirado() {
        Usuario professor = professorInativo();
        String tokenBruto = "convite-expirado";
        String tokenHash = TokenEmail.hash(tokenBruto);
        ConviteProfessor convite = new ConviteProfessor(
                professor, tokenHash, Instant.now().minusSeconds(7200), Instant.now().minusSeconds(3600)
        );
        when(convites.findUsuarioIdByTokenHash(tokenHash)).thenReturn(Optional.of(professor.getId()));
        when(usuarios.findByIdForUpdate(professor.getId())).thenReturn(professor);
        when(convites.findByTokenHash(tokenHash)).thenReturn(Optional.of(convite));

        assertThatThrownBy(() -> service().aceitar(tokenBruto, "senha-segura"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Convite inválido ou expirado");

        assertThat(professor.isAtivo()).isFalse();
        verify(passwordEncoder, never()).encode(any());
    }

    private ConviteProfessorService service() {
        return new ConviteProfessorService(convites, usuarios, passwordEncoder, verificationTokenService, emailService);
    }

    private static Usuario professorInativo() {
        Usuario professor = new Usuario(
                UUID.randomUUID(), "Ana", "ana@belojardim.ifpe.edu.br", "senha-antiga",
                null, UsuarioRole.PROFESSOR, false
        );
        professor.desativar();
        return professor;
    }
}
