package com.gestao.uep.services;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.gestao.uep.domain.usuario.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Serviço responsável pela geração e validação de tokens JWT.
 * Utiliza a biblioteca Auth0 java-jwt com assinatura HMAC256.
 */
@Service
public class TokenService {

    private static final String ISSUER = "gestao-uep-api";

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
        try {
            Algorithm algoritmo = Algorithm.HMAC256(secret);
            return JWT.create()
                    .withIssuer(ISSUER)
                    .withSubject(usuario.getEmail())
                    .withClaim("nome", usuario.getNome())
                    .withClaim("role", usuario.getRole().name())
                    .withExpiresAt(gerarDataExpiracao())
                    .sign(algoritmo);
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Erro ao gerar token JWT", exception);
        }
    }

    /**
     * Valida o token JWT e extrai o subject (e-mail do usuário).
     *
     * @param token string do token JWT recebido
     * @return e-mail do usuário (subject) ou string vazia se inválido
     */
    public String validarToken(String token) {
        try {
            Algorithm algoritmo = Algorithm.HMAC256(secret);
            return JWT.require(algoritmo)
                    .withIssuer(ISSUER)
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException exception) {
            return "";
        }
    }

    /**
     * Define a data de expiração do token: 2 horas a partir do momento atual.
     */
    private Instant gerarDataExpiracao() {
        return LocalDateTime.now()
                .plusHours(2)
                .toInstant(ZoneOffset.of("-03:00"));
    }
}
