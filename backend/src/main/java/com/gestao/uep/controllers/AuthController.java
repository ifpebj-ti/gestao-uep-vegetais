package com.gestao.uep.controllers;

import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.dto.LoginDTO;
import com.gestao.uep.domain.usuario.dto.LoginResponseDTO;
import com.gestao.uep.domain.usuario.dto.RegistroDTO;
import com.gestao.uep.services.TokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller REST para autenticação de usuários.
 * Expõe endpoints de login e registro em /api/auth.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AuthenticationManager authenticationManager,
            UsuarioRepository usuarioRepository,
            TokenService tokenService,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.tokenService = tokenService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Autentica um usuário e retorna um token JWT.
     *
     * @param dados DTO com e-mail e senha
     * @return 200 com token JWT, nome e e-mail do usuário
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody @Valid LoginDTO dados) {
        var usernamePassword = new UsernamePasswordAuthenticationToken(
                dados.email(), dados.senha()
        );

        var auth = authenticationManager.authenticate(usernamePassword);
        var usuario = (Usuario) auth.getPrincipal();

        String token = tokenService.gerarToken(usuario);

        return ResponseEntity.ok(
                new LoginResponseDTO(token, usuario.getNome(), usuario.getEmail())
        );
    }

    /**
     * Registra um novo usuário no sistema.
     *
     * @param dados DTO com nome, e-mail, senha e role
     * @return 201 se criado com sucesso, 409 se e-mail já existir
     */
    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@RequestBody @Valid RegistroDTO dados) {
        // Verifica se o e-mail já está cadastrado
        if (usuarioRepository.findByEmail(dados.email()) != null) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("{\"erro\": \"E-mail já cadastrado\"}");
        }

        String senhaCriptografada = passwordEncoder.encode(dados.senha());

        var novoUsuario = new Usuario(
                dados.nome(),
                dados.email(),
                senhaCriptografada,
                dados.role()
        );

        usuarioRepository.save(novoUsuario);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
