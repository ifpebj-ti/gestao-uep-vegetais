package com.gestao.uep.controllers;

import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.dto.LoginDTO;
import com.gestao.uep.domain.usuario.dto.LoginResponseDTO;
import com.gestao.uep.domain.usuario.dto.RegistroDTO;
import com.gestao.uep.domain.usuario.dto.ReenvioConfirmacaoDTO;
import com.gestao.uep.services.EmailInstitucionalService;
import com.gestao.uep.services.EmailService;
import com.gestao.uep.services.EmailVerificationTokenService;
import com.gestao.uep.services.TokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller REST para autenticacao e verificacao de usuarios.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String RESPOSTA_REENVIO =
            "Se a conta puder receber confirmacao, um novo e-mail sera enviado.";

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;
    private final EmailInstitucionalService emailInstitucionalService;
    private final EmailVerificationTokenService verificationTokenService;
    private final EmailService emailService;

    public AuthController(
            AuthenticationManager authenticationManager,
            UsuarioRepository usuarioRepository,
            TokenService tokenService,
            PasswordEncoder passwordEncoder,
            EmailInstitucionalService emailInstitucionalService,
            EmailVerificationTokenService verificationTokenService,
            EmailService emailService
    ) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.tokenService = tokenService;
        this.passwordEncoder = passwordEncoder;
        this.emailInstitucionalService = emailInstitucionalService;
        this.verificationTokenService = verificationTokenService;
        this.emailService = emailService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody @Valid LoginDTO dados) {
        var usernamePassword = new UsernamePasswordAuthenticationToken(
                dados.email(), dados.senha()
        );

        var auth = authenticationManager.authenticate(usernamePassword);
        var usuario = (Usuario) auth.getPrincipal();

        String token = tokenService.gerarToken(usuario);

        return ResponseEntity.ok(
                new LoginResponseDTO(token, usuario.getNome(), usuario.getEmail(), usuario.getRole())
        );
    }

    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@RequestBody @Valid RegistroDTO dados) {
        String email = emailInstitucionalService.normalizar(dados.email());
        var papel = emailInstitucionalService.identificarPapel(email);

        if (papel.isEmpty()) {
            return ResponseEntity.unprocessableEntity()
                    .body(Map.of("erro", "Use um e-mail institucional de aluno ou professor"));
        }

        if (usuarioRepository.findByEmail(email) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("erro", "E-mail ja cadastrado"));
        }

        Usuario novoUsuario = new Usuario(
                dados.nome().trim(),
                email,
                passwordEncoder.encode(dados.senha()),
                papel.get(),
                false
        );
        usuarioRepository.save(novoUsuario);

        try {
            String token = verificationTokenService.emitir(novoUsuario, false);
            emailService.enviarConfirmacao(email, token);
        } catch (MailException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("erro", "Nao foi possivel enviar o e-mail de confirmacao"));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Conta criada. Verifique seu e-mail institucional."));
    }

    @GetMapping("/confirmar-email")
    public ResponseEntity<?> confirmarEmail(@RequestParam String token) {
        try {
            verificationTokenService.confirmar(token);
            return ResponseEntity.ok(Map.of("message", "E-mail confirmado com sucesso"));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", exception.getMessage()));
        }
    }

    @PostMapping("/reenviar-confirmacao")
    public ResponseEntity<?> reenviarConfirmacao(
            @RequestBody @Valid ReenvioConfirmacaoDTO dados
    ) {
        String email = emailInstitucionalService.normalizar(dados.email());
        if (emailInstitucionalService.identificarPapel(email).isEmpty()) {
            return ResponseEntity.accepted().body(Map.of("message", RESPOSTA_REENVIO));
        }
        Usuario usuario = usuarioRepository.findByEmail(email);

        if (usuario == null || usuario.isEnabled()) {
            return ResponseEntity.accepted().body(Map.of("message", RESPOSTA_REENVIO));
        }

        try {
            String token = verificationTokenService.emitir(usuario, true);
            emailService.enviarConfirmacao(email, token);
        } catch (IllegalStateException exception) {
            return ResponseEntity.accepted().body(Map.of("message", RESPOSTA_REENVIO));
        } catch (MailException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("erro", "Nao foi possivel enviar o e-mail de confirmacao"));
        }

        return ResponseEntity.accepted().body(Map.of("message", RESPOSTA_REENVIO));
    }
}
