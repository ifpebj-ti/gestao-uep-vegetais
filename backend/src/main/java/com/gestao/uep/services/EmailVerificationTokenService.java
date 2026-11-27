package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.EmailVerificationToken;
import com.gestao.uep.domain.usuario.EmailVerificationTokenRepository;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class EmailVerificationTokenService {

    private static final Duration INTERVALO_REENVIO = Duration.ofMinutes(1);
    private static final Duration JANELA_REENVIO = Duration.ofHours(1);
    private static final long MAXIMO_REENVIOS_POR_HORA = 5;

    private final EmailVerificationTokenRepository repository;
    private final UsuarioRepository usuarioRepository;

    public EmailVerificationTokenService(
            EmailVerificationTokenRepository repository,
            UsuarioRepository usuarioRepository
    ) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public String emitir(Usuario conta, boolean respeitarLimite) {
        Usuario usuario = usuarioRepository.findByIdAndEmailForUpdate(conta.getId(), conta.getEmail());
        if (usuario == null || usuario.isEmailVerificado() || !podeConfirmarEmail(usuario)) {
            throw new IllegalStateException("A conta não pode receber confirmação de e-mail");
        }

        Instant agora = Instant.now();
        if (respeitarLimite) {
            verificarLimiteDeReenvio(usuario, agora);
        }

        repository.findByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(usuario)
                .forEach(token -> token.invalidar(agora));
        repository.flush();

        String tokenBruto = TokenEmail.gerar();
        repository.save(new EmailVerificationToken(
                usuario,
                TokenEmail.hash(tokenBruto),
                agora,
                agora.plus(TokenEmail.VALIDADE)
        ));
        return tokenBruto;
    }

    @Transactional
    public Usuario confirmar(String tokenBruto) {
        String hash = TokenEmail.hash(tokenBruto);
        UUID usuarioId = repository.findUsuarioIdByTokenHash(hash)
                .orElseThrow(EmailVerificationTokenService::tokenInvalido);

        Usuario usuario = usuarioRepository.findByIdForUpdate(usuarioId);
        if (usuario == null || !podeConfirmarEmail(usuario)) {
            throw tokenInvalido();
        }

        EmailVerificationToken token = repository.findByTokenHash(hash)
                .orElseThrow(EmailVerificationTokenService::tokenInvalido);
        Instant agora = Instant.now();
        if (!token.estaAtivo(agora)) {
            throw tokenInvalido();
        }

        token.marcarComoUsado(agora);
        usuario.confirmarEmail();
        return usuario;
    }

    private static boolean podeConfirmarEmail(Usuario usuario) {
        return usuario.isAtivo() || usuario.isConfirmacaoNovoEmailPendente();
    }

    private static IllegalArgumentException tokenInvalido() {
        return new IllegalArgumentException("Token de confirmacao invalido ou expirado");
    }

    private void verificarLimiteDeReenvio(Usuario usuario, Instant agora) {
        repository.findTopByUsuarioOrderByCriadoEmDesc(usuario)
                .filter(token -> token.getCriadoEm().plus(INTERVALO_REENVIO).isAfter(agora))
                .ifPresent(token -> {
                    throw new IllegalStateException("Aguarde antes de solicitar um novo e-mail");
                });

        long quantidadeRecente = repository.countByUsuarioAndCriadoEmAfter(
                usuario,
                agora.minus(JANELA_REENVIO)
        );
        if (quantidadeRecente >= MAXIMO_REENVIOS_POR_HORA) {
            throw new IllegalStateException("Limite de reenvios atingido");
        }
    }
}
