package com.gestao.uep.services;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.gestao.uep.domain.usuario.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.DisabledException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

/**
 * Serviço responsável pela geração e validação de tokens JWT.
 * Utiliza a biblioteca Auth0 java-jwt com assinatura HMAC256.
 */
@Service
public class TokenService {

    private static final String ISSUER = "gestao-uep-api";
    private static final String VERSAO_SESSAO = "versaoSessao";

    @Value("${api.security.token.secret}")
    private String secret;

    /**
     * Gera um token JWT assinado para o usuário autenticado.
     *
     * @param usuario entidade do usuário autenticado
     * @return string do token JWT
     * @throws RuntimeException se houver falha na criação do token
     */
    public String gerarToken(Usuario usuario) {
        if (!usuario.isEnabled()) {
            throw new DisabledException("A conta não está habilitada");
        }
        try {
            Algorithm algoritmo = Algorithm.HMAC256(secret);
            return JWT.create()
                    .withIssuer(ISSUER)
                    .withSubject(usuario.getId().toString())
                    .withClaim(VERSAO_SESSAO, usuario.getVersaoSessao())
                    .withClaim("nome", usuario.getNome())
                    .withClaim("role", usuario.getRole().name())
                    .withExpiresAt(Instant.now().plus(2, ChronoUnit.HOURS))
                    .sign(algoritmo);
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Erro ao gerar token JWT", exception);
        }
    }

    /** Retorna o subject autenticado (UUID) ou uma string vazia para tokens inválidos. */
    public String validarToken(String token) {
        return validarSessao(token).map(sessao -> sessao.usuarioId().toString()).orElse("");
    }

    public Optional<Sessao> validarSessao(String token) {
        try {
            Algorithm algoritmo = Algorithm.HMAC256(secret);
            var jwt = JWT.require(algoritmo)
                    .withIssuer(ISSUER)
                    .withClaimPresence("sub")
                    .withClaimPresence("exp")
                    .withClaimPresence(VERSAO_SESSAO)
                    .build()
                    .verify(token);
            String subject = jwt.getSubject();
            Long versao = jwt.getClaim(VERSAO_SESSAO).asLong();
            if (subject == null || versao == null) {
                return Optional.empty();
            }
            UUID id = UUID.fromString(subject);
            return id.toString().equalsIgnoreCase(subject)
                    ? Optional.of(new Sessao(id, versao))
                    : Optional.empty();
        } catch (JWTVerificationException | IllegalArgumentException exception) {
            return Optional.empty();
        }
    }

    public record Sessao(UUID usuarioId, long versao) {
    }
}
