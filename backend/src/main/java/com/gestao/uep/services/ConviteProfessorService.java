package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.ConviteProfessor;
import com.gestao.uep.domain.usuario.ConviteProfessorRepository;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Service
public class ConviteProfessorService {

    private final ConviteProfessorRepository convites;
    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationTokenService verificationTokenService;
    private final EmailService emailService;

    public ConviteProfessorService(
            ConviteProfessorRepository convites,
            UsuarioRepository usuarios,
            PasswordEncoder passwordEncoder,
            EmailVerificationTokenService verificationTokenService,
            EmailService emailService
    ) {
        this.convites = convites;
        this.usuarios = usuarios;
        this.passwordEncoder = passwordEncoder;
        this.verificationTokenService = verificationTokenService;
        this.emailService = emailService;
    }

    public boolean convitePendente(Usuario usuario) {
        return podeAceitarConvite(usuario)
                && convites.existsByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(usuario);
    }

    /**
     * Use na transação que cria a conta ou bloqueia uma conta existente para reemissão.
     * Consulte o resultado do envio após o commit dessa transação.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public EnvioEmail enviarConvite(Usuario usuario) {
        if (!podeAceitarConvite(usuario)) {
            throw new IllegalArgumentException("A conta não pode receber um convite");
        }

        Instant agora = Instant.now();
        convites.findByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(usuario)
                .forEach(convite -> convite.invalidar(agora));
        convites.flush();

        String token = TokenEmail.gerar();
        convites.save(new ConviteProfessor(usuario, TokenEmail.hash(token), agora, agora.plus(TokenEmail.VALIDADE)));

        String email = usuario.getEmail();
        return enviarAposCommit(() -> emailService.enviarConviteProfessor(email, token));
    }

    /** Use na transação que bloqueia o professor e atualiza seu endereço. */
    @Transactional(propagation = Propagation.MANDATORY)
    public EnvioEmail enviarConfirmacaoDeNovoEmail(Usuario usuario) {
        if (usuario.getRole() != UsuarioRole.PROFESSOR || usuario.isEmailVerificado() || convitePendente(usuario)) {
            throw new IllegalArgumentException("A conta não pode receber confirmação de novo e-mail");
        }

        usuario.exigirConfirmacaoDoNovoEmail();
        String token = verificationTokenService.emitir(usuario, false);
        String email = usuario.getEmail();
        return enviarAposCommit(() -> emailService.enviarConfirmacao(email, token));
    }

    @Transactional
    public void aceitar(String token, String senha) {
        if (senha.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("A senha deve ter no máximo 72 bytes em UTF-8");
        }

        String hash = TokenEmail.hash(token);
        UUID usuarioId = convites.findUsuarioIdByTokenHash(hash)
                .orElseThrow(ConviteProfessorService::conviteInvalido);

        // O mesmo bloqueio usado na reemissão protege a leitura e o consumo do convite.
        Usuario usuario = usuarios.findByIdForUpdate(usuarioId);
        if (usuario == null || !podeAceitarConvite(usuario)) {
            throw conviteInvalido();
        }

        ConviteProfessor convite = convites.findByTokenHash(hash)
                .orElseThrow(ConviteProfessorService::conviteInvalido);
        Instant agora = Instant.now();
        if (!convite.estaAtivo(agora)) {
            throw conviteInvalido();
        }

        usuario.alterarSenha(passwordEncoder.encode(senha));
        usuario.confirmarEmail();
        usuario.ativar();
        convite.marcarComoUsado(agora);
    }

    private static boolean podeAceitarConvite(Usuario usuario) {
        return usuario.getRole() == UsuarioRole.PROFESSOR
                && !usuario.isAtivo()
                && !usuario.isEmailVerificado()
                && !usuario.isConfirmacaoNovoEmailPendente();
    }

    private static IllegalArgumentException conviteInvalido() {
        return new IllegalArgumentException("Convite inválido ou expirado");
    }

    private EnvioEmail enviarAposCommit(Runnable enviar) {
        EnvioEmail resultado = new EnvioEmail();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    enviar.run();
                    resultado.enviado = true;
                } catch (MailException exception) {
                    // A conta e o token já foram persistidos. O reenvio pode emitir um novo token.
                }
            }
        });
        return resultado;
    }

    public static final class EnvioEmail {
        private boolean enviado;

        private EnvioEmail() {
        }

        public boolean foiEnviado() {
            return enviado;
        }
    }
}
