package com.gestao.uep.domain.usuario;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Entidade JPA representando um usuário do sistema.
 * Implementa UserDetails para integração direta com o Spring Security.
 */
@Entity
@Table(name = "usuarios")
@Getter
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Column(name = "google_subject", unique = true)
    private String googleSubject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UsuarioRole role;

    @Column(name = "email_verificado", nullable = false)
    @ColumnDefault("true")
    private boolean emailVerificado;

    @Column(nullable = false)
    @ColumnDefault("true")
    private boolean ativo = true;

    @Column(length = 12)
    private String uep;

    public Usuario(
            UUID id,
            String nome,
            String email,
            String senhaCriptografada,
            String googleSubject,
            UsuarioRole role,
            boolean emailVerificado
    ) {
        this(nome, email, senhaCriptografada, role, emailVerificado);
        this.id = id;
        this.googleSubject = googleSubject;
    }

    public Usuario(String nome, String email, String senhaCriptografada, UsuarioRole role) {
        this(nome, email, senhaCriptografada, role, true);
    }

    public Usuario(
            String nome,
            String email,
            String senhaCriptografada,
            UsuarioRole role,
            boolean emailVerificado
    ) {
        this.nome = nome;
        this.email = email;
        this.senha = senhaCriptografada;
        this.role = role;
        this.emailVerificado = emailVerificado;
        if (role == UsuarioRole.PROFESSOR) {
            this.uep = "olericultura";
        }
    }

    public void vincularContaGoogle(String subject) {
        this.googleSubject = subject;
    }

    public void alterarNome(String nome) {
        this.nome = nome;
    }

    public void alterarUep(String uep) {
        if (!"olericultura".equals(uep) && !"fruticultura".equals(uep)) {
            throw new IllegalArgumentException("UEP inválida");
        }
        this.uep = uep;
    }

    public void alterarEmail(String email) {
        if (!this.email.equals(email)) {
            this.email = email;
            this.emailVerificado = false;
            this.googleSubject = null;
        }
    }

    public void alterarSenha(String senhaCriptografada) {
        this.senha = senhaCriptografada;
    }

    public void ativar() {
        this.ativo = true;
    }

    public void desativar() {
        this.ativo = false;
    }

    /**
     * Mapeia o role do usuário para GrantedAuthority do Spring Security.
     * ADMIN recebe ambas as authorities: ROLE_ADMIN e ROLE_USUARIO.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (this.role == UsuarioRole.ADMIN) {
            return List.of(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("ROLE_USUARIO")
            );
        }
        return List.of(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
    }

    @Override
    public String getPassword() {
        return this.senha;
    }

    /**
     * O Spring Security usa este método para identificar o usuário.
     * Retornamos o e-mail como identificador único de login.
     */
    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return ativo && emailVerificado;
    }

    public void confirmarEmail() {
        this.emailVerificado = true;
    }
}
