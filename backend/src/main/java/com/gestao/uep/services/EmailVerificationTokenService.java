package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.EmailVerificationToken;
import com.gestao.uep.domain.usuario.EmailVerificationTokenRepository;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
public class EmailVerificationTokenService {

    private static final Duration VALIDADE = Duration.ofHours(24);
    private static final Duration INTERVALO_REENVIO = Duration.ofMinutes(1);
    private static final Duration JANELA_REENVIO = Duration.ofHours(1);
    private static final long MAXIMO_REENVIOS_POR_HORA = 5;

    private final EmailVerificationTokenRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationTokenService(
            EmailVerificationTokenRepository repository,
            UsuarioRepository usuarioRepository
    ) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public String emitir(Usuario usuario, boolean respeitarLimite) {
        Usuario usuarioBloqueado = usuarioRepository.findByIdForUpdate(usuario.getId());
        if (usuarioBloqueado != null) {
            usuario = usuarioBloqueado;
        }
        Instant agora = Instant.now();

        if (respeitarLimite) {
            verificarLimiteDeReenvio(usuario, agora);
        }

        repository.findByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(usuario)
                .forEach(token -> token.invalidar(agora));
        repository.flush();

        String tokenBruto = gerarToken();
        repository.save(new EmailVerificationToken(
                usuario,
                hash(tokenBruto),
                agora,
                agora.plus(VALIDADE)
        ));
        return tokenBruto;
    }

    @Transactional
    public Usuario confirmar(String tokenBruto) {
        EmailVerificationToken token = repository.findByTokenHash(hash(tokenBruto))
                .orElseThrow(() -> new IllegalArgumentException("Token de confirmacao invalido ou expirado"));

        Instant agora = Instant.now();
        if (!token.estaAtivo(agora)) {
            throw new IllegalArgumentException("Token de confirmacao invalido ou expirado");
        }

        token.marcarComoUsado(agora);
        token.getUsuario().confirmarEmail();
        return token.getUsuario();
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

    private String gerarToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexadecimal = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                hexadecimal.append(String.format("%02x", value));
            }
            return hexadecimal.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Algoritmo de hash indisponivel", exception);
        }
    }
}
