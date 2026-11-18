package com.gestao.uep.infra.security;

import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import com.gestao.uep.domain.usuario.dto.LoginDTO;
import com.gestao.uep.services.EmailInstitucionalService;
import jakarta.validation.Validator;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

@Component
public class AdminBootstrap implements ApplicationRunner {

    private final Environment ambiente;
    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    private final EmailInstitucionalService emails;
    private final PasswordEncoder passwordEncoder;
    private final Validator validator;

    public AdminBootstrap(Environment ambiente, JdbcTemplate jdbc, UsuarioRepository usuarios,
                          EmailInstitucionalService emails, PasswordEncoder passwordEncoder, Validator validator) {
        this.ambiente = ambiente;
        this.jdbc = jdbc;
        this.usuarios = usuarios;
        this.emails = emails;
        this.passwordEncoder = passwordEncoder;
        this.validator = validator;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = emails.normalizar(ambiente.getProperty("ADMIN_BOOTSTRAP_EMAIL"));
        String senha = ambiente.getProperty("ADMIN_BOOTSTRAP_PASSWORD");
        if (email.isEmpty() || senha == null || senha.isBlank()) {
            return;
        }

        // Serializa o primeiro provisionamento mesmo com várias instâncias iniciando juntas.
        jdbc.execute("LOCK TABLE usuarios IN SHARE ROW EXCLUSIVE MODE");
        if (usuarios.existsByRole(UsuarioRole.ADMIN)) {
            return;
        }
        if (email.length() > 255 || !validator.validate(new LoginDTO(email, senha)).isEmpty()
                || senha.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("Confira o e-mail de bootstrap e o limite de 72 bytes da senha");
        }
        if (usuarios.findByEmail(email) != null) {
            throw new IllegalStateException("O e-mail de bootstrap já está em uso por outra conta");
        }

        usuarios.save(new Usuario("Administrador", email, passwordEncoder.encode(senha), UsuarioRole.ADMIN, true));
    }
}
