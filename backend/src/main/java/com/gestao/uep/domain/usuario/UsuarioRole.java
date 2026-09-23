package com.gestao.uep.domain.usuario;

/**
 * Papéis de acesso do sistema.
 * ADMIN: acesso total às funcionalidades administrativas.
 * USUARIO: acesso padrão para agricultores e gestores de hortas.
 */
public enum UsuarioRole {

    ADMIN("admin"),
    USUARIO("usuario");

    private final String role;

    UsuarioRole(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }
}
