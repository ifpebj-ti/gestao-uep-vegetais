package com.gestao.uep.domain.usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

/**
 * Repositório JPA para a entidade Usuario.
 * Oferece consulta por e-mail para integração com o Spring Security.
 */
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    /**
     * Busca um usuário pelo e-mail para autenticação.
     *
     * @param email e-mail do usuário
     * @return UserDetails correspondente ou null se não encontrado
     */
    Usuario findByEmail(String email);
}
